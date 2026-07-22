import type {
  UniversalAgentId,
  UniversalMessage,
  UniversalModeId,
} from '../../state/mobileTypes';
import type { ConcreteAgentId, OthersPosition } from '@jibunkaigi/shared';
import type { UniversalWarmthState } from './aiClientTypes';

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
  /** 対象エージェントごとの前ターンの浮上活性。 */
  warmth?: UniversalWarmthState;
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
  /** 対象エージェントごとの今回の浮上活性。 */
  warmth?: UniversalWarmthState;
}
