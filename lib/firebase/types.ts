import { Timestamp } from 'firebase/firestore';

// Matches Guild.swift
export interface Guild {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  inviteCode: string;
  memberCount: number;
}

// Matches GuildMember in Guild.swift
export interface GuildMember {
  id: string;
  displayName: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
}

// Matches progress document in SquabbleSyncService.swift
export interface Progress {
  bookId: string;
  bookTitle: string;
  userId: string;
  userEmail: string;
  progressPercent: number;
  progressTimestamp: number; // seconds
  totalDuration: number;
  lastUpdatedAt: Timestamp;
  isActive: boolean;
}

// Matches Comment.swift
export interface Note {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userDisplayName: string;
  timestamp: number; // seconds from book start
  text: string;
  createdAt: Timestamp;
}

// User document
export interface UserDoc {
  email: string;
  currentGuildId?: string;
}

// Max character limit for notes (matches iOS)
export const NOTE_MAX_CHARS = 280;
