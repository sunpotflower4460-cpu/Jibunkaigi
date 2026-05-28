// Firebase app initialisation for Expo Universal app.
// Returns null if Firebase config is unavailable – callers fall back to local storage.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
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
    let auth: Auth;
    if (Platform.OS === 'web') {
      auth = getAuth(app);
    } else {
      // firebase@^10.14 exposes getReactNativePersistence at runtime on firebase/auth in RN bundles.
      const authModule = FirebaseAuth as typeof FirebaseAuth & {
        getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
      };
      const persistence = authModule.getReactNativePersistence?.(AsyncStorage);
      if (!persistence) {
        auth = getAuth(app);
      } else {
        try {
          auth = initializeAuth(app, { persistence: persistence as never });
        } catch {
          auth = getAuth(app);
        }
      }
    }
    const db = getFirestore(app);
    cachedServices = { app, auth, db };
    return cachedServices;
  } catch {
    return null;
  }
}
