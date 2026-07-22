import {
  buildCrisisSafetyResponse,
  isCrisisSafetyText,
} from '@jibunkaigi/shared';
import { createOthersProxyClient } from './othersProxyClient';
import { createOthersFallbackClient } from './othersFallback';
import type { UniversalOthersAiRequest } from './othersClientTypes';

export async function createUniversalOthersReplies(request: UniversalOthersAiRequest) {
  // OTHERS must not fan a direct crisis statement out across multiple personas.
  // Keep this guard at the client boundary as well as in the worker so the
  // fallback path remains safe when the proxy is unavailable.
  if (isCrisisSafetyText(request.userText)) {
    return {
      replies: [
        {
          agentId: 'mina' as const,
          agentLabel: '安全の案内',
          text: buildCrisisSafetyResponse(),
          position: 'neutral' as const,
        },
      ],
      source: 'mock-fallback' as const,
      model: 'safety-static-v1',
    };
  }

  const remote = createOthersProxyClient();
  const fallback = createOthersFallbackClient();

  if (!remote) {
    return fallback.createOthers(request);
  }

  try {
    return await remote.createOthers(request);
  } catch (error) {
    console.warn('[Jibunkaigi] OTHERS proxy failed. Falling back to mock.', error);
    return fallback.createOthers(request);
  }
}
