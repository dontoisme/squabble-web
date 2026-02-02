import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useGuild } from './useGuild';

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

        snapshot.docs.forEach((doc) => {
          const book = guildBookFromFirestore(doc.id, doc.data());
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

  return {
    books,
    currentBook,
    queuedBooks,
    finishedBooks,
    loading,
    error,
    hasBooks: books.length > 0,
  };
}

/**
 * Get a book by ID from the guild books
 */
export function useGuildBook(bookId: string | undefined) {
  const { books, loading, error } = useGuildBooks();

  const book = bookId ? books.find((b) => b.id === bookId) : null;

  return {
    book,
    loading,
    error,
  };
}
