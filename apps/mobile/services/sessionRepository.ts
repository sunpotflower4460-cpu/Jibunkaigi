// Universal session repository interface + local in-memory fallback.
// The Firestore implementation lives in ./firebase/firestoreSessionRepository.ts.
//
// Firestore path layout (matches existing Web version):
//   artifacts/{appId}/users/{uid}/sessions/{sessionId}
//   artifacts/{appId}/users/{uid}/sessions/{sessionId}/messages/{messageId}

import type { UniversalMessage, UniversalSession } from '../state/mobileTypes';
import { createLocalSession } from './universalSessionLocal';

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export interface UniversalSessionRepository {
  /** True when a remote Firestore connection is active. */
  isRemoteEnabled(): boolean;

  /** Returns the Firebase UID, or null when running locally. */
  getCurrentUserId(): Promise<string | null>;

  /** Returns all sessions for the current user, newest first. */
  listSessions(): Promise<UniversalSession[]>;

  /** Persists (create or update) a session record WITHOUT its messages. */
  saveSession(session: UniversalSession): Promise<void>;

  /** Removes a session and all its messages. */
  deleteSession(sessionId: string): Promise<void>;

  /** Appends a message to the given session. */
  saveMessage(sessionId: string, message: UniversalMessage): Promise<void>;

  /** Removes a single message from a session. */
  deleteMessage(sessionId: string, messageId: string): Promise<void>;

  /** Removes all messages from a session (does not delete the session itself). */
  clearMessages(sessionId: string): Promise<void>;

  /** Removes every session and all their messages for the current user. */
  deleteAllSessions(): Promise<void>;

  /** Loads all messages for a session, ordered by createdAt. */
  loadMessages(sessionId: string): Promise<UniversalMessage[]>;
}

// ---------------------------------------------------------------------------
// Local in-memory fallback (no Firebase required)
// ---------------------------------------------------------------------------

export class LocalSessionRepository implements UniversalSessionRepository {
  private sessions: Map<string, UniversalSession> = new Map();

  constructor() {
    const initial = createLocalSession();
    this.sessions.set(initial.id, initial);
  }

  isRemoteEnabled(): boolean {
    return false;
  }

  async getCurrentUserId(): Promise<string | null> {
    return null;
  }

  async listSessions(): Promise<UniversalSession[]> {
    return [...this.sessions.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async saveSession(session: UniversalSession): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async saveMessage(sessionId: string, message: UniversalMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const updated: UniversalSession = {
      ...session,
      messages: [...session.messages, message],
      updatedAt: Date.now(),
    };
    this.sessions.set(sessionId, updated);
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.set(sessionId, {
      ...session,
      messages: session.messages.filter((message) => message.id !== messageId),
      updatedAt: Date.now(),
    });
  }

  async clearMessages(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.set(sessionId, { ...session, messages: [], updatedAt: Date.now() });
  }

  async deleteAllSessions(): Promise<void> {
    this.sessions.clear();
  }

  async loadMessages(sessionId: string): Promise<UniversalMessage[]> {
    return this.sessions.get(sessionId)?.messages ?? [];
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor
// ---------------------------------------------------------------------------

let _repository: UniversalSessionRepository | null = null;

/** Returns the active session repository (Firestore or local fallback). */
export function getSessionRepository(): UniversalSessionRepository {
  if (_repository) return _repository;
  _repository = new LocalSessionRepository();
  return _repository;
}

/** Replaces the active repository. Call this after Firebase initialises. */
export function setSessionRepository(repo: UniversalSessionRepository): void {
  _repository = repo;
}
