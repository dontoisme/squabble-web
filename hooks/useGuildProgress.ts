'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Progress, GuildMember } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';

export interface GhostProgress {
  userId: string;
  displayName: string;
  progressPercent: number;
  progressTimestamp: number;
}

export function useGuildProgress(bookId: string | undefined, members: GuildMember[]) {
  const { user, userDoc } = useAuth();
  const [guildProgress, setGuildProgress] = useState<GhostProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const guildId = userDoc?.currentGuildId;

  useEffect(() => {
    if (!guildId || !bookId || !user) {
      setGuildProgress([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query all progress documents for this book in the guild
    // Progress doc IDs are {bookId}_{userId}, so we query by bookId field
    const progressRef = collection(db, 'guilds', guildId, 'progress');
    const q = query(progressRef, where('bookId', '==', bookId));

    const unsub = onSnapshot(q, (snap) => {
      const progressList: GhostProgress[] = [];

      snap.docs.forEach((doc) => {
        const data = doc.data() as Progress;

        // Skip current user's progress (they see their own progress separately)
        if (data.userId === user.uid) return;

        // Find display name from members
        const member = members.find((m) => m.id === data.userId);
        const displayName = member?.displayName || data.userEmail?.split('@')[0] || 'User';

        progressList.push({
          userId: data.userId,
          displayName,
          progressPercent: data.progressPercent,
          progressTimestamp: data.progressTimestamp,
        });
      });

      // Sort by progress (most behind first, then most ahead)
      progressList.sort((a, b) => a.progressPercent - b.progressPercent);

      setGuildProgress(progressList);
      setLoading(false);
    });

    return () => unsub();
  }, [guildId, bookId, user, members]);

  return {
    guildProgress,
    loading,
  };
}
