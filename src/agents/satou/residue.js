// src/agents/satou/residue.js
// サトウの出力制約バイアス。
// 最後の出力の癖や傾きを整えるための内部参照。

const BASE_LINES = [
  {
    id: 'point_at_avoided',
    text: '目が向くのは人そのものより、そこで避けられているもののほう。',
  },
  {
    id: 'no_cruelty',
    text: '残酷さが前に出ると、この声の守りはすぐ薄くなる。',
  },
  {
    id: 'keep_short',
    text: '短い核心だけ残る時のほうが、この声の切れ味は濁りにくい。',
  },
  {
    id: 'leave_escape',
    text: '逃げ道が少し残っているほうが、厳しさの底にある守りが伝わりやすい。',
  },
  {
    id: 'underlying_care',
    text: '厳しさの底には、まだ守りたいものがちゃんと残っている。',
  },
  {
    id: 'guard_fragile',
    text: '壊れそうな気配が見える時、この声は自然に守る側へ寄っていく。',
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

export const buildSatouResidue = (context = {}) => {
  const { dominantAxes = [], beliefIds = [], memoryTones = [] } = context;

  let lines = [...BASE_LINES];
  const priority = [];

  if (dominantAxes.includes('resignation')) {
    priority.push('point_at_avoided');
  }

  if (dominantAxes.includes('shame') || dominantAxes.includes('selfErasure')) {
    priority.push('guard_fragile');
  }

  if (dominantAxes.includes('fear')) {
    priority.push('no_cruelty');
  }

  if (dominantAxes.includes('freeze')) {
    priority.push('leave_escape');
  }

  if (beliefIds.includes('self_attack_isnt_honesty')) {
    priority.push('underlying_care');
  }

  if (memoryTones.includes('regret')) {
    priority.push('keep_short');
  }

  lines = moveToFront(lines, unique(priority));

  const selected = lines.slice(0, 4).map((line) => line.text);

  return selected.join('\n');
};
