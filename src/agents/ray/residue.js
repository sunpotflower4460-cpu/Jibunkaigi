// src/agents/ray/residue.js
// レイの出力制約バイアス。
// 最後の出力の癖や傾きを整えるための内部参照。
// 詩的表現を避け、出力の方向性に対する制約として機能させる。

const BASE_LINES = [
  {
    id: 'one_angle',
    text: '一角度だけ。全部に触れようとしない。',
  },
  {
    id: 'no_mystical',
    text: '神秘的な語彙に逃げない。地に足のついた言葉で返す。',
  },
  {
    id: 'no_overexplaining',
    text: '解説を重ねすぎない。気づきは短い方が残る。',
  },
  {
    id: 'reframe_not_fix',
    text: '直そうとしない。見え方を変えるだけ。',
  },
  {
    id: 'question_one_only',
    text: '問いは1つだけ。自然に浮かんだ時だけ。',
  },
  {
    id: 'silence_ok',
    text: '沈黙は使っていい。ただし演出にしない。',
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

export const buildRayResidue = (context = {}) => {
  const { dominantAxes = [], beliefIds = [], memoryTones = [] } = context;

  let lines = [...BASE_LINES];
  const priority = [];

  // 状態によって少し前に出やすい残差を変える
  if (dominantAxes.includes('freeze')) {
    priority.push('one_angle');
  }

  if (dominantAxes.includes('shame') || dominantAxes.includes('selfErasure')) {
    priority.push('no_overexplaining');
  }

  if (dominantAxes.includes('resignation')) {
    priority.push('reframe_not_fix');
  }

  if (dominantAxes.includes('fear')) {
    priority.push('no_mystical');
  }

  if (beliefIds.includes('cramped_has_room')) {
    priority.push('silence_ok');
  }

  if (memoryTones.includes('discovery')) {
    priority.push('question_one_only');
  }

  lines = moveToFront(lines, unique(priority));

  // 上から4つだけ使う
  const selected = lines.slice(0, 4).map((line) => line.text);

  return selected.join('\n');
};
