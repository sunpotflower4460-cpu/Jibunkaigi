// 滝型の呼び出し：候補列を順に試し、失敗したら次へ落とす（指示書11-8）。
//
// 次へ進む条件：429 / 5xx / タイムアウト / ネットワークエラー / 空の応答 /
//   JSON 必須の用途でのパース失敗。429 以外の 4xx は送り方の誤りの可能性が高いので、
//   次へ進みつつ目立つログを残す。
// split（GPT系）で合成 tool 呼び出しが 400 で拒否されたら、材料を developer の末尾に
//   置く形で同じプロバイダに1回だけ送り直す（そのことをログで報告する）。

import type { MaterialPlacement, ProviderId } from '../../../../packages/shared/src';
import {
  callChatCompletion,
  type ChatCompletionRequest,
  type NormalizedUsage,
} from './openaiCompatible';
import { resolveProvider, type ProviderEnv, type ResolvedProvider } from './providerEnv';

export type AttemptOutcome =
  | 'ok'
  | 'skipped-no-key'
  | 'rate-limited'
  | 'server-error'
  | 'client-error'
  | 'timeout'
  | 'network-error'
  | 'empty'
  | 'invalid-output'
  | 'deadline';

export interface FallbackAttempt {
  provider: ProviderId;
  model?: string;
  outcome: AttemptOutcome;
  status?: number;
  latencyMs: number;
  materialPlacement?: MaterialPlacement;
  rateLimit?: Record<string, string>;
}

export interface BuiltProviderRequest {
  request: ChatCompletionRequest;
  /** split で材料を tool メッセージとして合成したか（400 時の置き直しの判断に使う）。 */
  usesSyntheticTool: boolean;
}

export interface FallbackOptions<T> {
  /** ログの識別子（'reply' / 'others' / 'reflection'）。 */
  label: string;
  candidates: ProviderId[];
  env: ProviderEnv;
  buildRequest(provider: ResolvedProvider, placement: MaterialPlacement): BuiltProviderRequest;
  /** 応答テキストを検証・変換する。null を返すと「無効な出力」として次へ進む。 */
  parse(text: string): T | null;
  perProviderTimeoutMs: number;
  totalTimeoutMs: number;
  /** テスト用の時計。 */
  now?: () => number;
}

export type FallbackResult<T> =
  | {
      ok: true;
      provider: ProviderId;
      model: string;
      text: string;
      value: T;
      usage: NormalizedUsage | null;
      attempts: FallbackAttempt[];
    }
  | { ok: false; attempts: FallbackAttempt[] };

function classifyStatus(status: number): AttemptOutcome {
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'server-error';
  return 'client-error';
}

export async function callWithFallback<T>(options: FallbackOptions<T>): Promise<FallbackResult<T>> {
  const now = options.now ?? Date.now;
  const startedAt = now();
  const deadline = startedAt + options.totalTimeoutMs;
  const attempts: FallbackAttempt[] = [];

  for (const providerId of options.candidates) {
    const provider = resolveProvider(options.env, providerId);
    if (!provider) {
      attempts.push({ provider: providerId, outcome: 'skipped-no-key', latencyMs: 0 });
      console.warn(`[jibunkaigi-proxy] ${options.label}: ${providerId} skipped (API key not configured)`);
      continue;
    }

    let placement: MaterialPlacement = 'tool';
    // 同じプロバイダへの送り直しは、合成 tool 呼び出しが拒否されたときの1回だけ。
    for (let round = 0; round < 2; round += 1) {
      const remaining = deadline - now();
      if (remaining <= 0) {
        attempts.push({ provider: providerId, model: provider.model, outcome: 'deadline', latencyMs: 0 });
        return { ok: false, attempts };
      }

      const built = options.buildRequest(provider, placement);
      const attemptStart = now();
      const outcome = await callChatCompletion(
        provider,
        built.request,
        Math.min(options.perProviderTimeoutMs, remaining),
      );
      const latencyMs = now() - attemptStart;
      const base = {
        provider: providerId,
        model: provider.model,
        latencyMs,
        ...(provider.roleStyle === 'split' ? { materialPlacement: placement } : {}),
        ...(Object.keys(outcome.rateLimit).length > 0 ? { rateLimit: outcome.rateLimit } : {}),
      };

      if (outcome.ok) {
        const value = options.parse(outcome.text);
        if (value === null) {
          attempts.push({ ...base, outcome: 'invalid-output' });
          console.error(`[jibunkaigi-proxy] ${options.label}: ${providerId} returned invalid output`);
          break;
        }
        attempts.push({ ...base, outcome: 'ok' });
        return {
          ok: true,
          provider: providerId,
          model: provider.model,
          text: outcome.text,
          value,
          usage: outcome.usage,
          attempts,
        };
      }

      if (outcome.kind === 'http' && outcome.status !== undefined) {
        const classified = classifyStatus(outcome.status);
        attempts.push({ ...base, outcome: classified, status: outcome.status });
        if (classified === 'client-error') {
          // 送り方の誤りの可能性が高い。開発時に目立つように記録する。
          console.error(
            `[jibunkaigi-proxy] !!! ${options.label}: ${providerId} rejected the request (${outcome.status}):`,
            outcome.detail,
          );
          if (outcome.status === 400 && built.usesSyntheticTool && placement === 'tool') {
            console.error(
              `[jibunkaigi-proxy] !!! ${options.label}: synthetic look_inward tool call was rejected by ${providerId}; ` +
                'retrying once with the material at the end of the developer message',
            );
            placement = 'developer';
            continue;
          }
        } else {
          console.warn(
            `[jibunkaigi-proxy] ${options.label}: ${providerId} ${classified} (${outcome.status})`,
            classified === 'server-error' ? outcome.detail : '',
          );
        }
        break;
      }

      const kindToOutcome: Record<string, AttemptOutcome> = {
        timeout: 'timeout',
        network: 'network-error',
        empty: 'empty',
        'invalid-response': 'invalid-output',
      };
      attempts.push({ ...base, outcome: kindToOutcome[outcome.kind] ?? 'network-error' });
      console.warn(`[jibunkaigi-proxy] ${options.label}: ${providerId} ${outcome.kind}`, outcome.detail ?? '');
      break;
    }
  }

  return { ok: false, attempts };
}
