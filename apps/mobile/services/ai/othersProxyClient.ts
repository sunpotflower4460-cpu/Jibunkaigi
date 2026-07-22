import {
  CONCRETE_AGENT_IDS,
  getUniversalAgent,
  type ConcreteAgentId,
  type OthersPosition,
} from '@jibunkaigi/shared';
import { getJibunkaigiApiBaseUrl } from '../../config/mobileApiConfig';
import { getMobileFirebaseIdToken } from '../firebase/mobileAuth';
import type {
  UniversalOthersAiRequest,
  UniversalOthersAiResponse,
} from './othersClientTypes';

const REQUEST_TIMEOUT_MS = 45000;

function isConcreteAgentId(value: unknown): value is ConcreteAgentId {
  return typeof value === 'string' && (CONCRETE_AGENT_IDS as readonly string[]).includes(value);
}

function normalizePosition(value: unknown): OthersPosition {
  return value === 'agree' || value === 'question' || value === 'neutral'
    ? value
    : 'neutral';
}

export function createOthersProxyClient() {
  const baseUrl = getJibunkaigiApiBaseUrl();
  if (!baseUrl) return null;

  return {
    async createOthers(request: UniversalOthersAiRequest): Promise<UniversalOthersAiResponse> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const idToken = await getMobileFirebaseIdToken();
        const response = await fetch(`${baseUrl}/api/jibunkaigi/others`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            sessionId: request.sessionId,
            userText: request.userText,
            mainReplyText: request.mainReplyText,
            currentAgentId: request.currentAgentId,
            modeId: request.modeId,
            messages: request.messages.slice(-20),
            targetAgentIds: request.targetAgentIds,
            userName: request.userName,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`OTHERS proxy failed: ${response.status}`);
        }

        const data = await response.json() as { replies?: unknown; model?: unknown };
        if (!data || !Array.isArray(data.replies)) {
          throw new Error('OTHERS proxy returned invalid response');
        }

        const allowedAgentIds = new Set<ConcreteAgentId>(
          request.targetAgentIds?.length
            ? request.targetAgentIds.filter((id) => id !== request.currentAgentId)
            : CONCRETE_AGENT_IDS.filter((id) => id !== request.currentAgentId),
        );
        const seen = new Set<ConcreteAgentId>();
        const replies: UniversalOthersAiResponse['replies'] = [];

        for (const raw of data.replies) {
          if (!raw || typeof raw !== 'object') continue;
          const candidate = raw as {
            agentId?: unknown;
            agentLabel?: unknown;
            text?: unknown;
            position?: unknown;
          };
          if (!isConcreteAgentId(candidate.agentId)) continue;
          if (!allowedAgentIds.has(candidate.agentId) || seen.has(candidate.agentId)) continue;
          if (typeof candidate.text !== 'string' || !candidate.text.trim()) continue;

          seen.add(candidate.agentId);
          replies.push({
            agentId: candidate.agentId,
            agentLabel:
              typeof candidate.agentLabel === 'string' && candidate.agentLabel.trim()
                ? candidate.agentLabel.trim()
                : getUniversalAgent(candidate.agentId).label,
            text: candidate.text.trim(),
            position: normalizePosition(candidate.position),
          });
        }

        if (replies.length === 0) {
          throw new Error('OTHERS proxy returned no valid replies');
        }

        return {
          replies,
          source: 'proxy',
          model: typeof data.model === 'string' ? data.model : undefined,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
