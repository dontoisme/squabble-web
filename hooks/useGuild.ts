'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Guild, GuildMember } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';

// Generate invite code matching iOS pattern (excludes 0, O, I, 1)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useGuild() {
  const { user, userDoc, refreshUserDoc } = useAuth();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const guildId = userDoc?.currentGuildId;

  // Listen to guild changes
  useEffect(() => {
    if (!guildId) {
      setGuild(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to guild document
    const guildRef = doc(db, 'guilds', guildId);
    const unsubGuild = onSnapshot(guildRef, (snap) => {
      if (snap.exists()) {
        setGuild({ id: snap.id, ...snap.data() } as Guild);
      } else {
        setGuild(null);
      }
      setLoading(false);
    });

    // Listen to members collection
    const membersRef = collection(db, 'guilds', guildId, 'members');
    const unsubMembers = onSnapshot(membersRef, (snap) => {
      const memberList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GuildMember[];
      setMembers(memberList.sort((a, b) => {
        // Owner first, then alphabetically
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (b.role === 'owner' && a.role !== 'owner') return 1;
        return a.displayName.localeCompare(b.displayName);
      }));
    });

    return () => {
      unsubGuild();
      unsubMembers();
    };
  }, [guildId]);

  // Create a new guild
  const createGuild = useCallback(async (name: string) => {
    console.log('[createGuild] Starting...', { user: user?.uid, email: user?.email });

    if (!user) throw new Error('Must be signed in');

    setError(null);
    try {
      const guildId = crypto.randomUUID();
      const inviteCode = generateInviteCode();
      const displayName = user.email?.split('@')[0] || 'User';

      console.log('[createGuild] Step 1: Creating guild doc...', { guildId, inviteCode });
      // Create guild document
      const guildRef = doc(db, 'guilds', guildId);
      await setDoc(guildRef, {
        name,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        inviteCode,
        memberCount: 1,
      });
      console.log('[createGuild] Step 1: SUCCESS');

      console.log('[createGuild] Step 2: Creating member doc...');
      // Add creator as owner member
      const memberRef = doc(db, 'guilds', guildId, 'members', user.uid);
      await setDoc(memberRef, {
        displayName,
        email: user.email,
        role: 'owner',
        joinedAt: serverTimestamp(),
      });
      console.log('[createGuild] Step 2: SUCCESS');

      console.log('[createGuild] Step 3: Updating user doc...');
      // Update user's currentGuildId (use setDoc with merge in case doc doesn't exist)
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { currentGuildId: guildId, email: user.email }, { merge: true });
      console.log('[createGuild] Step 3: SUCCESS');

      await refreshUserDoc();
      console.log('[createGuild] COMPLETE!');
      return guildId;
    } catch (err) {
      console.error('[createGuild] FAILED:', err);
      const message = err instanceof Error ? err.message : 'Failed to create guild';
      setError(message);
      throw err;
    }
  }, [user, refreshUserDoc]);

  // Join an existing guild by invite code
  const joinGuild = useCallback(async (inviteCode: string) => {
    if (!user) throw new Error('Must be signed in');

    setError(null);
    try {
      // Find guild by invite code (case-insensitive)
      const guildsRef = collection(db, 'guilds');
      const q = query(guildsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error('Invalid invite code');
      }

      const guildDoc = snap.docs[0];
      const foundGuildId = guildDoc.id;

      // Check if already a member
      const memberRef = doc(db, 'guilds', foundGuildId, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        throw new Error('Already a member of this guild');
      }

      const displayName = user.email?.split('@')[0] || 'User';

      // Add as member
      await setDoc(memberRef, {
        displayName,
        email: user.email,
        role: 'member',
        joinedAt: serverTimestamp(),
      });

      // Increment member count
      const guildRef = doc(db, 'guilds', foundGuildId);
      await updateDoc(guildRef, {
        memberCount: increment(1),
      });

      // Update user's currentGuildId (use setDoc with merge in case doc doesn't exist)
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { currentGuildId: foundGuildId, email: user.email }, { merge: true });

      await refreshUserDoc();
      return foundGuildId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join guild';
      setError(message);
      throw err;
    }
  }, [user, refreshUserDoc]);

  // Leave current guild
  const leaveGuild = useCallback(async () => {
    if (!user || !guildId) throw new Error('Not in a guild');

    // Check if owner
    const currentMember = members.find(m => m.id === user.uid);
    if (currentMember?.role === 'owner') {
      throw new Error('Owners cannot leave. Transfer ownership first.');
    }

    setError(null);
    try {
      // Remove member document
      const memberRef = doc(db, 'guilds', guildId, 'members', user.uid);
      await setDoc(memberRef, {}, { merge: false }); // Delete by overwriting

      // Decrement member count
      const guildRef = doc(db, 'guilds', guildId);
      await updateDoc(guildRef, {
        memberCount: increment(-1),
      });

      // Clear user's currentGuildId (use setDoc with merge in case doc doesn't exist)
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { currentGuildId: null, email: user.email }, { merge: true });

      await refreshUserDoc();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave guild';
      setError(message);
      throw err;
    }
  }, [user, guildId, members, refreshUserDoc]);

  return {
    guild,
    members,
    loading,
    error,
    createGuild,
    joinGuild,
    leaveGuild,
    hasGuild: !!guild,
    isOwner: members.some(m => m.id === user?.uid && m.role === 'owner'),
  };
}
