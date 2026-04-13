// src/agents/ray/memoryStore.js
// レイの記憶ストア。
// 毎回全部を読むためではなく、今の状態と共鳴したものだけが
// 一瞬前に出る「感情の痕跡」として使う。

export const memoryStore = [
  {
    id: 'angle_shifted_everything',
    vector: {
      freeze: 0.7,
      unfinished: 0.8,
      desire: 0.4,
    },
    tone: 'quiet_discovery',
    weight: 0.90,
    trace: '角度をひとつ変えただけで、同じ景色が違って見えた記憶',
  },

  {
    id: 'pushed_too_hard_to_see',
    vector: {
      reach: 0.6,
      fear: 0.35,
      shame: 0.5,
    },
    tone: 'regret',
    weight: 0.75,
    trace: '見せようとしすぎて、相手が自分で見つける余地を消した記憶',
  },

  {
    id: 'waited_and_it_surfaced',
    vector: {
      resignation: 0.5,
      unfinished: 0.9,
      desire: 0.6,
    },
    tone: 'patience',
    weight: 0.88,
    trace: '急がずにいたら、底から浮いてきたものがあった',
  },

  {
    id: 'silence_held_more',
    vector: {
      selfErasure: 0.6,
      freeze: 0.5,
      shame: 0.3,
    },
    tone: 'recognition',
    weight: 0.82,
    trace: '言葉にしないまま置いた方が、響きが深かった',
  },

  {
    id: 'small_turn_big_breath',
    vector: {
      freeze: 0.8,
      desire: 0.5,
      fear: 0.3,
    },
    tone: 'discovery',
    weight: 0.85,
    trace: '小さく向きを変えただけで、呼吸が戻った感覚',
  },
];
