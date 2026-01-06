'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Note, NOTE_MAX_CHARS } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Book } from '@/lib/books/types';

export interface NoteWithVisibility extends Note {
  isVisible: boolean;
  isOwn: boolean;
}

export function useNotes(book: Book | undefined, userProgressSeconds: number) {
  const { user, userDoc } = useAuth();
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const guildId = userDoc?.currentGuildId;
  const bookId = book?.id;

  // Listen to all notes for this book (we filter visibility client-side)
  useEffect(() => {
    if (!guildId || !bookId) {
      setAllNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const commentsRef = collection(db, 'guilds', guildId, 'comments');
    const q = query(
      commentsRef,
      where('bookId', '==', bookId),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const notes = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setAllNotes(notes);
      setLoading(false);
    });

    return () => unsub();
  }, [guildId, bookId]);

  // Calculate visibility for each note
  const notesWithVisibility: NoteWithVisibility[] = allNotes.map(note => ({
    ...note,
    isOwn: note.userId === user?.uid,
    // Visible if: own note OR user's progress >= note's timestamp
    isVisible: note.userId === user?.uid || note.timestamp <= userProgressSeconds,
  }));

  // Separate visible and hidden notes
  const visibleNotes = notesWithVisibility.filter(n => n.isVisible);
  const hiddenNotes = notesWithVisibility.filter(n => !n.isVisible);

  // Post a new note
  const postNote = useCallback(async (text: string, timestampSeconds: number) => {
    if (!user || !guildId || !book) {
      throw new Error('Cannot post note');
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Note cannot be empty');
    }
    if (trimmedText.length > NOTE_MAX_CHARS) {
      throw new Error(`Note exceeds ${NOTE_MAX_CHARS} characters`);
    }

    const displayName = user.email?.split('@')[0] || 'User';

    const noteData = {
      bookId: book.id,
      bookTitle: book.title,
      userId: user.uid,
      userDisplayName: displayName,
      timestamp: timestampSeconds,
      text: trimmedText,
      createdAt: serverTimestamp(),
    };

    const commentsRef = collection(db, 'guilds', guildId, 'comments');
    await addDoc(commentsRef, noteData);
  }, [user, guildId, book]);

  // Delete own note
  const deleteNote = useCallback(async (noteId: string) => {
    if (!user || !guildId) {
      throw new Error('Cannot delete note');
    }

    const note = allNotes.find(n => n.id === noteId);
    if (!note) {
      throw new Error('Note not found');
    }
    if (note.userId !== user.uid) {
      throw new Error('Can only delete your own notes');
    }

    const noteRef = doc(db, 'guilds', guildId, 'comments', noteId);
    await deleteDoc(noteRef);
  }, [user, guildId, allNotes]);

  return {
    notes: notesWithVisibility,
    visibleNotes,
    hiddenNotes,
    hiddenCount: hiddenNotes.length,
    loading,
    postNote,
    deleteNote,
  };
}
