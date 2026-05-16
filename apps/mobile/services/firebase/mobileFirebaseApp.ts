// Firebase app initialisation for Expo Universal app.
// Returns null if Firebase config is unavailable – callers fall back to local storage.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getMobileFirebaseConfig } from './mobileFirebaseConfig';

export interface MobileFirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cachedServices: MobileFirebaseServices | null = null;

export function getMobileFirebaseServices(): MobileFirebaseServices | null {
  if (cachedServices) return cachedServices;
  const config = getMobileFirebaseConfig();
  if (!config) return null;
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    cachedServices = { app, auth, db };
    return cachedServices;
  } catch {
    return null;
  }
}
