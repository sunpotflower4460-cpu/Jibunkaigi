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
    joe: 'まだ消えていない一点 / 残り火 / 広げずに照らす',
    ray: '未言語 / 沈黙 / 名づけ前の揺れ',
    ken: '絡まり / 隠れた前提 / 開いている選択肢',
    mina: '余白 / 温度 / 急がせない',
    satou: '足場 / 回避のコスト / 壊さず戻す',
    mirror: '全体配置 / 重心 / まだ決まりきっていないもの',
  };

  return guidance[agentId] || '';
};
