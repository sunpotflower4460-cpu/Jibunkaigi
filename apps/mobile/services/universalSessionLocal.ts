// Local session factory helpers.
// Manages in-memory session creation before Firebase is connected.
// Replace createLocalSession with a Firestore write in Phase 3.

import type { UniversalSession } from '../state/mobileTypes';
import {
  createUniversalId,
  createSessionTitleFromText,
} from '@jibunkaigi/shared';

export function createLocalSession(title = '新しい問い'): UniversalSession {
  const now = Date.now();
  return {
    id: createUniversalId('session'),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function createLocalSessionFromText(text: string): UniversalSession {
  return createLocalSession(createSessionTitleFromText(text));
}

export function clearSessionMessages(session: UniversalSession): UniversalSession {
  return { ...session, messages: [], updatedAt: Date.now() };
}
