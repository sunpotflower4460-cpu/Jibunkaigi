import type {
  UniversalAgentId,
  UniversalMessage,
  UniversalModeId,
} from '../../state/mobileTypes';
import type { ConcreteAgentId, OthersPosition } from '@jibunkaigi/shared';

export interface UniversalOthersAiRequest {
  sessionId: string;
  userText: string;
  /** OTHERSが反応する対象＝メインエージェントの応答本文。 */
  mainReplyText: string;
  currentAgentId: UniversalAgentId;
  modeId: UniversalModeId;
  messages: UniversalMessage[];
  targetAgentIds?: ConcreteAgentId[];
  userName?: string | null;
}

export interface UniversalOthersAiReply {
  agentId: ConcreteAgentId;
  agentLabel: string;
  text: string;
  position: OthersPosition;
}

export interface UniversalOthersAiResponse {
  replies: UniversalOthersAiReply[];
  source: 'proxy' | 'mock-fallback';
  model?: string;
}
