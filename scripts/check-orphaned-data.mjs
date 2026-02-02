/**
 * Check for orphaned comments and progress with legacy book IDs
 *
 * Run from the squabble-web directory:
 *   node scripts/check-orphaned-data.mjs
 *
 * This requires Firebase credentials - either:
 * 1. Set GOOGLE_APPLICATION_CREDENTIALS to a service account key
 * 2. Or run `firebase login` and use the emulator
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Legacy book IDs that need migration
const LEGACY_IDS = ['mage-tank-1', 'mage-tank-2', 'mage-tank-3'];

// New deterministic IDs (computed using djb2 hash)
const ID_MAPPING = {
  'mage-tank-1': 'book_1mxfv4l',
  'mage-tank-2': 'book_yg0153',
  'mage-tank-3': 'book_95rupy',
};

async function main() {
  // Initialize Firebase Admin
  if (!getApps().length) {
    // Try to use application default credentials
    try {
      initializeApp({
        projectId: 'squabble-app-fbc28',
      });
    } catch (e) {
      console.error('Failed to initialize Firebase. Make sure you have run:');
      console.error('  firebase login');
      console.error('  gcloud auth application-default login');
      process.exit(1);
    }
  }

  const db = getFirestore();

  // First, find all guilds
  console.log('\\n=== Checking Firestore for orphaned data ===\\n');

  const guildsSnap = await db.collection('guilds').get();
  console.log(`Found ${guildsSnap.size} guild(s)\\n`);

  for (const guildDoc of guildsSnap.docs) {
    const guildId = guildDoc.id;
    const guildData = guildDoc.data();
    console.log(`\\n--- Guild: ${guildData.name || guildId} ---`);

    // Check comments with legacy IDs
    console.log('\\nComments with legacy IDs:');
    for (const legacyId of LEGACY_IDS) {
      const commentsSnap = await db
        .collection('guilds')
        .doc(guildId)
        .collection('comments')
        .where('bookId', '==', legacyId)
        .get();

      if (!commentsSnap.empty) {
        console.log(`  ${legacyId}: ${commentsSnap.size} comment(s)`);
        commentsSnap.docs.forEach(doc => {
          const data = doc.data();
          console.log(`    - "${data.text?.substring(0, 50)}..." by ${data.userDisplayName} at ${data.timestamp}s`);
        });
      }
    }

    // Check progress with legacy IDs
    console.log('\\nProgress records with legacy IDs:');
    for (const legacyId of LEGACY_IDS) {
      const progressSnap = await db
        .collection('guilds')
        .doc(guildId)
        .collection('progress')
        .where('bookId', '==', legacyId)
        .get();

      if (!progressSnap.empty) {
        console.log(`  ${legacyId}: ${progressSnap.size} record(s)`);
        progressSnap.docs.forEach(doc => {
          const data = doc.data();
          console.log(`    - ${data.userEmail || data.userId}: ${data.progressPercent?.toFixed(1)}% (${data.progressTimestamp}s)`);
        });
      }
    }

    // Also check for NEW IDs to compare
    console.log('\\nComments with NEW IDs (already migrated):');
    for (const [legacy, newId] of Object.entries(ID_MAPPING)) {
      const commentsSnap = await db
        .collection('guilds')
        .doc(guildId)
        .collection('comments')
        .where('bookId', '==', newId)
        .get();

      if (!commentsSnap.empty) {
        console.log(`  ${newId}: ${commentsSnap.size} comment(s)`);
      }
    }
  }

  console.log('\\n=== Done ===\\n');
}

main().catch(console.error);
