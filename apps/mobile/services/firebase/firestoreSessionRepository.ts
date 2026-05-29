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
import { getMobileFirebaseServices } from './mobileFirebaseApp';
import { ensureAnonymousUser } from './mobileAuth';
import { getUniversalAppId } from './mobileFirebaseConfig';

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

  async listSessions(): Promise<UniversalSession[]> {
    const uid = await this.getCurrentUserId();
    if (!uid) return [];
    const snap = await getDocs(
      query(this.sessionsCol(uid), orderBy('updatedAt', 'desc')),
    );
    return snap.docs.map((d) => ({ ...(d.data() as Omit<UniversalSession, 'messages'>), messages: [] }));
  }

  async saveSession(session: UniversalSession): Promise<void> {
    const uid = await this.getCurrentUserId();
    if (!uid) return;
    const { messages: _messages, ...sessionData } = session;
    await setDoc(doc(this.sessionsCol(uid), session.id), sessionData, { merge: true });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const uid = await this.getCurrentUserId();
    if (!uid) return;
    const services = this.getServices();
    const batch = writeBatch(services.db);

    // Delete all messages first
    const msgSnap = await getDocs(this.messagesCol(uid, sessionId));
    msgSnap.docs.forEach((d) => batch.delete(d.ref));

    // Delete the session document
    const appId = getUniversalAppId();
    batch.delete(doc(services.db, 'artifacts', appId, 'users', uid, 'sessions', sessionId));

    await batch.commit();
  }

  async saveMessage(sessionId: string, message: UniversalMessage): Promise<void> {
    const uid = await this.getCurrentUserId();
    if (!uid) return;
    await setDoc(doc(this.messagesCol(uid, sessionId), message.id), message);
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    const uid = await this.getCurrentUserId();
    if (!uid) return;
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
    const uid = await this.getCurrentUserId();
    if (!uid) return;
    const services = this.getServices();
    const batch = writeBatch(services.db);
    const msgSnap = await getDocs(this.messagesCol(uid, sessionId));
    msgSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async loadMessages(sessionId: string): Promise<UniversalMessage[]> {
    const uid = await this.getCurrentUserId();
    if (!uid) return [];
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
