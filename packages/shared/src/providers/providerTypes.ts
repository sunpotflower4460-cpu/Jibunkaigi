// プロバイダ層の型（指示書11）。ここは純粋な型定義のみ。HTTP 呼び出しは Worker 側に置く。

/** 接続先。すべて OpenAI 互換の Chat Completions で呼ぶ。 */
export type ProviderId = 'groq' | 'sakura' | 'luna' | 'sol' | 'deepseek';

/** 課金プラン。判定はサーバー側で行い、クライアントの申告は信用しない。 */
export type PlanTier = 'free' | 'light' | 'standard' | 'premium';

/**
 * ロールの畳み方。
 * - folded: system に確定テキスト3層、user に body（大多数のプロバイダ）
 * - split : system / developer / tool / user を分ける（GPT系のみ）
 */
export type RoleStyle = 'folded' | 'split';

/** 何のための呼び出しか。 */
export type Purpose = 'reply' | 'others' | 'reflection';

/** split のとき、tool層の材料をどこに置くか。 */
export type MaterialPlacement = 'tool' | 'developer';

export interface ChatToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

/** OpenAI 互換 Chat Completions のメッセージ。 */
export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'developer'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ChatToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string };

export interface ProviderDefinition {
  id: ProviderId;
  /** OpenAI 互換エンドポイントの base URL（末尾に /chat/completions を付けて呼ぶ）。env で上書き可。 */
  baseUrl: string;
  /** 既定のモデルID。env（MODEL_<ID>）で上書き可。 */
  defaultModel: string;
  /** API キーを持つ env 名。 */
  apiKeyEnv: 'GROQ_API_KEY' | 'SAKURA_API_KEY' | 'OPENAI_API_KEY' | 'DEEPSEEK_API_KEY';
  roleStyle: RoleStyle;
  /** 厳密な JSON スキーマ（response_format: json_schema, strict）を使えるか。 */
  strictJson: boolean;
  /** reasoning_effort を送ってよいか（GPT-6 系のみ）。 */
  supportsReasoningEffort: boolean;
}

export const PROVIDER_IDS: readonly ProviderId[] = ['groq', 'sakura', 'luna', 'sol', 'deepseek'];
export const PLAN_TIERS: readonly PlanTier[] = ['free', 'light', 'standard', 'premium'];

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === 'string' && (PROVIDER_IDS as readonly string[]).includes(value);
}

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === 'string' && (PLAN_TIERS as readonly string[]).includes(value);
}
