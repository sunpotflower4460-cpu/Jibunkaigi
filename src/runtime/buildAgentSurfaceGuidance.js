// src/runtime/buildAgentSurfaceGuidance.js
// エージェント別の表層ガイダンス生成
// surfaceFrame を構造データとして伝える（自然文指示を削除）

/**
 * Phase II redo: LLM 向けの文字列指示は出さない。
 * surfaceFrame の情報は select/bind stage で活性化重みに反映済み。
 */
export const buildAgentSurfaceGuidance = ({ agentId: _agentId, surfaceFrame: _surfaceFrame }) => {
  return '';
};
