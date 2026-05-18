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

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

export function getMobileFirebaseConfig(): MobileFirebaseConfig | null {
  const config: MobileFirebaseConfig = {
    apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  };
  const hasConfig = Object.values(config).every(Boolean);
  return hasConfig ? config : null;
}

export function isMobileFirebaseConfigured(): boolean {
  return getMobileFirebaseConfig() !== null;
}

export function getUniversalAppId(): string {
  return readEnv('EXPO_PUBLIC_JIBUNKAIGI_APP_ID') || 'self-conf-v10-mobile-dev';
}
