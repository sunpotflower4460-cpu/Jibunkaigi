import {
  buildUniversalConversationPrompt,
  buildUniversalOthersPrompt,
  CONCRETE_AGENT_IDS,
  getUniversalAgent,
  type ConcreteAgentId,
  type UniversalAgentId,
  type UniversalModeId,
  type UniversalOthersReply,
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

function normalizeConcreteAgentId(value: string): ConcreteAgentId | null {
  return (CONCRETE_AGENT_IDS as readonly string[]).includes(value)
    ? (value as ConcreteAgentId)
    : null;
}

function readOptionalUserName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 24) : null;
}

async function handleOthersRequest(request: Request, env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'Missing GEMINI_API_KEY' }, 500, env);
  }

  try {
    const body = await request.json<{
      sessionId?: unknown;
      userText?: unknown;
      currentAgentId?: unknown;
      modeId?: unknown;
      messages?: unknown;
      targetAgentIds?: unknown;
      userName?: unknown;
    }>();

    const userText = String(body.userText || '').trim();
    if (!userText) {
      return json({ error: 'userText is required' }, 400, env);
    }

    const currentAgentId = normalizeAgentId(String(body.currentAgentId || 'ray'));
    const modeId = normalizeModeId(String(body.modeId || 'dialogue'));
    const userName = readOptionalUserName(body.userName);

    const rawTargets = Array.isArray(body.targetAgentIds) ? body.targetAgentIds : [];
    const targetAgentIds: ConcreteAgentId[] = [
      ...new Set(
        rawTargets
          .map((id) => normalizeConcreteAgentId(String(id)))
          .filter((id): id is ConcreteAgentId => id !== null),
      ),
    ].slice(0, 5);

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

    const prompt = buildUniversalOthersPrompt({
      sessionId: String(body.sessionId || ''),
      userText,
      currentAgentId,
      modeId,
      messages,
      targetAgentIds: targetAgentIds.length > 0 ? targetAgentIds : undefined,
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
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[jibunkaigi-proxy] Gemini others upstream error:', geminiResponse.status, errorText);
      return json({ error: 'AI service temporarily unavailable' }, 502, env);
    }

    const data = await geminiResponse.json<{
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    }>();

    const rawText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim() || '';

    if (!rawText) {
      return json({ error: 'Gemini returned empty text' }, 502, env);
    }

    let parsed: { replies?: Array<{ agentId?: string; text?: string }> };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as typeof parsed;
    } catch {
      console.error('[jibunkaigi-proxy] OTHERS JSON parse failed:', rawText.slice(0, 200));
      return json({ error: 'Failed to parse AI response' }, 502, env);
    }

    if (!Array.isArray(parsed.replies)) {
      return json({ error: 'AI response missing replies array' }, 502, env);
    }

    const replies: UniversalOthersReply[] = parsed.replies
      .filter((r) => {
        const agentId = normalizeConcreteAgentId(String(r.agentId || ''));
        return agentId !== null && typeof r.text === 'string' && r.text.trim().length > 0;
      })
      .map((r) => {
        const agentId = normalizeConcreteAgentId(String(r.agentId || '')) as ConcreteAgentId;
        return {
          agentId,
          agentLabel: getUniversalAgent(agentId).label,
          text: String(r.text).trim(),
        };
      });

    if (replies.length === 0) {
      return json({ error: 'All OTHERS replies were empty' }, 502, env);
    }

    return json({ replies, model }, 200, env);
  } catch (error) {
    console.error('[jibunkaigi-proxy] OTHERS internal error:', error);
    return json({ error: 'Internal error' }, 500, env);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/jibunkaigi/others' && request.method === 'POST') {
      return handleOthersRequest(request, env);
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
      const userName = readOptionalUserName(body.userName);

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
