import type { UniversalAgentId } from '../agents';
import type { UniversalModeId } from '../modes';

export interface UniversalPromptMessage {
  role: 'user' | 'agent';
  text: string;
  agentId?: UniversalAgentId;
  agentLabel?: string;
  modeId?: UniversalModeId;
  createdAt?: number;
}

export interface BuildUniversalConversationPromptParams {
  userText: string;
  agentId: UniversalAgentId;
  modeId: UniversalModeId;
  messages: UniversalPromptMessage[];
  userName?: string | null;
}

export interface UniversalBuiltPrompt {
  prompt: string;
  agentLabel: string;
  modeLabel: string;
}
