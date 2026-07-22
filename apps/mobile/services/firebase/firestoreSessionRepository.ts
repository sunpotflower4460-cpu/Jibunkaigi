// Firestore-backed session repository.
// Mirrors the path layout used by the existing Vite Web version:
//   artifacts/{appId}/users/{uid}/sessions/{sessionId}
//   artifacts/{appId}/users/{uid}/sessions/{sessionId}/messages/{messageId}

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import type { UniversalMessage, UniversalSession } from '../../state/mobileTypes';
import type { UniversalSessionRepository } from '../sessionRepository';
import { getMobileFirebaseServices, type MobileFirebaseServices } from './mobileFirebaseApp';
import { ensureAnonymousUser } from './mobileAuth';
import { getUniversalAppId } from './mobileFirebaseConfig';

// Firestore allows at most 500 writes in one batch. Keep headroom for future
// metadata writes and avoid deletion failures for long conversations.
const DELETE_BATCH_SIZE = 400;

function omitUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

export class FirestoreSessionRepository implements UniversalSessionRepository {
  private uid: string | null = null;

  isRemoteEnabled(): boolean {
    return true;
  }

  async getCurrentUserId(): Promise<string | null> {
    if (this.uid) return this.uid;
    const user = await ensureAnonymousUser();
    this.uid = user?.uid ?? null;
    return this.uid;
  }

  private async requireCurrentUserId(): Promise<string> {
    const uid = await this.getCurrentUserId();
    if (!uid) {
      throw new Error('Firebase authentication is unavailable. Cloud data was not changed.');
    }
    return uid;
  }

  private getServices(): MobileFirebaseServices {
    const services = getMobileFirebaseServices();
    if (!services) throw new Error('Firebase services are not available');
    return services;
  }

  private sessionsCol(uid: string) {
    const services = this.getServices();
    const appId = getUniversalAppId();
    return collection(services.db, 'artifacts', appId, 'users', uid, 'sessions');
  }

  private messagesCol(uid: string, sessionId: string) {
    const services = this.getServices();
    const appId = getUniversalAppId();
    return collection(
      services.db,
      'artifacts',
      appId,
      'users',
      uid,
      'sessions',
      sessionId,
      'messages',
    );
  }

  private async deleteMessageDocuments(uid: string, sessionId: string): Promise<void> {
    const services = this.getServices();
    const msgSnap = await getDocs(this.messagesCol(uid, sessionId));

    for (let offset = 0; offset < msgSnap.docs.length; offset += DELETE_BATCH_SIZE) {
      const batch = writeBatch(services.db);
      msgSnap.docs
        .slice(offset, offset + DELETE_BATCH_SIZE)
        .forEach((messageDoc) => batch.delete(messageDoc.ref));
      await batch.commit();
    }
  }

  async listSessions(): Promise<UniversalSession[]> {
    const uid = await this.requireCurrentUserId();
    const snap = await getDocs(
      query(this.sessionsCol(uid), orderBy('updatedAt', 'desc')),
    );
    return snap.docs.map((d) => ({ ...(d.data() as Omit<UniversalSession, 'messages'>), messages: [] }));
  }

  async saveSession(session: UniversalSession): Promise<void> {
    const uid = await this.requireCurrentUserId();
    const { messages: _messages, ...sessionData } = session;
    await setDoc(
      doc(this.sessionsCol(uid), session.id),
      omitUndefined(sessionData),
      { merge: true },
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    const uid = await this.requireCurrentUserId();
    const services = this.getServices();

    // Firestore does not cascade-delete subcollections. Remove messages in
    // bounded batches first, then remove the parent session document.
    await this.deleteMessageDocuments(uid, sessionId);

    const appId = getUniversalAppId();
    await deleteDoc(doc(services.db, 'artifacts', appId, 'users', uid, 'sessions', sessionId));
  }

  async saveMessage(sessionId: string, message: UniversalMessage): Promise<void> {
    const uid = await this.requireCurrentUserId();
    await setDoc(
      doc(this.messagesCol(uid, sessionId), message.id),
      omitUndefined(message),
    );
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    const uid = await this.requireCurrentUserId();
    const services = this.getServices();
    const appId = getUniversalAppId();
    await deleteDoc(doc(this.messagesCol(uid, sessionId), messageId));
    await setDoc(
      doc(services.db, 'artifacts', appId, 'users', uid, 'sessions', sessionId),
      { updatedAt: Date.now() },
      { merge: true },
    );
  }

  async clearMessages(sessionId: string): Promise<void> {
    const uid = await this.requireCurrentUserId();
    await this.deleteMessageDocuments(uid, sessionId);
  }

  async deleteAllSessions(): Promise<void> {
    const uid = await this.requireCurrentUserId();
    const snap = await getDocs(this.sessionsCol(uid));
    for (const sessionDoc of snap.docs) {
      await this.deleteSession(sessionDoc.id);
    }
  }

  async loadMessages(sessionId: string): Promise<UniversalMessage[]> {
    const uid = await this.requireCurrentUserId();
    const snap = await getDocs(
      query(this.messagesCol(uid, sessionId), orderBy('createdAt', 'asc')),
    );
    return snap.docs.map((d) => d.data() as UniversalMessage);
  }
}

/** Creates a FirestoreSessionRepository if Firebase is configured, otherwise returns null. */
export function createFirestoreRepository(): FirestoreSessionRepository | null {
  if (!getMobileFirebaseServices()) return null;
  return new FirestoreSessionRepository();
}
