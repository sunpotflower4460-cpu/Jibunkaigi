import { getJibunkaigiApiBaseUrl } from '../../config/mobileApiConfig';
import type {
  UniversalAiClient,
  UniversalAiRequest,
  UniversalAiResponse,
} from './aiClientTypes';

const REQUEST_TIMEOUT_MS = 30000;

// 開発者モードのトレース送信フラグ。本番ビルドでは EXPO_PUBLIC_DEV_TRACE を未設定にする。
const DEV_TRACE_ENABLED = process.env.EXPO_PUBLIC_DEV_TRACE === '1';
const DEV_TRACE_KEY = process.env.EXPO_PUBLIC_DEV_TRACE_KEY ?? '';

export function createGeminiProxyClient(): UniversalAiClient | null {
  const baseUrl = getJibunkaigiApiBaseUrl();
  if (!baseUrl) return null;

  return {
    isRemoteEnabled() {
      return true;
    },

    async createReply(request: UniversalAiRequest): Promise<UniversalAiResponse> {
      // 'delegate' is already resolved to a concrete agent at the sendMessage
      // entry point (see useUniversalConversation). The proxy must NOT
      // re-resolve it; it forwards the already-resolved agentId so UI / AI /
      // OTHERS stay consistent.
      const resolvedAgentId = request.agentId;

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
            ...(DEV_TRACE_ENABLED && DEV_TRACE_KEY
              ? { devTrace: true, devTraceKey: DEV_TRACE_KEY }
              : {}),
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
