import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let adminDb: Firestore;

if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_ADMIN_SDK_JSON;
  if (serviceAccount) {
    app = initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS or default credentials
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

adminDb = getFirestore(app);

export { adminDb };
