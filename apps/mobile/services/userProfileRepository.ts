import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  createDefaultUserProfile,
  normalizeUserName,
  type UniversalUserProfile,
} from '@jibunkaigi/shared';
import { ensureAnonymousUser } from './firebase/mobileAuth';
import { getMobileFirebaseServices } from './firebase/mobileFirebaseApp';
import { getUniversalAppId } from './firebase/mobileFirebaseConfig';

const LOCAL_PROFILE_KEY = 'jibunkaigi:user-profile';

export interface UserProfileRepository {
  loadProfile(): Promise<UniversalUserProfile>;
  saveProfile(profile: UniversalUserProfile): Promise<void>;
}

function profileDoc(uid: string) {
  const services = getMobileFirebaseServices();
  if (!services) return null;
  return doc(
    services.db,
    'artifacts',
    getUniversalAppId(),
    'users',
    uid,
    'profile',
    'settings',
  );
}

function readUpdatedAt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof value.toMillis === 'function'
  ) {
    return value.toMillis();
  }
  return 0;
}

function normalizeProfile(profile?: Partial<UniversalUserProfile> | null): UniversalUserProfile {
  return {
    userName: normalizeUserName(profile?.userName ?? ''),
    updatedAt: typeof profile?.updatedAt === 'number' ? profile.updatedAt : 0,
  };
}

function pickLatestProfile(
  localProfile: UniversalUserProfile,
  remoteProfile: UniversalUserProfile | null,
): UniversalUserProfile {
  if (!remoteProfile) return localProfile;
  if (remoteProfile.updatedAt > localProfile.updatedAt) return remoteProfile;
  if (localProfile.updatedAt > remoteProfile.updatedAt) return localProfile;
  if (remoteProfile.userName !== createDefaultUserProfile().userName) return remoteProfile;
  return localProfile;
}

async function loadLocalProfile(): Promise<UniversalUserProfile> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return createDefaultUserProfile();
    return normalizeProfile(JSON.parse(raw) as Partial<UniversalUserProfile>);
  } catch {
    return createDefaultUserProfile();
  }
}

async function saveLocalProfile(profile: UniversalUserProfile): Promise<void> {
  await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

export function createUserProfileRepository(): UserProfileRepository {
  return {
    async loadProfile(): Promise<UniversalUserProfile> {
      const localProfile = await loadLocalProfile();
      if (!getMobileFirebaseServices()) {
        return localProfile;
      }

      try {
        const user = await ensureAnonymousUser();
        if (!user?.uid) return localProfile;

        const profileRef = profileDoc(user.uid);
        if (!profileRef) return localProfile;

        const snapshot = await getDoc(profileRef);
        if (!snapshot.exists()) {
          return localProfile;
        }

        const data = snapshot.data() as {
          displayName?: unknown;
          updatedAt?: unknown;
        };
        const remoteProfile = normalizeProfile({
          userName: typeof data.displayName === 'string' ? data.displayName : '',
          updatedAt: readUpdatedAt(data.updatedAt),
        });
        const resolved = pickLatestProfile(localProfile, remoteProfile);
        if (
          resolved.userName !== localProfile.userName ||
          resolved.updatedAt !== localProfile.updatedAt
        ) {
          await saveLocalProfile(resolved);
        }
        return resolved;
      } catch {
        console.warn('[Jibunkaigi] Failed to load user profile.');
        return localProfile;
      }
    },

    async saveProfile(profile: UniversalUserProfile): Promise<void> {
      const normalized = normalizeProfile(profile);
      await saveLocalProfile(normalized);

      if (!getMobileFirebaseServices()) return;

      try {
        const user = await ensureAnonymousUser();
        if (!user?.uid) return;

        const profileRef = profileDoc(user.uid);
        if (!profileRef) return;

        await setDoc(
          profileRef,
          {
            displayName: normalized.userName,
            updatedAt: normalized.updatedAt,
          },
          { merge: true },
        );
      } catch {
        console.warn('[Jibunkaigi] Failed to save user profile.');
      }
    },
  };
}
