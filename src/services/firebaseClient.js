import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase 設定を環境変数 / globalThis から拾い、初期化済みの app / auth / db を返す。
 * 設定が無ければ null を返し、UI 側で警告を出せるようにする。
 */

const getGlobalValue = (key) =>
  (typeof globalThis !== 'undefined' && key in globalThis) ? globalThis[key] : undefined;

const readConfig = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
    }
    const globalConfig = getGlobalValue('__firebase_config');
    if (globalConfig) {
      return typeof globalConfig === 'string' ? JSON.parse(globalConfig) : globalConfig;
    }
  } catch (error) {
    console.error('Firebase config parsing error:', error);
  }
  return {};
};

const firebaseConfig = readConfig();

export const hasFirebaseConfig = Boolean(
  firebaseConfig
  && firebaseConfig.apiKey
  && firebaseConfig.projectId
  && firebaseConfig.appId,
);

if (!hasFirebaseConfig) {
  console.error('Firebase configuration is missing or incomplete.');
}

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null;

export const appId = getGlobalValue('__app_id') || 'self-conf-v10';

export const geminiApiKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)
    ? import.meta.env.VITE_GEMINI_API_KEY
    : (getGlobalValue('__api_key') || '');

export const getInitialAuthToken = () => getGlobalValue('__initial_auth_token');
