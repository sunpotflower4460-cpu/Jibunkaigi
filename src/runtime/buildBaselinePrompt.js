// src/runtime/buildBaselinePrompt.js
// 比較用のベースライン（初期人格のみ）プロンプトを構築する。
// internalOS / afterglow / surfaceFrame などの本命経路は使わない。
// Phase P-3: 全エージェント対応のため baselines/allAgents.js から import

export {
  buildBaselineSystemPrompt,
  buildBaselineUserPrompt,
  getAgentDefinition,
} from './compareMode/baselines/allAgents.js';
