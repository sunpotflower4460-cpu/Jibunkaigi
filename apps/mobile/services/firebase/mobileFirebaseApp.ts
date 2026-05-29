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
      const authModule = FirebaseAuth as typeof FirebaseAuth & {
        getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
      };
      const getPersistence = authModule.getReactNativePersistence;
      if (!getPersistence) {
        auth = getAuth(app);
        console.warn('[mobileFirebaseApp] React Native auth persistence is unavailable. Falling back to default auth persistence.');
      } else {
        try {
          auth = initializeAuth(app, { persistence: getPersistence(AsyncStorage) as never });
        } catch (error) {
          auth = getAuth(app);
          console.warn('[mobileFirebaseApp] Falling back to default auth persistence.', error);
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
