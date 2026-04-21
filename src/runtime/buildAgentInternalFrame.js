// src/runtime/buildAgentInternalFrame.js
// エージェント別の内部フレーム生成
// internalOS を短ラベル中心で伝える（自然文削除）

// Phase II redo → Phase V: 短い日本語ラベル列として復活
export const buildAgentInternalFrame = ({
  agentId,
  internalOS: _internalOS,
  estimatedState: _estimatedState = {},
}) => {
  // 各エージェントごとの内部視点（短いラベルのみ、説明文なし）
  const frames = {
    joe: 'まだ残っている火種',
    ray: 'まだ言葉になっていない問い',
    ken: '変化した構造 / 絡まり',
    mina: '先に休ませるべき部分',
    satou: 'このまま続けた時のコスト',
    mirror: 'ここまでの流れの重心',
  };

  return frames[agentId] || '';
};
