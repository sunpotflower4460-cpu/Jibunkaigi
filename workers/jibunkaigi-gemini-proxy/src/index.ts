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

function getAgentLabel(agentId: string): string {
  const labels: Record<string, string> = {
    mirror: '心の鏡',
    delegate: '委ねる',
    ray: 'レイ',
    joe: 'ジョー',
    ken: 'ケン',
    mina: 'ミナ',
    satou: 'サトウ',
  };
  return labels[agentId] || 'レイ';
}

function getModeLabel(modeId: string): string {
  const labels: Record<string, string> = {
    flash: '一閃',
    dialogue: '対話',
    deep: '深淵',
  };
  return labels[modeId] || '対話';
}

function buildPrompt(params: {
  userText: string;
  agentId: string;
  modeId: string;
  messages: Array<{ role?: string; text?: string; agentLabel?: string }>;
}): string {
  const agentLabel = getAgentLabel(params.agentId);
  const modeLabel = getModeLabel(params.modeId);
  const history = params.messages
    .slice(-12)
    .map((msg) =>
      `${msg.role === 'user' ? 'ユーザー' : msg.agentLabel || 'AI'}: ${msg.text || ''}`,
    )
    .join('\n');

  return [
    'あなたは「じぶん会議」の応答生成APIです。',
    '固定の一般チャットではなく、選ばれた視点として短く自然に返してください。',
    '',
    `選択エージェント: ${agentLabel}`,
    `応答モード: ${modeLabel}`,
    '',
    '直近の会話:',
    history || '(なし)',
    '',
    '今回のユーザー入力:',
    params.userText,
    '',
    '返答は日本語で。過剰に長くせず、じぶん会議らしい自然な一言〜数段落にしてください。',
  ].join('\n');
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
      }>();

      const userText = String(body.userText || '').trim();
      const agentId = String(body.agentId || 'ray');
      const modeId = String(body.modeId || 'dialogue');

      if (!userText) {
        return json({ error: 'userText is required' }, 400, env);
      }

      const messages = Array.isArray(body.messages)
        ? (body.messages as Array<{ role?: string; text?: string; agentLabel?: string }>)
        : [];

      const prompt = buildPrompt({ userText, agentId, modeId, messages });
      const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
      const geminiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        return json({ error: 'Gemini request failed', detail: errorText }, 502, env);
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
          agentLabel: getAgentLabel(agentId),
          model,
        },
        200,
        env,
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unexpected error';
      return json(
        {
          error: 'Internal error',
          detail,
        },
        500,
        env,
      );
    }
  },
};
