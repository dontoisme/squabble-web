'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Progress } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Book } from '@/lib/books/types';
import { calculateProgressPercent } from '@/lib/utils/time';

export function useProgress(book: Book | undefined) {
  const { user, userDoc } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const guildId = userDoc?.currentGuildId;
  const bookId = book?.id;

  // Document ID matches iOS pattern: {bookId}_{userId}
  const progressDocId = bookId && user ? `${bookId}_${user.uid}` : null;

  // Listen to progress changes
  useEffect(() => {
    if (!guildId || !progressDocId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const progressRef = doc(db, 'guilds', guildId, 'progress', progressDocId);
    const unsub = onSnapshot(progressRef, (snap) => {
      if (snap.exists()) {
        setProgress(snap.data() as Progress);
      } else {
        setProgress(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [guildId, progressDocId]);

  // Update progress
  // For books with duration (mobile/local audio), pass timestamp in seconds.
  // For books without duration (web/Hardcover), pass percentage directly (0-100).
  const updateProgress = useCallback(async (timestampOrPercent: number) => {
    if (!user || !guildId || !book || !progressDocId) {
      throw new Error('Cannot update progress');
    }

    const hasDuration = book.totalDurationSeconds > 0;
    const progressPercent = hasDuration
      ? calculateProgressPercent(timestampOrPercent, book.totalDurationSeconds)
      : Math.min(100, Math.max(0, timestampOrPercent));
    const progressTimestamp = hasDuration ? timestampOrPercent : 0;

    const progressData: Omit<Progress, 'lastUpdatedAt'> & { lastUpdatedAt: ReturnType<typeof serverTimestamp> } = {
      bookId: book.id,
      bookTitle: book.title,
      userId: user.uid,
      userEmail: user.email || '',
      progressPercent,
      progressTimestamp,
      totalDuration: book.totalDurationSeconds,
      lastUpdatedAt: serverTimestamp(),
      isActive: true,
    };

    const progressRef = doc(db, 'guilds', guildId, 'progress', progressDocId);
    await setDoc(progressRef, progressData);
  }, [user, guildId, book, progressDocId]);

  return {
    progress,
    loading,
    updateProgress,
    progressSeconds: progress?.progressTimestamp ?? 0,
    progressPercent: progress?.progressPercent ?? 0,
  };
}
