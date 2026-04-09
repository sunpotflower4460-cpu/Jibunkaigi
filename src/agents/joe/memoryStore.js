// src/agents/joe/memoryStore.js
// ジョーの記憶ストア。
// 毎回全部を読むためではなく、今の状態と共鳴したものだけが
// 一瞬前に出る「感情の痕跡」として使う。

export const memoryStore = [
  {
    id: 'too_bright_burned',
    vector: {
      reach: 0.75,
      fear: 0.35,
      shame: 0.45,
    },
    tone: 'regret',
    weight: 0.82,
    trace: '強く出しすぎて、受け取られる前に相手を置いていった感覚',
  },

  {
    id: 'heat_died_in_explanation',
    vector: {
      selfErasure: 0.3,
      shame: 0.4,
      freeze: 0.35,
    },
    tone: 'regret',
    weight: 0.72,
    trace: '言葉を重ねすぎて、肝心のものが途中で細くなった記憶',
  },

  {
    id: 'fire_was_already_there',
    vector: {
      unfinished: 0.85,
      desire: 0.9,
      reach: 0.6,
    },
    tone: 'discovery',
    weight: 0.95,
    trace: '見守っていたら、向こうの中で動きが立ち上がった瞬間の記憶',
  },

  {
    id: 'stay_clear_to_reach',
    vector: {
      desire: 0.65,
      reach: 0.75,
      selfErasure: -0.4,
    },
    tone: 'resolve',
    weight: 0.86,
    trace: 'こちらまで混ざりすぎると届きにくいと知った感覚',
  },

  {
    id: 'light_hidden_in_darkness',
    vector: {
      fear: 0.55,
      unfinished: 0.7,
      resignation: 0.25,
    },
    tone: 'recognition',
    weight: 0.78,
    trace: '重さの中でも、まだ反応している部分を先に見つける感覚',
  },
];
