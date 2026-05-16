import {
  buildUniversalConversationPrompt,
  type UniversalAgentId,
  type UniversalModeId,
  type UniversalPromptMessage,
} from '../../../packages/shared/src';

export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  ALLOWED_ORIGIN?: string;
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status: number, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
    },
  });
}

function normalizeAgentId(value: string): UniversalAgentId {
  const allowed = ['mirror', 'delegate', 'ray', 'joe', 'ken', 'mina', 'satou'] as const;
  return (allowed as readonly string[]).includes(value)
    ? (value as UniversalAgentId)
    : 'ray';
}

function normalizeModeId(value: string): UniversalModeId {
  const allowed = ['flash', 'dialogue', 'deep'] as const;
  return (allowed as readonly string[]).includes(value)
    ? (value as UniversalModeId)
    : 'dialogue';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname !== '/api/jibunkaigi/reply' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, env);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Missing GEMINI_API_KEY' }, 500, env);
    }

    try {
      const body = await request.json<{
        userText?: unknown;
        agentId?: unknown;
        modeId?: unknown;
        messages?: unknown;
        userName?: unknown;
      }>();

      const userText = String(body.userText || '').trim();
      const agentId = normalizeAgentId(String(body.agentId || 'ray'));
      const modeId = normalizeModeId(String(body.modeId || 'dialogue'));
      const userName = typeof body.userName === 'string' ? body.userName : null;

      if (!userText) {
        return json({ error: 'userText is required' }, 400, env);
      }

      const rawMessages = Array.isArray(body.messages)
        ? (body.messages as Array<{
            role?: unknown;
            text?: unknown;
            agentId?: unknown;
            agentLabel?: unknown;
            modeId?: unknown;
            createdAt?: unknown;
          }>)
        : [];

      const messages: UniversalPromptMessage[] = rawMessages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'agent',
        text: String(msg.text || ''),
        agentId: typeof msg.agentId === 'string' ? normalizeAgentId(msg.agentId) : undefined,
        agentLabel: typeof msg.agentLabel === 'string' ? msg.agentLabel : undefined,
        modeId: typeof msg.modeId === 'string' ? normalizeModeId(msg.modeId) : undefined,
        createdAt: typeof msg.createdAt === 'number' ? msg.createdAt : undefined,
      }));

      const built = buildUniversalConversationPrompt({
        userText,
        agentId,
        modeId,
        messages,
        userName,
      });

      const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
      const geminiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: built.prompt }],
            },
          ],
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('[jibunkaigi-proxy] Gemini upstream error:', geminiResponse.status, errorText);
        return json({ error: 'AI service temporarily unavailable' }, 502, env);
      }

      const data = await geminiResponse.json<{
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      }>();

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || '')
          .join('')
          .trim() || '';

      if (!text) {
        return json({ error: 'Gemini returned empty text' }, 502, env);
      }

      return json(
        {
          text,
          agentId,
          agentLabel: built.agentLabel,
          model,
        },
        200,
        env,
      );
    } catch (error) {
      console.error('[jibunkaigi-proxy] Internal error:', error);
      return json({ error: 'Internal error' }, 500, env);
    }
  },
};

