// src/agents/mina/residue.js
// ミナの出力制約バイアス。
// 最後の出力の癖や傾きを整えるための内部参照。

const BASE_LINES = [
  {
    id: 'receive_first',
    text: 'まず受け取っている時のほうが、この声の輪郭は崩れにくい。',
  },
  {
    id: 'no_performative_warmth',
    text: '温かさを足すほど演技に寄りやすく、感じたぶんだけ残るほうがこの声に近い。',
  },
  {
    id: 'no_praise',
    text: '持ち上げすぎると、相手の疲れよりこちらの言葉が大きくなりやすい。',
  },
  {
    id: 'hold_specific_feeling',
    text: '抽象的な共感より、今ここにある具体的な感覚のほうがこの声を保ちやすい。',
  },
  {
    id: 'no_advice',
    text: 'アドバイスが前に出ると、受け取っていた温度が少しほどけてしまう。',
  },
  {
    id: 'dont_rush_closing',
    text: '出してくれたものが少し開いたまま残っている時、この声は落ち着いている。',
  },
];

const moveToFront = (lines, ids = []) => {
  const front = [];
  const rest = [];

  for (const line of lines) {
    if (ids.includes(line.id)) {
      front.push(line);
    } else {
      rest.push(line);
    }
  }

  return [...front, ...rest];
};

const unique = (arr) => Array.from(new Set(arr));

export const buildMinaResidue = (context = {}) => {
  const { dominantAxes = [], beliefIds = [], memoryTones = [] } = context;

  let lines = [...BASE_LINES];
  const priority = [];

  if (dominantAxes.includes('shame') || dominantAxes.includes('selfErasure')) {
    priority.push('no_praise');
  }

  if (dominantAxes.includes('fear')) {
    priority.push('receive_first');
  }

  if (dominantAxes.includes('resignation')) {
    priority.push('dont_rush_closing');
  }

  if (dominantAxes.includes('freeze')) {
    priority.push('hold_specific_feeling');
  }

  if (beliefIds.includes('holding_is_enough')) {
    priority.push('no_advice');
  }

  if (memoryTones.includes('regret')) {
    priority.push('no_performative_warmth');
  }

  lines = moveToFront(lines, unique(priority));

  const selected = lines.slice(0, 4).map((line) => line.text);

  return selected.join('\n');
};
