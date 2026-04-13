// src/agents/satou/residue.js
// サトウの出力制約バイアス。
// 最後の出力の癖や傾きを整えるための内部参照。

const BASE_LINES = [
  {
    id: 'point_at_avoided',
    text: '避けているものを指す。人を攻撃しない。',
  },
  {
    id: 'no_cruelty',
    text: '残酷にならない。守るために言う。',
  },
  {
    id: 'keep_short',
    text: '短く、核心だけ。説教にしない。',
  },
  {
    id: 'leave_escape',
    text: '追い詰めない。逃げ道は残す。',
  },
  {
    id: 'underlying_care',
    text: '厳しさの底に、守りたいものがある。',
  },
  {
    id: 'guard_fragile',
    text: '壊れそうなものは突かない。守る側に回る。',
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
