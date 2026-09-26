// OpenAI 互換 Chat Completions の1回分の呼び出し（OpenAI / Groq / さくら / DeepSeek 共通）。
// 滝型の順番・次へ進む判定は callWithFallback.ts が持つ。ここは1社を1回叩くだけ。

import type { ChatMessage } from '../../../../packages/shared/src';
import type { ReasoningEffort, ResolvedProvider } from './providerEnv';

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  /** GPT-6 系にだけ送る。非GPTのプロバイダには送らない。 */
  reasoningEffort?: ReasoningEffort;
  /** 合成 tool 呼び出しを含むときの tools 定義。tool_choice は 'none' で送る。 */
  tools?: unknown[];
  responseFormat?: unknown;
}

export interface NormalizedUsage {
  inputTokens: number;
  /** キャッシュに当たった入力トークン（OpenAI: prompt_tokens_details.cached_tokens / DeepSeek: prompt_cache_hit_tokens）。 */
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
}

export type ChatCompletionOutcome =
  | {
      ok: true;
      text: string;
      usage: NormalizedUsage | null;
      rateLimit: Record<string, string>;
    }
  | {
      ok: false;
      kind: 'http' | 'timeout' | 'network' | 'empty' | 'invalid-response';
      status?: number;
      /** 上流エラー本文の先頭（ログ用。クライアントには返さない）。 */
      detail?: string;
      rateLimit: Record<string, string>;
    };

const RATE_LIMIT_HEADERS = [
  'x-ratelimit-remaining-requests',
  'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-requests',
  'x-ratelimit-reset-tokens',
  'retry-after',
];

function readRateLimit(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of RATE_LIMIT_HEADERS) {
    const value = headers.get(name);
    if (value) out[name] = value;
  }
  return out;
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function normalizeUsage(raw: unknown): NormalizedUsage | null {
  if (!raw || typeof raw !== 'object') return null;
  const usage = raw as {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    prompt_tokens_details?: { cached_tokens?: unknown };
    completion_tokens_details?: { reasoning_tokens?: unknown };
    prompt_cache_hit_tokens?: unknown;
  };
  const cached =
    toNumber(usage.prompt_tokens_details?.cached_tokens) || toNumber(usage.prompt_cache_hit_tokens);
  const reasoning = usage.completion_tokens_details?.reasoning_tokens;
  return {
    inputTokens: toNumber(usage.prompt_tokens),
    cachedInputTokens: cached,
    outputTokens: toNumber(usage.completion_tokens),
    ...(typeof reasoning === 'number' ? { reasoningTokens: reasoning } : {}),
  };
}

export function buildChatCompletionBody(
  provider: ResolvedProvider,
  request: ChatCompletionRequest,
): Record<string, unknown> {
  return {
    model: provider.model,
    messages: request.messages,
    ...(provider.supportsReasoningEffort && request.reasoningEffort
      ? { reasoning_effort: request.reasoningEffort }
      : {}),
    ...(request.tools && request.tools.length > 0
      ? { tools: request.tools, tool_choice: 'none' }
      : {}),
    ...(request.responseFormat ? { response_format: request.responseFormat } : {}),
  };
}

export async function callChatCompletion(
  provider: ResolvedProvider,
  request: ChatCompletionRequest,
  timeoutMs: number,
): Promise<ChatCompletionOutcome> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));

  let response: Response;
  try {
    response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(buildChatCompletionBody(provider, request)),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const aborted = controller.signal.aborted;
    return {
      ok: false,
      kind: aborted ? 'timeout' : 'network',
      detail: aborted ? undefined : String(error).slice(0, 200),
      rateLimit: {},
    };
  }

  try {
    const rateLimit = readRateLimit(response.headers);
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 500);
      return { ok: false, kind: 'http', status: response.status, detail, rateLimit };
    }

    let data: {
      choices?: Array<{ message?: { content?: unknown } }>;
      usage?: unknown;
    };
    try {
      data = await response.json();
    } catch {
      return { ok: false, kind: 'invalid-response', status: response.status, rateLimit };
    }

    const content = data?.choices?.[0]?.message?.content;
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) {
      return { ok: false, kind: 'empty', status: response.status, rateLimit };
    }
    return { ok: true, text, usage: normalizeUsage(data.usage), rateLimit };
  } catch (error) {
    const aborted = controller.signal.aborted;
    return {
      ok: false,
      kind: aborted ? 'timeout' : 'network',
      detail: aborted ? undefined : String(error).slice(0, 200),
      rateLimit: {},
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
