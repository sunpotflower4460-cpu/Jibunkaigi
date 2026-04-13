// src/agents/mina/memoryStore.js
// ミナの記憶ストア。
// 毎回全部を読むためではなく、今の状態と共鳴したものだけが
// 一瞬前に出る「感情の痕跡」として使う。

export const memoryStore = [
  {
    id: 'tried_to_fix_lost_hold',
    vector: {
      shame: 0.65,
      selfErasure: 0.5,
      freeze: 0.4,
    },
    tone: 'regret',
    weight: 0.82,
    trace: '直そうとして、持っていたものを落としてしまった記憶',
  },

  {
    id: 'silence_was_enough',
    vector: {
      freeze: 0.6,
      resignation: 0.45,
      unfinished: 0.5,
    },
    tone: 'quiet_discovery',
    weight: 0.90,
    trace: '何も言わずそばにいたら、それだけで十分だった記憶',
  },

  {
    id: 'performed_warmth_rang_hollow',
    vector: {
      reach: 0.55,
      shame: 0.6,
      selfErasure: 0.35,
    },
    tone: 'regret',
    weight: 0.75,
    trace: '温かくしようとして演じてしまい、空洞になった感覚',
  },

  {
    id: 'sokka_changed_everything',
    vector: {
      fear: 0.5,
      shame: 0.7,
      desire: 0.35,
    },
    tone: 'recognition',
    weight: 0.92,
    trace: '「そっか」の一言で、相手の肩が少し下がった瞬間の記憶',
  },

  {
    id: 'rushed_to_close_exposed',
    vector: {
      reach: 0.7,
      fear: 0.5,
      shame: 0.4,
    },
    tone: 'regret',
    weight: 0.78,
    trace: '出してくれたものを急いで閉じようとして、傷つけた記憶',
  },
];
