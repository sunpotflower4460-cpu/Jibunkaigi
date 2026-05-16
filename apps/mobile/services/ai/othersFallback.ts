import { createUniversalOthersMockResponse } from '../../../../packages/shared/src';
import type {
  UniversalOthersAiRequest,
  UniversalOthersAiResponse,
} from './othersClientTypes';

export function createOthersFallbackClient() {
  return {
    async createOthers(request: UniversalOthersAiRequest): Promise<UniversalOthersAiResponse> {
      const response = createUniversalOthersMockResponse({
        sessionId: request.sessionId,
        userText: request.userText,
        currentAgentId: request.currentAgentId,
        modeId: request.modeId,
        messages: request.messages,
        targetAgentIds: request.targetAgentIds,
      });

      return {
        replies: response.replies,
        source: 'mock-fallback',
      };
    },
  };
}
