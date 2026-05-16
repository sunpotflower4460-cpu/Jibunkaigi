import { createOthersProxyClient } from './othersProxyClient';
import { createOthersFallbackClient } from './othersFallback';
import type { UniversalOthersAiRequest } from './othersClientTypes';

export async function createUniversalOthersReplies(request: UniversalOthersAiRequest) {
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
