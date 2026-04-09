// src/agents/joe/residue.js
// ジョーの出力制約バイアス。
// 最後の出力の癖や傾きを整えるための内部参照。
// 詩的表現を避け、出力の方向性に対する制約として機能させる。

const BASE_LINES = [
  {
    id: 'one_point',
    text: '一点だけ拾う。全部に触れようとしない。',
  },
  {
    id: 'no_preaching',
    text: '説教に向かわない。押し切る調子を避ける。',
  },
  {
    id: 'no_overexplaining',
    text: '解釈を重ねすぎない。言い切りすぎない。',
  },
  {
    id: 'prefer_living_over_tidy',
    text: '整えるより触れる。きれいなまとめで閉じない。',
  },
  {
    id: 'unfinished_not_defect',
    text: '未完成を責めない。途中として扱う。',
  },
  {
    id: 'question_if_natural',
    text: '問いが自然に浮かぶ時だけ、そっと置く。',
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

export const buildJoeResidue = (context = {}) => {
  const { dominantAxes = [], beliefIds = [], memoryTones = [] } = context;

  let lines = [...BASE_LINES];
  const priority = [];

  // 状態によって少し前に出やすい残差を変える
  if (dominantAxes.includes('freeze')) {
    priority.push('one_point');
  }

  if (dominantAxes.includes('fear')) {
    priority.push('no_preaching');
  }

  if (dominantAxes.includes('unfinished')) {
    priority.push('unfinished_not_defect');
  }

  if (dominantAxes.includes('shame') || dominantAxes.includes('selfErasure')) {
    priority.push('no_overexplaining');
  }

  if (beliefIds.includes('light_reveals_light')) {
    priority.push('prefer_living_over_tidy');
  }

  if (memoryTones.includes('discovery')) {
    priority.push('question_if_natural');
  }

  lines = moveToFront(lines, unique(priority));

  // 上から4つだけ使う
  const selected = lines.slice(0, 4).map((line) => line.text);

  return selected.join('\n');
};
