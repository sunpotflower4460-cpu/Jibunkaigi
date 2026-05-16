import type {
  UniversalAgentId,
  UniversalMessage,
  UniversalModeId,
} from '../../state/mobileTypes';

export interface UniversalAiRequest {
  sessionId: string;
  userText: string;
  agentId: UniversalAgentId;
  modeId: UniversalModeId;
  messages: UniversalMessage[];
}

export interface UniversalAiResponse {
  text: string;
  agentId: UniversalAgentId;
  agentLabel: string;
  source: 'proxy' | 'mock-fallback';
  model?: string;
}

export interface UniversalAiClient {
  isRemoteEnabled(): boolean;
  createReply(request: UniversalAiRequest): Promise<UniversalAiResponse>;
}
