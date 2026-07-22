import { UNIVERSAL_AGENTS, type UniversalAgentId } from '@jibunkaigi/shared';
import { getJibunkaigiApiBaseUrl } from '../../config/mobileApiConfig';
import { getMobileFirebaseIdToken } from '../firebase/mobileAuth';
import type {
  UniversalAiClient,
  UniversalAiRequest,
  UniversalAiResponse,
} from './aiClientTypes';
import { isWarmthState } from './warmthState';

const REQUEST_TIMEOUT_MS = 30000;

// 開発者モードのトレース送信フラグ。本番ビルドでは EXPO_PUBLIC_DEV_TRACE を未設定にする。
const DEV_TRACE_ENABLED = process.env.EXPO_PUBLIC_DEV_TRACE === '1';
const DEV_TRACE_KEY = process.env.EXPO_PUBLIC_DEV_TRACE_KEY ?? '';

function isUniversalAgentId(value: unknown): value is UniversalAgentId {
  return typeof value === 'string' && UNIVERSAL_AGENTS.some((agent) => agent.id === value);
}

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
        const idToken = await getMobileFirebaseIdToken();
        const response = await fetch(`${baseUrl}/api/jibunkaigi/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            ...(DEV_TRACE_ENABLED && DEV_TRACE_KEY
              ? { 'X-Jibunkaigi-Dev-Trace': DEV_TRACE_KEY }
              : {}),
          },
          body: JSON.stringify({
            sessionId: request.sessionId,
            userText: request.userText,
            agentId: resolvedAgentId,
            modeId: request.modeId,
            messages: request.messages.slice(-20),
            userName: request.userName,
            ...(request.warmth ? { warmth: request.warmth } : {}),
            ...(DEV_TRACE_ENABLED && DEV_TRACE_KEY ? { devTrace: true } : {}),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Gemini proxy failed: ${response.status}`);
        }

        const data = await response.json() as {
          text?: unknown;
          agentId?: unknown;
          agentLabel?: unknown;
          model?: unknown;
          warmth?: unknown;
        };

        if (!data || typeof data.text !== 'string' || !data.text.trim()) {
          throw new Error('Gemini proxy returned invalid response');
        }

        return {
          text: data.text.trim(),
          agentId: isUniversalAgentId(data.agentId) ? data.agentId : resolvedAgentId,
          agentLabel: typeof data.agentLabel === 'string' ? data.agentLabel : '',
          source: 'proxy',
          model: typeof data.model === 'string' ? data.model : undefined,
          warmth: isWarmthState(data.warmth) ? data.warmth : undefined,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
