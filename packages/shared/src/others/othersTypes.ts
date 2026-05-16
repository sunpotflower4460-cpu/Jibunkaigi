import type { ConcreteAgentId, UniversalAgentId } from '../agents';
import type { UniversalModeId } from '../modes';
import type { UniversalPromptMessage } from '../prompt/promptTypes';

export interface UniversalOthersRequest {
  sessionId: string;
  userText: string;
  currentAgentId: UniversalAgentId;
  modeId: UniversalModeId;
  messages: UniversalPromptMessage[];
  targetAgentIds?: ConcreteAgentId[];
  userName?: string | null;
}

export interface UniversalOthersReply {
  agentId: ConcreteAgentId;
  agentLabel: string;
  text: string;
}

export interface UniversalOthersResponse {
  replies: UniversalOthersReply[];
  source: 'proxy' | 'mock-fallback';
  model?: string;
}
