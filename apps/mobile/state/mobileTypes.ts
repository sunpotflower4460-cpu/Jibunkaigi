// Phase 2 local types for Expo mobile app.
// Not yet synced with Firestore — designed to be easy to migrate later.

// Agent and mode IDs are sourced from the universal shared core.
import type { UniversalAgentId } from '../../../packages/shared/src';
export type MobileAgentId = UniversalAgentId;

export type MobileMessageRole = 'user' | 'agent';

export interface MobileMessage {
  id: string;
  role: MobileMessageRole;
  text: string;
  agentId?: MobileAgentId;
  agentLabel?: string;
  createdAt: number;
}

export interface MobileSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: MobileMessage[];
}
