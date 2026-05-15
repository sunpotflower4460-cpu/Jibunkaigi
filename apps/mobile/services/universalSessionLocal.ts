// Local session factory helpers.
// Manages in-memory session creation before Firebase is connected.
// Replace createLocalSession with a Firestore write in Phase 3.

import type { UniversalSession } from '../state/mobileTypes';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalSession(title = '新しい問い'): UniversalSession {
  const now = Date.now();
  return {
    id: generateId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function clearSessionMessages(session: UniversalSession): UniversalSession {
  return { ...session, messages: [], updatedAt: Date.now() };
}
