// Unified user-data deletion.
//
// Persisted data in this app is exactly two things:
//   1. Conversation sessions + their messages
//        - Firestore: artifacts/{appId}/users/{uid}/sessions/...
//        - Local fallback: in-memory only (LocalSessionRepository)
//   2. User profile
//        - Firestore: artifacts/{appId}/users/{uid}/profile/settings
//        - Local: AsyncStorage key "jibunkaigi:user-profile"
//
// Reflection shelf / theme archive / keyword field are in-memory only and clear
// on their own; callers should reset in-memory UI state after this resolves.

import { getSessionRepository } from './sessionRepository';
import { createUserProfileRepository } from './userProfileRepository';

export interface DeleteAllUserDataResult {
  ok: boolean;
  /** Present when one or both deletions failed. Joined, human-readable. */
  error?: string;
}

/**
 * Deletes every piece of the user's persisted data (sessions + profile),
 * both locally and remotely.
 *
 * The two deletions run independently: if one fails, the other is still
 * attempted, so the user clears as much as possible. Both repository methods
 * remove local data first, so the device is cleared even when the network call
 * fails.
 */
export async function deleteAllUserData(): Promise<DeleteAllUserDataResult> {
  const errors: string[] = [];

  try {
    await getSessionRepository().deleteAllSessions();
  } catch (error) {
    errors.push(`sessions: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    await createUserProfileRepository().deleteProfile();
  } catch (error) {
    errors.push(`profile: ${error instanceof Error ? error.message : String(error)}`);
  }

  return errors.length === 0 ? { ok: true } : { ok: false, error: errors.join('; ') };
}
