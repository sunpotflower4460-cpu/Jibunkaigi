// Shared session and message types for Universal adapter layer.
// Used by both the Firestore repository and the local in-memory fallback.

export interface UniversalMessageData {
  id: string;
  role: 'user' | 'agent';
  text: string;
  agentId?: string;
  agentLabel?: string;
  modeId?: string;
  createdAt: number;
}

export interface UniversalSessionData {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}
