// Anonymous auth helper for Expo Universal app.
// Google / Apple Sign-In will be added in a later phase.

import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { getMobileFirebaseServices } from './mobileFirebaseApp';

/** Ensures an anonymous Firebase user exists, or returns null if Firebase is unavailable. */
export async function ensureAnonymousUser(): Promise<User | null> {
  const services = getMobileFirebaseServices();
  if (!services) return null;
  if (services.auth.currentUser) {
    return services.auth.currentUser;
  }
  try {
    const result = await signInAnonymously(services.auth);
    return result.user;
  } catch {
    return null;
  }
}

/** Subscribes to auth state changes. Returns an unsubscribe function. */
export function subscribeMobileAuth(callback: (user: User | null) => void): () => void {
  const services = getMobileFirebaseServices();
  if (!services) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(services.auth, callback);
}
