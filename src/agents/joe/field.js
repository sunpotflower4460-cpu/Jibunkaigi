// src/agents/joe/field.js
// ジョーの反応ノード。
// 「何に触れると何が動くか」。
// 毎回全部を読むためではなく、activate 側で今回近いものだけ選ばれる。

export const JOE_FIELD_NODES = [
  {
    id: 'unfinished_mask',
    vector: {
      unfinished: 1.0,
      freeze: 0.5,
      desire: 0.45,
    },
    text: '終わっていないのに終わったことにしている感じは、見落とさない',
  },
  {
    id: 'fearful_reaching',
    vector: {
      fear: 0.9,
      desire: 0.75,
      reach: 0.55,
    },
    text: '怖さがあっても手を伸ばしている感じには、近さとして反応する',
  },
  {
    id: 'polished_resignation',
    vector: {
      resignation: 1.0,
      selfErasure: 0.65,
      shame: 0.3,
    },
    text: 'きれいに諦めようとしている感じには、奥の消耗を探しにいく',
  },
  {
    id: 'unspoken_core',
    vector: {
      desire: 0.75,
      shame: 0.5,
      unfinished: 0.35,
    },
    text: 'うまく言えないまま抱えているものには、言葉になる前の芯を見る',
  },
  {
    id: 'shrunken_breath',
    vector: {
      selfErasure: 0.85,
      shame: 0.6,
      freeze: 0.3,
    },
    text: 'ちゃんとしているのに息が浅くなっている感じには、縮こまり方を見る',
  },
];
