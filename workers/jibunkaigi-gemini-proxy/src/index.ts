import {
  buildUniversalConversationPrompt,
  buildUniversalOthersPrompt,
  CONCRETE_AGENT_IDS,
  getUniversalAgent,
  igniteAndSpread,
  type ConcreteAgentId,
  type OthersPosition,
  type UniversalAgentId,
  type UniversalModeId,
  type UniversalOthersReply,
  type UniversalPromptMessage,
} from '../../../packages/shared/src';

export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  ALLOWED_ORIGIN?: string;
  // 開発者モードのトレース記録用（任意）。未設定なら記録は一切行われない。
  DEV_TRACE_SECRET?: string;
  DEV_TRACE_KV?: KVNamespace;
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
  const allowed = ['mirror', 'delegate', 'ray', 'joe', 'ken', 'mina', 'satou', 'tom', 'fio'] as const;
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

// position が不正・欠落なら neutral にフォールバックする。
function normalizeOthersPosition(value: unknown): OthersPosition {
  const allowed = ['agree', 'question', 'neutral'] as const;
  return (allowed as readonly string[]).includes(String(value))
    ? (value as OthersPosition)
    : 'neutral';
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
      mainReplyText?: unknown;
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

    // ★新規: OTHERSが反応する対象＝メインエージェントの応答本文。無ければ空文字
    // （othersPromptBuilder 側でユーザー入力への反応というフォールバックになる）。
    const mainReplyText = String(body.mainReplyText || '').trim();
    const currentAgentId = normalizeAgentId(String(body.currentAgentId || 'ray'));
    const modeId = normalizeModeId(String(body.modeId || 'dialogue'));
    const userName = readOptionalUserName(body.userName);

    const rawTargets = Array.isArray(body.targetAgentIds) ? body.targetAgentIds : [];
    const explicitTargets: ConcreteAgentId[] = [
      ...new Set(
        rawTargets
          .map((id) => normalizeConcreteAgentId(String(id)))
          .filter((id): id is ConcreteAgentId => id !== null),
      ),
    ].slice(0, 6);

    // 対象人数: その回のメインを除いた全員（現在は7人体制なので最大6人）。
    // プランごとの人数出し分けは未実装なので、今は「メインを除く全員」で固定。
    const targetAgentIds: ConcreteAgentId[] =
      explicitTargets.length > 0
        ? explicitTargets
        : CONCRETE_AGENT_IDS.filter((id) => id !== currentAgentId);

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

    // 活性拡散はエージェントごとに個別に走らせる（純ロジック・LLM不使用・コストゼロ・
    // 人格が保たれる）。入力は userText（ユーザーの言葉）を使う。メインの応答文では
    // ない — 各エージェントはユーザーの言葉に対して内的に反応し、その状態でメインの
    // 応答を聞く、という順序。
    const materials = targetAgentIds.map((agentId) => ({
      agentId,
      surfaced: igniteAndSpread(userText, agentId),
    }));

    const prompt = buildUniversalOthersPrompt(
      {
        sessionId: String(body.sessionId || ''),
        userText,
        mainReplyText,
        currentAgentId,
        modeId,
        messages,
        targetAgentIds,
        userName,
      },
      materials,
    );

    const model = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
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

    let parsed: { replies?: Array<{ agentId?: string; position?: string; text?: string }> };
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
          position: normalizeOthersPosition(r.position),
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

interface DevTraceInput {
  sessionId: string;
  agentId: UniversalAgentId;
  modeId: UniversalModeId;
  userName: string | null;
  input: string;
  context: UniversalPromptMessage[];
  prompt: string;
  output: string;
  model: string;
}

// 軽量AIに「このやり取りをどう受け取ったか」を書かせる（実験用の自己診断）。
async function generateReflection(
  env: Env,
  prompt: string,
  output: string,
): Promise<unknown> {
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const reflectionPrompt =
    'あなたは実験の観察役です。以下の「AIへの指示（システムプロンプト）」と「生成された応答」を読み、次の3点だけを日本語のJSONで答えてください。前置きや説明は不要、JSONのみ。\n' +
    '- felt: この指示群を読んでどう受け取ったか（一人称で短く）\n' +
    '- why: なぜこの応答になったと思うか\n' +
    '- noticed: 違和感や、設定文に引っ張られた箇所などの気づき\n\n' +
    '【指示】\n' +
    prompt +
    '\n\n【応答】\n' +
    output;
  const res = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: reflectionPrompt }] }],
    }),
  });
  if (!res.ok) {
    return { error: `reflection upstream ${res.status}` };
  }
  const data = await res.json<{
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }>();
  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || '';
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return { raw: rawText };
  }
}

// トレース1件をKVに保存（reflection付き）。30日で自動失効。
async function recordTrace(env: Env, data: DevTraceInput): Promise<void> {
  if (!env.DEV_TRACE_KV) return;
  let reflection: unknown = null;
  try {
    reflection = await generateReflection(env, data.prompt, data.output);
  } catch (error) {
    reflection = { error: String(error) };
  }
  const recordedAt = Date.now();
  const trace = { ...data, reflection, recordedAt };
  const key = `trace:${recordedAt}:${data.sessionId}`;
  try {
    await env.DEV_TRACE_KV.put(key, JSON.stringify(trace), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
  } catch (error) {
    console.error('[jibunkaigi-proxy] dev-trace put failed:', error);
  }
}

// 保存済みトレースを読み出す（合言葉が一致したときだけ）。新しい順で返す。
async function handleDevTracesRead(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!env.DEV_TRACE_SECRET || key !== env.DEV_TRACE_SECRET) {
    return json({ error: 'unauthorized' }, 401, env);
  }
  if (!env.DEV_TRACE_KV) {
    return json({ count: 0, traces: [] }, 200, env);
  }
  const list = await env.DEV_TRACE_KV.list({ prefix: 'trace:' });
  const traces: unknown[] = [];
  for (const k of list.keys) {
    const value = await env.DEV_TRACE_KV.get(k.name);
    if (value) {
      try {
        traces.push(JSON.parse(value));
      } catch {
        traces.push({ key: k.name, raw: value });
      }
    }
  }
  traces.sort((a, b) => {
    const ra = (a as { recordedAt?: number }).recordedAt || 0;
    const rb = (b as { recordedAt?: number }).recordedAt || 0;
    return rb - ra;
  });
  return json({ count: traces.length, traces }, 200, env);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/jibunkaigi/dev-traces' && request.method === 'GET') {
      return handleDevTracesRead(request, env);
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
        sessionId?: unknown;
        devTrace?: unknown;
        devTraceKey?: unknown;
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

      // tool層: 入力を活性拡散ネットワークで反応させ、浮上材料を得る。
      // 形態素解析(kuromoji)は未注入＝部分一致のみ（後で tokenizer を足せる設計）。
      // 登録の無い声（mirror/delegate）は ignited 空 → 材料ブロックは差し込まれない。
      const surfaced = igniteAndSpread(userText, agentId);

      const built = buildUniversalConversationPrompt({
        userText,
        agentId,
        modeId,
        messages,
        userName,
        surfaced,
      });

      const model = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
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

      // 開発者モード（合言葉一致）のときだけ、トレースを非同期で記録する。
      // 本番ユーザーは devTraceKey を持たないため、記録は一切走らない。
      if (
        body.devTrace === true &&
        typeof body.devTraceKey === 'string' &&
        env.DEV_TRACE_SECRET &&
        body.devTraceKey === env.DEV_TRACE_SECRET &&
        env.DEV_TRACE_KV
      ) {
        const sessionId = typeof body.sessionId === 'string' ? body.sessionId : 'nosession';
        ctx.waitUntil(
          recordTrace(env, {
            sessionId,
            agentId,
            modeId,
            userName,
            input: userText,
            context: messages,
            prompt: built.prompt,
            output: text,
            model,
          }),
        );
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
