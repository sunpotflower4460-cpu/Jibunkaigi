// src/runtime/buildAgentStateGuide.js
// エージェント別の状態ガイド生成
// 各エージェントが「今回の user state にどう触れるべきか」を示す短いガイドを返す

// Phase II redo → Phase V: 短い日本語ラベル列として復活
export const buildAgentStateGuide = (agentId, _estimatedState = {}) => {
  // 各エージェントごとの薄い差分導線（短いラベルのみ、説明文なし）
  const guides = {
    joe: 'まだ消えていない一点 / 残り火 / 広げずに照らす',
    ray: '未言語 / 沈黙 / 名づけ前の揺れ',
    ken: '絡まり / 隠れた前提 / 開いている選択肢',
    mina: '余白 / 温度 / 急がせない',
    satou: '足場 / 回避のコスト / 壊さず戻す',
    mirror: '全体配置 / 重心 / まだ決まりきっていないもの',
  };

  return guides[agentId] || '';
};
