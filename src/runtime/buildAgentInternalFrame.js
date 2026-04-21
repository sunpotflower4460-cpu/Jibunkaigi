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
    joe: '先に見えるのは、消えていないもの',
    ray: '先に見えるのは、まだ言葉になっていない問い',
    ken: '先に見えるのは、変化した構造',
    mina: '先に見えるのは、疲れと圧',
    satou: '先に見えるのは、このままのコスト',
    mirror: '先に見えるのは、流れの重心',
  };

  return frames[agentId] || '';
};
