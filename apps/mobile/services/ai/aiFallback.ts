import { createUniversalMockReply } from '@jibunkaigi/shared';
import type {
  UniversalAiClient,
  UniversalAiRequest,
  UniversalAiResponse,
} from './aiClientTypes';

export function createMockFallbackAiClient(): UniversalAiClient {
  return {
    isRemoteEnabled() {
      return false;
    },

    async createReply(request: UniversalAiRequest): Promise<UniversalAiResponse> {
      const reply = createUniversalMockReply({
        agentId: request.agentId,
        modeId: request.modeId,
        userText: request.userText,
        previousMessages: request.messages,
      });

      return {
        text: reply.text,
        agentId: reply.agentId,
        agentLabel: reply.agentLabel,
        source: 'mock-fallback',
      };
    },
  };
}
