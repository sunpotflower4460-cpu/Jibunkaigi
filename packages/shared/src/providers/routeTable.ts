// プラン × 用途 → プロバイダの並び（指示書11-3）。データで持ち、コードの分岐にしない。
//
// 無料枠（Groq・さくら）を使うのは無料プランのメインの返答だけ。OTHERS と reflection は
// JSON で受け取るため、無料プランでも常に Luna（厳密な JSON スキーマを強制できる）。
// DeepSeek は全プラン共通の最後のフォールバック（一社依存の保険）。

import type { PlanTier, ProviderDefinition, ProviderId, Purpose } from './providerTypes';

export const ROUTE_TABLE: Record<PlanTier, Record<Purpose, ProviderId[]>> = {
  free:     { reply: ['groq', 'sakura', 'luna', 'deepseek'], others: ['luna', 'deepseek'], reflection: ['luna'] },
  light:    { reply: ['luna', 'deepseek'],                   others: ['luna', 'deepseek'], reflection: ['luna'] },
  // スタンダードを Sol にするかは第13部の監査結果で決める。切り替えはこの1行だけ。
  standard: { reply: ['luna', 'deepseek'],                   others: ['luna', 'deepseek'], reflection: ['luna'] },
  premium:  { reply: ['sol', 'luna', 'deepseek'],            others: ['luna', 'deepseek'], reflection: ['luna'] },
};

// 既定のエンドポイントとモデルID。2026-09 時点で各社公式ドキュメント（検索結果）により確認。
// すべて env で上書きできる（BASE_URL_<ID> / MODEL_<ID>）。
export const PROVIDER_DEFINITIONS: Record<ProviderId, ProviderDefinition> = {
  groq: {
    id: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    apiKeyEnv: 'GROQ_API_KEY',
    roleStyle: 'folded',
    strictJson: false,
    supportsReasoningEffort: false,
  },
  sakura: {
    id: 'sakura',
    baseUrl: 'https://api.ai.sakura.ad.jp/v1',
    defaultModel: 'gpt-oss-120b',
    apiKeyEnv: 'SAKURA_API_KEY',
    roleStyle: 'folded',
    strictJson: false,
    supportsReasoningEffort: false,
  },
  luna: {
    id: 'luna',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-6-luna',
    apiKeyEnv: 'OPENAI_API_KEY',
    roleStyle: 'split',
    strictJson: true,
    supportsReasoningEffort: true,
  },
  sol: {
    id: 'sol',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-6-sol',
    apiKeyEnv: 'OPENAI_API_KEY',
    roleStyle: 'split',
    strictJson: true,
    supportsReasoningEffort: true,
  },
  deepseek: {
    id: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    // DeepSeek-V4.1-Flash の現行名。旧名 deepseek-v4-flash も受け付けられるが V4.1 に振り替えられる。
    defaultModel: 'deepseek-flash',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    roleStyle: 'folded',
    strictJson: false,
    supportsReasoningEffort: false,
  },
};
