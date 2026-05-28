import type {
  UniversalAgentId,
  UniversalMessage,
  UniversalModeId,
} from '../../state/mobileTypes';
import type { ConcreteAgentId } from '@jibunkaigi/shared';

export interface UniversalOthersAiRequest {
  sessionId: string;
  userText: string;
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
}

export interface UniversalOthersAiResponse {
  replies: UniversalOthersAiReply[];
  source: 'proxy' | 'mock-fallback';
  model?: string;
}
