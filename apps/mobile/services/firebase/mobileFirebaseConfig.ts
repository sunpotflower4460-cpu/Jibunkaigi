// Firebase config loader for Expo Universal app.
// Reads from EXPO_PUBLIC_ environment variables.
// Returns null if any required config value is missing – callers fall back to local storage.

export interface MobileFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getMobileFirebaseConfig(): MobileFirebaseConfig | null {
  const config: MobileFirebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  };
  const hasConfig = Object.values(config).every(Boolean);
  return hasConfig ? config : null;
}

export function isMobileFirebaseConfigured(): boolean {
  return getMobileFirebaseConfig() !== null;
}

export function getUniversalAppId(): string {
  return process.env.EXPO_PUBLIC_JIBUNKAIGI_APP_ID || 'self-conf-v10-mobile-dev';
}
