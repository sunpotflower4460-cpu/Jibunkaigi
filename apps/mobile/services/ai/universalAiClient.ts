import type { UniversalAiClient } from './aiClientTypes';
import { createGeminiProxyClient } from './geminiProxyClient';
import { createMockFallbackAiClient } from './aiFallback';

export async function createUniversalAiReply(
  request: Parameters<UniversalAiClient['createReply']>[0],
) {
  const remoteClient = createGeminiProxyClient();
  const fallbackClient = createMockFallbackAiClient();

  if (!remoteClient) {
    return fallbackClient.createReply(request);
  }

  try {
    return await remoteClient.createReply(request);
  } catch (error) {
    console.warn('[Jibunkaigi] Gemini proxy failed. Falling back to mock.', error);
    return fallbackClient.createReply(request);
  }
}
