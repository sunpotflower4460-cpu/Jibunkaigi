import { getJibunkaigiApiBaseUrl } from '../../config/mobileApiConfig';
import type {
  UniversalOthersAiRequest,
  UniversalOthersAiResponse,
} from './othersClientTypes';

const REQUEST_TIMEOUT_MS = 45000;

export function createOthersProxyClient() {
  const baseUrl = getJibunkaigiApiBaseUrl();
  if (!baseUrl) return null;

  return {
    async createOthers(request: UniversalOthersAiRequest): Promise<UniversalOthersAiResponse> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`${baseUrl}/api/jibunkaigi/others`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: request.sessionId,
            userText: request.userText,
            currentAgentId: request.currentAgentId,
            modeId: request.modeId,
            messages: request.messages.slice(-20),
            targetAgentIds: request.targetAgentIds,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`OTHERS proxy failed: ${response.status}`);
        }

        const data = await response.json() as { replies?: unknown; model?: string };
        if (!data || !Array.isArray(data.replies)) {
          throw new Error('OTHERS proxy returned invalid response');
        }

        return {
          replies: data.replies as UniversalOthersAiResponse['replies'],
          source: 'proxy',
          model: data.model,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
