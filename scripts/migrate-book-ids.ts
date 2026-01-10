/**
 * Migration script to update legacy book IDs to new deterministic format
 *
 * Run this from the browser console when logged in as an admin user.
 *
 * This migrates:
 * 1. Comments (guilds/{guildId}/comments) - updates bookId field
 * 2. Progress (guilds/{guildId}/progress) - updates document ID and bookId field
 *
 * Usage:
 *   1. Import this in the console or add a temporary admin page
 *   2. Call migrateGuildBookIds(guildId) with your guild ID
 */

import {
  collection,
  getDocs,
  doc,
  writeBatch,
  query,
  where,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { LEGACY_ID_MAP } from '../lib/books/bookId';

// The legacy to new ID mapping
const ID_MAPPING: Record<string, string> = {
  'mage-tank-1': LEGACY_ID_MAP['mage-tank-1'],
  'mage-tank-2': LEGACY_ID_MAP['mage-tank-2'],
  'mage-tank-3': LEGACY_ID_MAP['mage-tank-3'],
};

/**
 * Migrate all comments and progress in a guild to use new book IDs
 */
export async function migrateGuildBookIds(guildId: string): Promise<{
  commentsUpdated: number;
  progressUpdated: number;
  errors: string[];
}> {
  const result = {
    commentsUpdated: 0,
    progressUpdated: 0,
    errors: [] as string[],
  };

  console.log(`Starting migration for guild: ${guildId}`);
  console.log('ID Mapping:', ID_MAPPING);

  // Migrate comments
  try {
    const commentsUpdated = await migrateComments(guildId);
    result.commentsUpdated = commentsUpdated;
    console.log(`✅ Migrated ${commentsUpdated} comments`);
  } catch (error) {
    const msg = `Error migrating comments: ${error}`;
    result.errors.push(msg);
    console.error(msg);
  }

  // Migrate progress
  try {
    const progressUpdated = await migrateProgress(guildId);
    result.progressUpdated = progressUpdated;
    console.log(`✅ Migrated ${progressUpdated} progress records`);
  } catch (error) {
    const msg = `Error migrating progress: ${error}`;
    result.errors.push(msg);
    console.error(msg);
  }

  console.log('Migration complete:', result);
  return result;
}

/**
 * Migrate comments to use new book IDs
 */
async function migrateComments(guildId: string): Promise<number> {
  const commentsRef = collection(db, 'guilds', guildId, 'comments');
  let updatedCount = 0;

  // Query for each legacy book ID
  for (const [legacyId, newId] of Object.entries(ID_MAPPING)) {
    const q = query(commentsRef, where('bookId', '==', legacyId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No comments found with bookId: ${legacyId}`);
      continue;
    }

    console.log(`Found ${snapshot.size} comments with bookId: ${legacyId}`);

    // Batch update comments
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { bookId: newId });
    });

    await batch.commit();
    updatedCount += snapshot.size;
    console.log(`Updated ${snapshot.size} comments from ${legacyId} to ${newId}`);
  }

  return updatedCount;
}

/**
 * Migrate progress records to use new book IDs
 *
 * Progress documents use compound IDs: {bookId}_{userId}
 * We need to:
 * 1. Read the document
 * 2. Create new document with new ID
 * 3. Delete old document
 */
async function migrateProgress(guildId: string): Promise<number> {
  const progressRef = collection(db, 'guilds', guildId, 'progress');
  let updatedCount = 0;

  // Query for each legacy book ID
  for (const [legacyId, newId] of Object.entries(ID_MAPPING)) {
    const q = query(progressRef, where('bookId', '==', legacyId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No progress found with bookId: ${legacyId}`);
      continue;
    }

    console.log(`Found ${snapshot.size} progress records with bookId: ${legacyId}`);

    // Process each progress document
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const oldDocId = docSnap.id;

      // Extract userId from old document ID (format: {bookId}_{userId})
      const userId = data.userId;
      if (!userId) {
        console.warn(`Progress doc ${oldDocId} missing userId, skipping`);
        continue;
      }

      // Create new document ID with new bookId
      const newDocId = `${newId}_${userId}`;

      // Create new document with updated bookId
      const newData = {
        ...data,
        bookId: newId,
      };

      // Write new document
      await setDoc(doc(progressRef, newDocId), newData);

      // Delete old document
      await deleteDoc(docSnap.ref);

      updatedCount++;
      console.log(`Migrated progress: ${oldDocId} -> ${newDocId}`);
    }
  }

  return updatedCount;
}

/**
 * Dry run - just report what would be migrated without making changes
 */
export async function dryRunMigration(guildId: string): Promise<void> {
  console.log(`=== DRY RUN for guild: ${guildId} ===`);
  console.log('ID Mapping:', ID_MAPPING);

  // Check comments
  const commentsRef = collection(db, 'guilds', guildId, 'comments');
  for (const [legacyId, newId] of Object.entries(ID_MAPPING)) {
    const q = query(commentsRef, where('bookId', '==', legacyId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log(`Would migrate ${snapshot.size} comments from ${legacyId} to ${newId}`);
    }
  }

  // Check progress
  const progressRef = collection(db, 'guilds', guildId, 'progress');
  for (const [legacyId, newId] of Object.entries(ID_MAPPING)) {
    const q = query(progressRef, where('bookId', '==', legacyId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log(`Would migrate ${snapshot.size} progress records from ${legacyId} to ${newId}`);
    }
  }

  console.log('=== END DRY RUN ===');
}

// Export for console usage
if (typeof window !== 'undefined') {
  // @ts-expect-error - Expose to window for console access
  window.migrateGuildBookIds = migrateGuildBookIds;
  // @ts-expect-error - Expose to window for console access
  window.dryRunMigration = dryRunMigration;
}
