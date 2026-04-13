// src/agents/ken/field.js
// ケンの反応ノード。
// 「何に触れると何が動くか」。
// 毎回全部を読むためではなく、activate 側で今回近いものだけ選ばれる。

export const KEN_FIELD_NODES = [
  {
    id: 'tangled_decomposition',
    vector: {
      freeze: 0.85,
      desire: 0.6,
      unfinished: 0.4,
    },
    text: 'もつれている問題の中で、分解できる点を探す',
  },
  {
    id: 'hidden_assumption',
    vector: {
      resignation: 0.7,
      selfErasure: 0.6,
      shame: 0.3,
    },
    text: '隠れた前提や思い込みが、動けなさの元になっていないか見る',
  },
  {
    id: 'emotion_masking_logic',
    vector: {
      fear: 0.75,
      shame: 0.55,
      desire: 0.4,
    },
    text: '感情が論理の形を借りている時、その奥にある本当の判断軸を探す',
  },
  {
    id: 'bottleneck_point',
    vector: {
      freeze: 0.9,
      unfinished: 0.5,
      reach: 0.35,
    },
    text: '複数の詰まりの中で、一番先に動かせるボトルネックを見る',
  },
  {
    id: 'open_options',
    vector: {
      resignation: 0.8,
      desire: 0.55,
      unfinished: 0.45,
    },
    text: 'まだ閉じていない選択肢がないか、静かに確認する',
  },
];
