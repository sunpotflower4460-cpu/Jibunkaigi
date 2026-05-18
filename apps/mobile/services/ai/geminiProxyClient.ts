import { pickMockDelegatedAgent } from '../../../../packages/shared/src';
import { getJibunkaigiApiBaseUrl } from '../../config/mobileApiConfig';
import type {
  UniversalAiClient,
  UniversalAiRequest,
  UniversalAiResponse,
} from './aiClientTypes';

const REQUEST_TIMEOUT_MS = 30000;

export function createGeminiProxyClient(): UniversalAiClient | null {
  const baseUrl = getJibunkaigiApiBaseUrl();
  if (!baseUrl) return null;

  return {
    isRemoteEnabled() {
      return true;
    },

    async createReply(request: UniversalAiRequest): Promise<UniversalAiResponse> {
      // Resolve 'delegate' to a concrete agent so both proxy and mock-fallback
      // paths return a consistent speaker/label in the UI.
      const resolvedAgentId =
        request.agentId === 'delegate'
          ? pickMockDelegatedAgent(request.userText)
          : request.agentId;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${baseUrl}/api/jibunkaigi/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: request.sessionId,
            userText: request.userText,
            agentId: resolvedAgentId,
            modeId: request.modeId,
            messages: request.messages.slice(-20),
            userName: request.userName,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Gemini proxy failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data || typeof data.text !== 'string') {
          throw new Error('Gemini proxy returned invalid response');
        }

        return {
          text: data.text,
          agentId: data.agentId ?? resolvedAgentId,
          agentLabel: data.agentLabel ?? '',
          source: 'proxy',
          model: data.model,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
