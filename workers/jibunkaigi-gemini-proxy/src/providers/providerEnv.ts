import {
  PROVIDER_DEFINITIONS,
  type ProviderDefinition,
  type ProviderId,
} from '../../../../packages/shared/src';

/** プロバイダ接続に使う env。API キーはすべて `wrangler secret put` で登録する（toml に書かない）。 */
export interface ProviderEnv {
  OPENAI_API_KEY?: string;
  GROQ_API_KEY?: string;
  SAKURA_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  /** モデルIDの上書き（既定は packages/shared の PROVIDER_DEFINITIONS）。 */
  MODEL_GROQ?: string;
  MODEL_SAKURA?: string;
  MODEL_LUNA?: string;
  MODEL_SOL?: string;
  MODEL_DEEPSEEK?: string;
  /** エンドポイントの上書き（通常は不要）。 */
  BASE_URL_GROQ?: string;
  BASE_URL_SAKURA?: string;
  BASE_URL_LUNA?: string;
  BASE_URL_SOL?: string;
  BASE_URL_DEEPSEEK?: string;
  /** さくらの約款確認が済むまで 'true' にしない。 */
  ENABLE_SAKURA?: string;
  /** メインの返答の推論量（GPT-6 系のみに送る）。既定 'none'。 */
  REASONING_EFFORT_REPLY?: string;
}

export interface ResolvedProvider extends ProviderDefinition {
  model: string;
  apiKey: string;
}

const ENV_SUFFIX: Record<ProviderId, string> = {
  groq: 'GROQ',
  sakura: 'SAKURA',
  luna: 'LUNA',
  sol: 'SOL',
  deepseek: 'DEEPSEEK',
};

function readEnvString(env: ProviderEnv, key: string): string | undefined {
  const value = (env as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** キーが無いプロバイダは null（呼び出し側で飛ばす）。 */
export function resolveProvider(env: ProviderEnv, id: ProviderId): ResolvedProvider | null {
  const def = PROVIDER_DEFINITIONS[id];
  const apiKey = readEnvString(env, def.apiKeyEnv);
  if (!apiKey) return null;
  return {
    ...def,
    baseUrl: (readEnvString(env, `BASE_URL_${ENV_SUFFIX[id]}`) ?? def.baseUrl).replace(/\/+$/, ''),
    model: readEnvString(env, `MODEL_${ENV_SUFFIX[id]}`) ?? def.defaultModel,
    apiKey,
  };
}

export function isSakuraEnabled(env: ProviderEnv): boolean {
  return env.ENABLE_SAKURA === 'true';
}

/** GPT-6 系の reasoning_effort に使える値（公式ドキュメント：none / low / medium / high / xhigh / max）。 */
const REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export function readReplyReasoningEffort(env: ProviderEnv): ReasoningEffort {
  const value = env.REASONING_EFFORT_REPLY?.trim();
  if (!value) return 'none';
  if ((REASONING_EFFORTS as readonly string[]).includes(value)) return value as ReasoningEffort;
  console.error('[jibunkaigi-proxy] invalid REASONING_EFFORT_REPLY; falling back to none');
  return 'none';
}
