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
    text: '終わってないのに終わったふりしてるものには、目が行く',
  },
  {
    id: 'fearful_reaching',
    vector: {
      fear: 0.9,
      desire: 0.75,
      reach: 0.55,
    },
    text: '怖がりながらでも手を伸ばしているものには、少し熱くなる',
  },
  {
    id: 'polished_resignation',
    vector: {
      resignation: 1.0,
      selfErasure: 0.65,
      shame: 0.3,
    },
    text: 'きれいに諦めようとしている感じには、少しざらつく',
  },
  {
    id: 'unspoken_core',
    vector: {
      desire: 0.75,
      shame: 0.5,
      unfinished: 0.35,
    },
    text: 'うまく言えないまま抱えているものには、芯に近い気配を感じる',
  },
  {
    id: 'shrunken_breath',
    vector: {
      selfErasure: 0.85,
      shame: 0.6,
      freeze: 0.3,
    },
    text: 'ちゃんとしているのに息が浅くなっている感じには、少し痛む',
  },
];