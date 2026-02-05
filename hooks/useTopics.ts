'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { useGuild } from './useGuild';

// ============================================================================
// Types
// ============================================================================

export const TOPIC_DESCRIPTION_MAX_LENGTH = 500;
export const TOPIC_REPLY_MAX_LENGTH = 1000;

export interface Topic {
  id: string;
  bookId: string;
  bookTitle: string;
  title: string;
  description?: string;
  unlockTimestamp: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  replyCount: number;
  lastActivityAt: Date;
}

export interface TopicReply {
  id: string;
  topicId: string;
  text: string;
  unlockTimestamp: number;
  userId: string;
  userDisplayName: string;
  createdAt: Date;
}

export interface TopicWithVisibility extends Topic {
  isVisible: boolean;
  isOwn: boolean;
}

export interface ReplyWithVisibility extends TopicReply {
  isVisible: boolean;
  isOwn: boolean;
}

// ============================================================================
// Firestore conversion helpers
// ============================================================================

function topicFromFirestore(docId: string, data: Record<string, unknown>): Topic | null {
  const bookId = data.bookId as string | undefined;
  const bookTitle = data.bookTitle as string | undefined;
  const title = data.title as string | undefined;
  const unlockTimestamp = data.unlockTimestamp as number | undefined;
  const createdBy = data.createdBy as string | undefined;
  const createdByName = data.createdByName as string | undefined;

  if (!bookId || !bookTitle || !title || unlockTimestamp === undefined || !createdBy || !createdByName) {
    return null;
  }

  const createdAtRaw = data.createdAt as { toDate?: () => Date } | undefined;
  const lastActivityAtRaw = data.lastActivityAt as { toDate?: () => Date } | undefined;

  return {
    id: docId,
    bookId,
    bookTitle,
    title,
    description: data.description as string | undefined,
    unlockTimestamp,
    createdBy,
    createdByName,
    createdAt: createdAtRaw?.toDate?.() ?? new Date(),
    replyCount: (data.replyCount as number) ?? 0,
    lastActivityAt: lastActivityAtRaw?.toDate?.() ?? createdAtRaw?.toDate?.() ?? new Date(),
  };
}

function replyFromFirestore(docId: string, data: Record<string, unknown>, topicId: string): TopicReply | null {
  const text = data.text as string | undefined;
  const unlockTimestamp = data.unlockTimestamp as number | undefined;
  const userId = data.userId as string | undefined;
  const userDisplayName = data.userDisplayName as string | undefined;

  if (!text || unlockTimestamp === undefined || !userId || !userDisplayName) {
    return null;
  }

  const createdAtRaw = data.createdAt as { toDate?: () => Date } | undefined;

  return {
    id: docId,
    topicId,
    text,
    unlockTimestamp,
    userId,
    userDisplayName,
    createdAt: createdAtRaw?.toDate?.() ?? new Date(),
  };
}

// ============================================================================
// useTopics hook — subscribe to topics for a book
// ============================================================================

export function useTopics(bookId: string | undefined, userProgressTimestamp: number) {
  const { user } = useAuth();
  const { guild, hasGuild } = useGuild();
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const guildId = guild?.id;

  useEffect(() => {
    if (!guildId || !bookId) {
      setAllTopics([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const topicsRef = collection(db, 'guilds', guildId, 'topics');
    const q = query(
      topicsRef,
      where('bookId', '==', bookId),
      orderBy('lastActivityAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const topics: Topic[] = [];
      snap.docs.forEach((docSnap) => {
        const topic = topicFromFirestore(docSnap.id, docSnap.data());
        if (topic) topics.push(topic);
      });
      setAllTopics(topics);
      setLoading(false);
    }, (error) => {
      console.error('Topics query error:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [guildId, bookId]);

  // Calculate visibility
  const topicsWithVisibility: TopicWithVisibility[] = allTopics.map((topic) => ({
    ...topic,
    isOwn: topic.createdBy === user?.uid,
    isVisible: topic.createdBy === user?.uid || userProgressTimestamp >= topic.unlockTimestamp,
  }));

  const visibleTopics = topicsWithVisibility.filter((t) => t.isVisible);
  const hiddenCount = topicsWithVisibility.filter((t) => !t.isVisible).length;

  // Create topic
  const createTopic = useCallback(async (
    bookTitle: string,
    title: string,
    unlockTimestamp: number,
    description?: string,
  ) => {
    if (!user || !guildId || !bookId) throw new Error('Cannot create topic');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error('Topic title cannot be empty');
    if (description && description.length > TOPIC_DESCRIPTION_MAX_LENGTH) {
      throw new Error(`Description cannot exceed ${TOPIC_DESCRIPTION_MAX_LENGTH} characters`);
    }

    const displayName = user.email?.split('@')[0] || 'User';
    const topicsRef = collection(db, 'guilds', guildId, 'topics');

    const topicData: Record<string, unknown> = {
      bookId,
      bookTitle,
      title: trimmedTitle,
      unlockTimestamp,
      createdBy: user.uid,
      createdByName: displayName,
      createdAt: serverTimestamp(),
      replyCount: 0,
      lastActivityAt: serverTimestamp(),
    };

    if (description?.trim()) {
      topicData.description = description.trim();
    }

    await addDoc(topicsRef, topicData);
  }, [user, guildId, bookId]);

  // Delete topic (and all replies)
  const deleteTopic = useCallback(async (topicId: string) => {
    if (!user || !guildId) throw new Error('Cannot delete topic');

    const topic = allTopics.find((t) => t.id === topicId);
    if (!topic) throw new Error('Topic not found');
    if (topic.createdBy !== user.uid) throw new Error('Can only delete your own topics');

    const batch = writeBatch(db);

    // Delete all replies
    const repliesRef = collection(db, 'guilds', guildId, 'topics', topicId, 'replies');
    const repliesSnapshot = await getDocs(repliesRef);
    repliesSnapshot.docs.forEach((replyDoc) => {
      batch.delete(replyDoc.ref);
    });

    // Delete the topic
    const topicRef = doc(db, 'guilds', guildId, 'topics', topicId);
    batch.delete(topicRef);

    await batch.commit();
  }, [user, guildId, allTopics]);

  return {
    topics: topicsWithVisibility,
    visibleTopics,
    hiddenCount,
    loading,
    createTopic,
    deleteTopic,
  };
}

// ============================================================================
// useTopicReplies hook — subscribe to replies for a topic
// ============================================================================

export function useTopicReplies(
  topicId: string | undefined,
  bookId: string | undefined,
  userProgressTimestamp: number
) {
  const { user } = useAuth();
  const { guild } = useGuild();
  const [allReplies, setAllReplies] = useState<TopicReply[]>([]);
  const [loading, setLoading] = useState(true);

  const guildId = guild?.id;

  useEffect(() => {
    if (!guildId || !topicId) {
      setAllReplies([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const repliesRef = collection(db, 'guilds', guildId, 'topics', topicId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      const replies: TopicReply[] = [];
      snap.docs.forEach((docSnap) => {
        const reply = replyFromFirestore(docSnap.id, docSnap.data(), topicId);
        if (reply) replies.push(reply);
      });
      setAllReplies(replies);
      setLoading(false);
    }, (error) => {
      console.error('Replies query error:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [guildId, topicId]);

  // Calculate visibility
  const repliesWithVisibility: ReplyWithVisibility[] = allReplies.map((reply) => ({
    ...reply,
    isOwn: reply.userId === user?.uid,
    isVisible: reply.userId === user?.uid || userProgressTimestamp >= reply.unlockTimestamp,
  }));

  // Post reply
  const postReply = useCallback(async (text: string, unlockTimestamp: number) => {
    if (!user || !guildId || !topicId || !bookId) throw new Error('Cannot post reply');

    const trimmedText = text.trim();
    if (!trimmedText) throw new Error('Reply cannot be empty');
    if (trimmedText.length > TOPIC_REPLY_MAX_LENGTH) {
      throw new Error(`Reply cannot exceed ${TOPIC_REPLY_MAX_LENGTH} characters`);
    }

    const displayName = user.email?.split('@')[0] || 'User';
    const repliesRef = collection(db, 'guilds', guildId, 'topics', topicId, 'replies');

    await addDoc(repliesRef, {
      text: trimmedText,
      unlockTimestamp,
      userId: user.uid,
      userDisplayName: displayName,
      createdAt: serverTimestamp(),
    });

    // Update topic's reply count and last activity
    const topicRef = doc(db, 'guilds', guildId, 'topics', topicId);
    await updateDoc(topicRef, {
      replyCount: increment(1),
      lastActivityAt: serverTimestamp(),
    });
  }, [user, guildId, topicId, bookId]);

  // Delete reply
  const deleteReply = useCallback(async (replyId: string) => {
    if (!user || !guildId || !topicId) throw new Error('Cannot delete reply');

    const reply = allReplies.find((r) => r.id === replyId);
    if (!reply) throw new Error('Reply not found');
    if (reply.userId !== user.uid) throw new Error('Can only delete your own replies');

    const replyRef = doc(db, 'guilds', guildId, 'topics', topicId, 'replies', replyId);
    await deleteDoc(replyRef);

    // Decrement reply count
    const topicRef = doc(db, 'guilds', guildId, 'topics', topicId);
    await updateDoc(topicRef, {
      replyCount: increment(-1),
      lastActivityAt: serverTimestamp(),
    });
  }, [user, guildId, topicId, allReplies]);

  return {
    replies: repliesWithVisibility,
    loading,
    postReply,
    deleteReply,
  };
}
