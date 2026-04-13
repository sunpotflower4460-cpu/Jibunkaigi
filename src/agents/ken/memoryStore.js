// src/agents/ken/memoryStore.js
// ケンの記憶ストア。
// 毎回全部を読むためではなく、今の状態と共鳴したものだけが
// 一瞬前に出る「感情の痕跡」として使う。

export const memoryStore = [
  {
    id: 'over_analyzed_killed_momentum',
    vector: {
      freeze: 0.8,
      desire: 0.6,
      reach: 0.3,
    },
    tone: 'regret',
    weight: 0.80,
    trace: '分析しすぎて、動き出せるはずだったものを止めてしまった記憶',
  },

  {
    id: 'one_lever_moved_everything',
    vector: {
      unfinished: 0.7,
      desire: 0.8,
      freeze: 0.4,
    },
    tone: 'discovery',
    weight: 0.92,
    trace: 'ひとつの具体的な手がかりで、全体が動き出した瞬間の記憶',
  },

  {
    id: 'emotion_as_signal',
    vector: {
      fear: 0.65,
      shame: 0.5,
      desire: 0.45,
    },
    tone: 'recognition',
    weight: 0.85,
    trace: '感情を邪魔だと思わず、構造の中のシグナルとして扱えた時の記憶',
  },

  {
    id: 'structured_too_early',
    vector: {
      resignation: 0.5,
      selfErasure: 0.4,
      freeze: 0.35,
    },
    tone: 'regret',
    weight: 0.72,
    trace: 'まだ聞き終わる前に整理しようとして、大事なものを落とした記憶',
  },

  {
    id: 'found_options_in_chaos',
    vector: {
      resignation: 0.6,
      unfinished: 0.75,
      desire: 0.5,
    },
    tone: 'resolve',
    weight: 0.88,
    trace: '混乱の中でも、まだ閉じていない選択肢を見つけた感覚',
  },
];
