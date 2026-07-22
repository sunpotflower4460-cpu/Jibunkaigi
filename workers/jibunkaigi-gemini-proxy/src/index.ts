import {
  buildCrisisSafetyResponse,
  buildUniversalConversationPrompt,
  buildUniversalOthersPrompt,
  CONCRETE_AGENT_IDS,
  getUniversalAgent,
  igniteAndSpread,
  isCrisisSafetyText,
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
  /** When set, POST endpoints require a valid Firebase ID token for this project. */
  FIREBASE_PROJECT_ID?: string;
  /** Optional best-effort per-IP rate limiting. */
  RATE_LIMIT_KV?: KVNamespace;
  RATE_LIMIT_MAX_PER_MINUTE?: string;
  // 開発者モードのトレース記録用（任意）。未設定なら記録は一切行われない。
  DEV_TRACE_SECRET?: string;
  DEV_TRACE_KV?: KVNamespace;
}

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_USER_TEXT_CHARS = 4_000;
const MAX_MAIN_REPLY_CHARS = 4_000;
const MAX_MESSAGE_COUNT = 30;
const MAX_MESSAGE_TEXT_CHARS = 2_000;
const GEMINI_TIMEOUT_MS = 35_000;
const REFLECTION_TIMEOUT_MS = 20_000;
const MAX_DEV_TRACES = 200;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;

class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let firebaseJwkCache:
  | { keys: Record<string, JsonWebKey>; expiresAt: number }
  | null = null;

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Jibunkaigi-Dev-Trace',
  };
}

function json(
  data: unknown,
  status: number,
  env: Env,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
      ...extraHeaders,
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

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJwtJson<T>(segment: string): T {
  const bytes = base64UrlToBytes(segment);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

async function getFirebaseJwks(): Promise<Record<string, JsonWebKey>> {
  const now = Date.now();
  if (firebaseJwkCache && firebaseJwkCache.expiresAt > now) {
    return firebaseJwkCache.keys;
  }

  const response = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  );
  if (!response.ok) {
    throw new Error(`Firebase JWK fetch failed: ${response.status}`);
  }

  const keys = await response.json<Record<string, JsonWebKey>>();
  firebaseJwkCache = {
    keys,
    // Cache conservatively for one hour. Token verification fails closed if a
    // later refresh cannot be completed.
    expiresAt: now + 60 * 60 * 1_000,
  };
  return keys;
}

async function verifyFirebaseIdToken(token: string, projectId: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const header = decodeJwtJson<{ alg?: unknown; kid?: unknown }>(parts[0]);
    const payload = decodeJwtJson<{
      aud?: unknown;
      iss?: unknown;
      sub?: unknown;
      exp?: unknown;
      iat?: unknown;
    }>(parts[1]);

    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return false;
    if (payload.aud !== projectId) return false;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return false;
    if (typeof payload.sub !== 'string' || !payload.sub) return false;

    const nowSeconds = Math.floor(Date.now() / 1_000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) return false;
    if (typeof payload.iat === 'number' && payload.iat > nowSeconds + 60) return false;

    const jwks = await getFirebaseJwks();
    const jwk = jwks[header.kid];
    if (!jwk) return false;

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(parts[2]),
      signingInput,
    );
  } catch (error) {
    console.error('[jibunkaigi-proxy] Firebase token verification failed:', error);
    return false;
  }
}

async function enforceFirebaseAuth(request: Request, env: Env): Promise<Response | null> {
  // Backwards-compatible migration: auth becomes mandatory when the project ID
  // is configured in the Worker. Production should always set this variable.
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) return null;

  const token = readBearerToken(request);
  if (!token || !(await verifyFirebaseIdToken(token, projectId))) {
    return json({ error: 'unauthorized' }, 401, env);
  }
  return null;
}

async function enforceRateLimit(request: Request, env: Env): Promise<Response | null> {
  if (!env.RATE_LIMIT_KV) return null;

  const configuredLimit = Number(env.RATE_LIMIT_MAX_PER_MINUTE);
  const limit = Number.isFinite(configuredLimit) && configuredLimit > 0
    ? Math.floor(configuredLimit)
    : DEFAULT_RATE_LIMIT_PER_MINUTE;
  const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
  const minuteBucket = Math.floor(Date.now() / 60_000);
  const key = `rate:${minuteBucket}:${clientId}`;
  const current = Number(await env.RATE_LIMIT_KV.get(key)) || 0;

  if (current >= limit) {
    return json(
      { error: 'rate_limited' },
      429,
      env,
      { 'Retry-After': '60' },
    );
  }

  await env.RATE_LIMIT_KV.put(key, String(current + 1), {
    expirationTtl: 120,
  });
  return null;
}

async function readJsonBody<T>(request: Request): Promise<T> {
  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new RequestError(413, 'request body is too large');
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    throw new RequestError(413, 'request body is too large');
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestError(400, 'invalid JSON body');
  }
}

function readUserText(value: unknown): string {
  const text = String(value || '').trim();
  if (!text) throw new RequestError(400, 'userText is required');
  if (text.length > MAX_USER_TEXT_CHARS) {
    throw new RequestError(413, 'userText is too long');
  }
  return text;
}

function normalizeMessages(value: unknown): UniversalPromptMessage[] {
  const rawMessages = Array.isArray(value)
    ? (value as Array<{
        role?: unknown;
        text?: unknown;
        agentId?: unknown;
        agentLabel?: unknown;
        modeId?: unknown;
        createdAt?: unknown;
      }>).slice(-MAX_MESSAGE_COUNT)
    : [];

  return rawMessages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'agent',
    text: String(msg.text || '').slice(0, MAX_MESSAGE_TEXT_CHARS),
    agentId: typeof msg.agentId === 'string' ? normalizeAgentId(msg.agentId) : undefined,
    agentLabel:
      typeof msg.agentLabel === 'string' ? msg.agentLabel.slice(0, 40) : undefined,
    modeId: typeof msg.modeId === 'string' ? normalizeModeId(msg.modeId) : undefined,
    createdAt: typeof msg.createdAt === 'number' ? msg.createdAt : undefined,
  }));
}

async function fetchGemini(
  env: Env,
  prompt: string,
  timeoutMs = GEMINI_TIMEOUT_MS,
): Promise<Response> {
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractGeminiText(data: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}): string {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || ''
  );
}

async function handleOthersRequest(request: Request, env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'Missing GEMINI_API_KEY' }, 500, env);
  }

  try {
    const body = await readJsonBody<{
      sessionId?: unknown;
      userText?: unknown;
      mainReplyText?: unknown;
      currentAgentId?: unknown;
      modeId?: unknown;
      messages?: unknown;
      targetAgentIds?: unknown;
      userName?: unknown;
    }>(request);

    const userText = readUserText(body.userText);
    if (isCrisisSafetyText(userText)) {
      return json(
        {
          replies: [
            {
              agentId: 'mina',
              agentLabel: '安全の案内',
              text: buildCrisisSafetyResponse(),
              position: 'neutral',
            },
          ],
          model: 'safety-static-v1',
        },
        200,
        env,
      );
    }

    const mainReplyText = String(body.mainReplyText || '')
      .trim()
      .slice(0, MAX_MAIN_REPLY_CHARS);
    const currentAgentId = normalizeAgentId(String(body.currentAgentId || 'ray'));
    const modeId = normalizeModeId(String(body.modeId || 'dialogue'));
    const userName = readOptionalUserName(body.userName);

    const rawTargets = Array.isArray(body.targetAgentIds) ? body.targetAgentIds : [];
    const explicitTargets: ConcreteAgentId[] = [
      ...new Set(
        rawTargets
          .map((id) => normalizeConcreteAgentId(String(id)))
          .filter((id): id is ConcreteAgentId => id !== null && id !== currentAgentId),
      ),
    ].slice(0, 6);

    const targetAgentIds: ConcreteAgentId[] =
      explicitTargets.length > 0
        ? explicitTargets
        : CONCRETE_AGENT_IDS.filter((id) => id !== currentAgentId);
    const targetSet = new Set<ConcreteAgentId>(targetAgentIds);
    const messages = normalizeMessages(body.messages);

    const materials = targetAgentIds.map((agentId) => ({
      agentId,
      surfaced: igniteAndSpread(userText, agentId),
    }));

    const prompt = buildUniversalOthersPrompt(
      {
        sessionId: String(body.sessionId || '').slice(0, 128),
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
    const geminiResponse = await fetchGemini(env, prompt);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(
        '[jibunkaigi-proxy] Gemini others upstream error:',
        geminiResponse.status,
        errorText.slice(0, 500),
      );
      return json({ error: 'AI service temporarily unavailable' }, 502, env);
    }

    const data = await geminiResponse.json<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }>();
    const rawText = extractGeminiText(data);
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

    const seen = new Set<ConcreteAgentId>();
    const replies: UniversalOthersReply[] = [];
    for (const reply of parsed.replies) {
      const agentId = normalizeConcreteAgentId(String(reply.agentId || ''));
      if (!agentId || !targetSet.has(agentId) || seen.has(agentId)) continue;
      if (typeof reply.text !== 'string' || !reply.text.trim()) continue;

      seen.add(agentId);
      replies.push({
        agentId,
        agentLabel: getUniversalAgent(agentId).label,
        text: reply.text.trim().slice(0, 2_000),
        position: normalizeOthersPosition(reply.position),
      });
    }

    if (replies.length === 0) {
      return json({ error: 'All OTHERS replies were invalid or empty' }, 502, env);
    }

    return json({ replies, model }, 200, env);
  } catch (error) {
    if (error instanceof RequestError) {
      return json({ error: error.message }, error.status, env);
    }
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

async function generateReflection(
  env: Env,
  prompt: string,
  output: string,
): Promise<unknown> {
  const reflectionPrompt =
    'あなたは実験の観察役です。以下の「AIへの指示（システムプロンプト）」と「生成された応答」を読み、次の3点だけを日本語のJSONで答えてください。前置きや説明は不要、JSONのみ。\n' +
    '- felt: この指示群を読んでどう受け取ったか（一人称で短く）\n' +
    '- why: なぜこの応答になったと思うか\n' +
    '- noticed: 違和感や、設定文に引っ張られた箇所などの気づき\n\n' +
    '【指示】\n' +
    prompt +
    '\n\n【応答】\n' +
    output;
  const response = await fetchGemini(env, reflectionPrompt, REFLECTION_TIMEOUT_MS);
  if (!response.ok) {
    return { error: `reflection upstream ${response.status}` };
  }
  const data = await response.json<{
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }>();
  const rawText = extractGeminiText(data);
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return { raw: rawText };
  }
}

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

function readDevTraceSecret(request: Request): string | null {
  const headerSecret = request.headers.get('X-Jibunkaigi-Dev-Trace')?.trim();
  if (headerSecret) return headerSecret;
  return readBearerToken(request);
}

async function handleDevTracesRead(request: Request, env: Env): Promise<Response> {
  const key = readDevTraceSecret(request);
  if (!env.DEV_TRACE_SECRET || key !== env.DEV_TRACE_SECRET) {
    return json({ error: 'unauthorized' }, 401, env);
  }
  if (!env.DEV_TRACE_KV) {
    return json({ count: 0, traces: [] }, 200, env);
  }

  const traces: unknown[] = [];
  let cursor: string | undefined;
  do {
    const list = await env.DEV_TRACE_KV.list({
      prefix: 'trace:',
      cursor,
      limit: 1_000,
    });
    for (const item of list.keys) {
      if (traces.length >= MAX_DEV_TRACES) break;
      const value = await env.DEV_TRACE_KV.get(item.name);
      if (!value) continue;
      try {
        traces.push(JSON.parse(value));
      } catch {
        traces.push({ key: item.name, raw: value });
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor && traces.length < MAX_DEV_TRACES);

  traces.sort((a, b) => {
    const recordedAtA = (a as { recordedAt?: number }).recordedAt || 0;
    const recordedAtB = (b as { recordedAt?: number }).recordedAt || 0;
    return recordedAtB - recordedAtA;
  });
  return json({ count: traces.length, traces }, 200, env);
}

async function handleReplyRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'Missing GEMINI_API_KEY' }, 500, env);
  }

  try {
    const body = await readJsonBody<{
      userText?: unknown;
      agentId?: unknown;
      modeId?: unknown;
      messages?: unknown;
      userName?: unknown;
      sessionId?: unknown;
      devTrace?: unknown;
      /** Legacy only; new clients send the secret in X-Jibunkaigi-Dev-Trace. */
      devTraceKey?: unknown;
    }>(request);

    const userText = readUserText(body.userText);
    const agentId = normalizeAgentId(String(body.agentId || 'ray'));
    const modeId = normalizeModeId(String(body.modeId || 'dialogue'));
    const userName = readOptionalUserName(body.userName);

    // Crisis routing is deliberately before persona/tool/prompt execution and
    // before development tracing. Direct safety language never becomes model
    // training/debug material and never receives a character performance.
    if (isCrisisSafetyText(userText)) {
      return json(
        {
          text: buildCrisisSafetyResponse(),
          agentId: 'mirror',
          agentLabel: getUniversalAgent('mirror').label,
          model: 'safety-static-v1',
        },
        200,
        env,
      );
    }

    const messages = normalizeMessages(body.messages);
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
    const geminiResponse = await fetchGemini(env, built.prompt);
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(
        '[jibunkaigi-proxy] Gemini upstream error:',
        geminiResponse.status,
        errorText.slice(0, 500),
      );
      return json({ error: 'AI service temporarily unavailable' }, 502, env);
    }

    const data = await geminiResponse.json<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }>();
    const text = extractGeminiText(data);
    if (!text) {
      return json({ error: 'Gemini returned empty text' }, 502, env);
    }

    const headerTraceKey = request.headers.get('X-Jibunkaigi-Dev-Trace')?.trim();
    const legacyTraceKey = typeof body.devTraceKey === 'string' ? body.devTraceKey : null;
    const suppliedTraceKey = headerTraceKey || legacyTraceKey;
    if (
      body.devTrace === true &&
      suppliedTraceKey &&
      env.DEV_TRACE_SECRET &&
      suppliedTraceKey === env.DEV_TRACE_SECRET &&
      env.DEV_TRACE_KV
    ) {
      const sessionId = typeof body.sessionId === 'string'
        ? body.sessionId.slice(0, 128)
        : 'nosession';
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
    if (error instanceof RequestError) {
      return json({ error: error.message }, error.status, env);
    }
    console.error('[jibunkaigi-proxy] Internal error:', error);
    return json({ error: 'Internal error' }, 500, env);
  }
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

    const isReply = url.pathname === '/api/jibunkaigi/reply' && request.method === 'POST';
    const isOthers = url.pathname === '/api/jibunkaigi/others' && request.method === 'POST';
    if (!isReply && !isOthers) {
      return json({ error: 'Not found' }, 404, env);
    }

    const rateLimitResponse = await enforceRateLimit(request, env);
    if (rateLimitResponse) return rateLimitResponse;

    const authResponse = await enforceFirebaseAuth(request, env);
    if (authResponse) return authResponse;

    return isOthers
      ? handleOthersRequest(request, env)
      : handleReplyRequest(request, env, ctx);
  },
};
