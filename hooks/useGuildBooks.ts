import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useGuild } from './useGuild';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Book status in the guild library
 */
export type GuildBookStatus = 'reading' | 'queued' | 'finished';

/**
 * Member ownership info
 */
export interface MemberOwnership {
  hasBook: boolean;
  progressPercent?: number;
  lastSynced?: Date;
  isCompleted?: boolean;
  completedAt?: Date;
  completionCount?: number;
  currentRun?: number;
}

/**
 * A book in the guild's library
 */
export interface GuildBook {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  addedBy: string;
  addedAt: Date;
  status: GuildBookStatus;
  queuePosition: number;
  finishedAt?: Date;
  totalComments?: number;
  memberOwnership: Record<string, MemberOwnership>;
}

/**
 * Convert Firestore document to GuildBook
 */
function guildBookFromFirestore(
  id: string,
  data: Record<string, unknown>
): GuildBook | null {
  const title = data.title as string | undefined;
  const addedBy = data.addedBy as string | undefined;
  const status = data.status as GuildBookStatus | undefined;

  if (!title || !addedBy || !status) {
    return null;
  }

  const addedAtRaw = data.addedAt as { toDate?: () => Date } | undefined;
  const addedAt = addedAtRaw?.toDate?.() ?? new Date();

  const finishedAtRaw = data.finishedAt as { toDate?: () => Date } | undefined;
  const finishedAt = finishedAtRaw?.toDate?.();

  const ownershipRaw = (data.memberOwnership as Record<string, unknown>) || {};
  const memberOwnership: Record<string, MemberOwnership> = {};

  for (const [userId, ownershipData] of Object.entries(ownershipRaw)) {
    const od = ownershipData as Record<string, unknown>;
    const lastSyncedRaw = od.lastSynced as { toDate?: () => Date } | undefined;
    const completedAtRaw = od.completedAt as { toDate?: () => Date } | undefined;

    memberOwnership[userId] = {
      hasBook: (od.hasBook as boolean) ?? false,
      progressPercent: od.progressPercent as number | undefined,
      lastSynced: lastSyncedRaw?.toDate?.(),
      isCompleted: od.isCompleted as boolean | undefined,
      completedAt: completedAtRaw?.toDate?.(),
      completionCount: od.completionCount as number | undefined,
      currentRun: od.currentRun as number | undefined,
    };
  }

  return {
    id,
    title,
    author: data.author as string | undefined,
    coverUrl: data.coverUrl as string | undefined,
    addedBy,
    addedAt,
    status,
    queuePosition: (data.queuePosition as number) ?? 0,
    finishedAt,
    totalComments: data.totalComments as number | undefined,
    memberOwnership,
  };
}

/**
 * Sort books: reading first, then queued by position, then finished by date
 */
function sortGuildBooks(books: GuildBook[]): GuildBook[] {
  return [...books].sort((a, b) => {
    if (a.status === 'reading' && b.status !== 'reading') return -1;
    if (b.status === 'reading' && a.status !== 'reading') return 1;
    if (a.status === 'queued' && b.status === 'finished') return -1;
    if (b.status === 'queued' && a.status === 'finished') return 1;
    if (a.status === 'queued' && b.status === 'queued') {
      return a.queuePosition - b.queuePosition;
    }
    if (a.status === 'finished' && b.status === 'finished') {
      return (b.finishedAt?.getTime() || 0) - (a.finishedAt?.getTime() || 0);
    }
    return 0;
  });
}

/**
 * Hook to fetch and subscribe to guild books from Firestore
 */
export function useGuildBooks() {
  const { guild, hasGuild } = useGuild();
  const { user } = useAuth();
  const [books, setBooks] = useState<GuildBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasGuild || !guild?.id) {
      setBooks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const booksRef = collection(db, 'guilds', guild.id, 'books');
    const q = query(booksRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const guildBooks: GuildBook[] = [];

        snapshot.docs.forEach((docSnap) => {
          const book = guildBookFromFirestore(docSnap.id, docSnap.data());
          if (book) {
            guildBooks.push(book);
          }
        });

        setBooks(sortGuildBooks(guildBooks));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching guild books:', err);
        setError('Failed to load guild books');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [guild?.id, hasGuild]);

  // Derived data
  const currentBook = books.find((b) => b.status === 'reading') || null;
  const queuedBooks = books.filter((b) => b.status === 'queued');
  const finishedBooks = books.filter((b) => b.status === 'finished');

  // Update a book's cover URL (for backfilling old books)
  const updateBookCoverUrl = useCallback(async (bookId: string, coverUrl: string) => {
    if (!guild?.id) return;
    try {
      const bookRef = doc(db, 'guilds', guild.id, 'books', bookId);
      await updateDoc(bookRef, { coverUrl });
    } catch (err) {
      console.error('Failed to update book cover URL:', err);
    }
  }, [guild?.id]);

  // Remove a book from the guild library
  const removeBook = useCallback(async (bookId: string) => {
    if (!guild?.id) return;
    const bookRef = doc(db, 'guilds', guild.id, 'books', bookId);
    await deleteDoc(bookRef);
  }, [guild?.id]);

  // Set a book as the current reading book
  const setCurrentBook = useCallback(async (bookId: string) => {
    if (!guild?.id) return;
    const booksRef = collection(db, 'guilds', guild.id, 'books');
    const batch = writeBatch(db);

    // Move any currently reading book back to queued
    const currentQuery = query(booksRef, where('status', '==', 'reading'));
    const currentSnapshot = await getDocs(currentQuery);
    currentSnapshot.docs.forEach((bookDoc) => {
      if (bookDoc.id !== bookId) {
        batch.update(bookDoc.ref, { status: 'queued', queuePosition: 1 });
      }
    });

    // Set the new book as reading
    const bookRef = doc(db, 'guilds', guild.id, 'books', bookId);
    batch.update(bookRef, { status: 'reading', queuePosition: 0 });

    // Update guild's currentBookTitle
    const bookDoc = await getDoc(bookRef);
    if (bookDoc.exists()) {
      const guildRef = doc(db, 'guilds', guild.id);
      batch.update(guildRef, {
        currentBookId: bookId,
        currentBookTitle: bookDoc.data().title,
      });
    }

    await batch.commit();
  }, [guild?.id]);

  // Finish the current book and auto-promote next in queue
  const finishCurrentBook = useCallback(async () => {
    if (!guild?.id) return;
    const booksRef = collection(db, 'guilds', guild.id, 'books');
    const batch = writeBatch(db);

    const currentQuery = query(booksRef, where('status', '==', 'reading'));
    const currentSnapshot = await getDocs(currentQuery);
    if (currentSnapshot.empty) return;

    const currentBookDoc = currentSnapshot.docs[0];
    batch.update(currentBookDoc.ref, {
      status: 'finished',
      finishedAt: serverTimestamp(),
      queuePosition: -1,
    });

    // Find next in queue
    const queueQuery = query(
      booksRef,
      where('status', '==', 'queued'),
      orderBy('queuePosition', 'asc')
    );
    const queueSnapshot = await getDocs(queueQuery);
    const guildRef = doc(db, 'guilds', guild.id);

    if (!queueSnapshot.empty) {
      const nextBookDoc = queueSnapshot.docs[0];
      batch.update(nextBookDoc.ref, { status: 'reading', queuePosition: 0 });
      batch.update(guildRef, {
        currentBookId: nextBookDoc.id,
        currentBookTitle: nextBookDoc.data().title,
      });
    } else {
      batch.update(guildRef, { currentBookId: null, currentBookTitle: null });
    }

    await batch.commit();
  }, [guild?.id]);

  // Reorder the queue
  const reorderQueue = useCallback(async (bookIds: string[]) => {
    if (!guild?.id) return;
    const batch = writeBatch(db);
    bookIds.forEach((bookId, index) => {
      const bookRef = doc(db, 'guilds', guild.id!, 'books', bookId);
      batch.update(bookRef, { queuePosition: index + 1 });
    });
    await batch.commit();
  }, [guild?.id]);

  // Update a member's ownership status for a book
  const updateMemberOwnership = useCallback(async (
    bookId: string,
    hasBook: boolean,
    progressPercent?: number
  ) => {
    if (!guild?.id || !user?.uid) return;
    const bookRef = doc(db, 'guilds', guild.id, 'books', bookId);
    const updateData: Record<string, unknown> = {
      [`memberOwnership.${user.uid}.hasBook`]: hasBook,
      [`memberOwnership.${user.uid}.lastSynced`]: serverTimestamp(),
    };
    if (progressPercent !== undefined) {
      updateData[`memberOwnership.${user.uid}.progressPercent`] = progressPercent;
    }
    await updateDoc(bookRef, updateData);
  }, [guild?.id, user?.uid]);

  // Mark a book as completed
  const markBookCompleted = useCallback(async (bookId: string) => {
    if (!guild?.id || !user?.uid) return;
    const bookRef = doc(db, 'guilds', guild.id, 'books', bookId);
    const bookDoc = await getDoc(bookRef);
    if (!bookDoc.exists()) return;

    const data = bookDoc.data();
    const currentOwnership = data.memberOwnership?.[user.uid] || {};
    const currentCount = (currentOwnership.completionCount as number) || 0;

    await updateDoc(bookRef, {
      [`memberOwnership.${user.uid}.isCompleted`]: true,
      [`memberOwnership.${user.uid}.completedAt`]: serverTimestamp(),
      [`memberOwnership.${user.uid}.completionCount`]: currentCount + 1,
      [`memberOwnership.${user.uid}.progressPercent`]: 100,
    });
  }, [guild?.id, user?.uid]);

  return {
    books,
    currentBook,
    queuedBooks,
    finishedBooks,
    loading,
    error,
    hasBooks: books.length > 0,
    updateBookCoverUrl,
    removeBook,
    setCurrentBook,
    finishCurrentBook,
    reorderQueue,
    updateMemberOwnership,
    markBookCompleted,
  };
}

/**
 * Get a book by ID from the guild books
 */
export function useGuildBook(bookId: string | undefined) {
  const {
    books, loading, error, updateBookCoverUrl,
    removeBook, setCurrentBook, finishCurrentBook,
    updateMemberOwnership, markBookCompleted,
  } = useGuildBooks();

  const book = bookId ? books.find((b) => b.id === bookId) : null;

  return {
    book,
    loading,
    error,
    updateBookCoverUrl,
    removeBook,
    setCurrentBook,
    finishCurrentBook,
    updateMemberOwnership,
    markBookCompleted,
  };
}
