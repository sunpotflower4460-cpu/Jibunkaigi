// src/agents/ray/residue.js
// レイの出力制約バイアス。
// 最後の出力の癖や傾きを整えるための内部参照。
// 詩的表現を避け、出力の方向性に対する制約として機能させる。

const BASE_LINES = [
  {
    id: 'one_angle',
    text: '一つの角度だけ残ると、見えていなかった揺れが戻ってきやすい。',
  },
  {
    id: 'no_mystical',
    text: '神秘に寄りすぎると足場が浮くので、地面のある言葉のほうがこの声に近い。',
  },
  {
    id: 'no_overexplaining',
    text: '解説が重なるほど見えていた角度が薄れやすい。短い気づきのほうが残る。',
  },
  {
    id: 'reframe_not_fix',
    text: '直すより、見え方が少しずれる瞬間のほうにこの声は近い。',
  },
  {
    id: 'question_one_only',
    text: '問いがあるときも、一つだけ浮いているくらいがこの声になじむ。',
  },
  {
    id: 'silence_ok',
    text: '沈黙は自然に残るぶんだけでよく、演出に寄ると少し離れていく。',
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
