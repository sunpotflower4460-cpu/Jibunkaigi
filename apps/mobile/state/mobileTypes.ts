// Universal types for Expo app (iOS / Android / Web).
// UniversalAgentId and UniversalModeId are re-exported from @jibunkaigi/shared
// so all platforms share the same canonical definitions.

import type { UniversalAgentId, UniversalModeId } from '@jibunkaigi/shared';

export type { UniversalAgentId, UniversalModeId };

export type UniversalMessageRole = 'user' | 'agent';

export interface UniversalMessage {
  id: string;
  role: UniversalMessageRole;
  text: string;
  agentId?: UniversalAgentId;
  agentLabel?: string;
  modeId?: UniversalModeId;
  createdAt: number;
  source?: 'proxy' | 'mock-fallback';
  model?: string;
  origin?: 'direct' | 'others';
  groupId?: string;
  // Delegate provenance (Phase 0-1):
  // requestedAgentId is the user's entry-point selection at send time
  // (e.g. 'delegate'); resolvedFromDelegate flags that the concrete agentId
  // above was chosen by context selection rather than directly requested.
  requestedAgentId?: UniversalAgentId;
  resolvedFromDelegate?: boolean;
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
