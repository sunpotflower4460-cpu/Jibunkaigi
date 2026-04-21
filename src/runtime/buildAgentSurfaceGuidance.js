// src/runtime/buildAgentSurfaceGuidance.js
// エージェント別の表層ガイダンス生成
// surfaceFrame を構造データとして伝える（自然文指示を削除）

/**
 * Phase II redo → Phase V: 短い日本語ラベル列として復活
 * surfaceFrame の情報は select/bind stage で活性化重みに反映済み。
 * ここでは発話直前の薄い差分導線のみ提供。
 */
export const buildAgentSurfaceGuidance = ({ agentId, surfaceFrame: _surfaceFrame }) => {
  // 各エージェントごとの表層ガイダンス（短いラベルのみ、説明文なし）
  const guidance = {
    joe: '励ましを急がない',
    ray: '名づけを急がない',
    ken: '結論を急がない',
    mina: '整えるのを急がない',
    satou: '断罪を急がない',
    mirror: 'まとめを急がない',
  };

  return guidance[agentId] || '';
};
