// Universal types for Expo app (iOS / Android / Web).
// Canonical names use Universal* prefix to reflect the cross-platform target.
// Not yet synced with Firestore — designed to be easy to migrate later.

export type UniversalAgentId =
  | 'mirror'
  | 'delegate'
  | 'ray'
  | 'joe'
  | 'ken'
  | 'mina'
  | 'satou';

export type UniversalModeId =
  | 'flash'
  | 'dialogue'
  | 'deep';

export type UniversalMessageRole = 'user' | 'agent';

export interface UniversalMessage {
  id: string;
  role: UniversalMessageRole;
  text: string;
  agentId?: UniversalAgentId;
  agentLabel?: string;
  modeId?: UniversalModeId;
  createdAt: number;
}

export interface UniversalSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UniversalMessage[];
  pinned?: boolean;
}

// Backward-compatible aliases used by existing Mobile* components.
export type MobileAgentId = UniversalAgentId;
export type MobileMessageRole = UniversalMessageRole;
export type MobileMessage = UniversalMessage;
export type MobileSession = UniversalSession;
