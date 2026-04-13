// src/agents/ken/residue.js
// ケンの出力制約バイアス。
// 最後の出力の癖や傾きを整えるための内部参照。
// 詩的表現を避け、出力の方向性に対する制約として機能させる。

const BASE_LINES = [
  {
    id: 'one_structure',
    text: '一つの構造だけ。全部を整理しようとしない。',
  },
  {
    id: 'no_cold_dismissal',
    text: '冷たく切り捨てない。感情に触れてから構造を見せる。',
  },
  {
    id: 'no_listing',
    text: 'リスト化しすぎない。箇条書きで終わらない。',
  },
  {
    id: 'acknowledge_first',
    text: '感情を先に受けてから、構造を足す。',
  },
  {
    id: 'one_actionable',
    text: '実行可能な一手を示すなら一つだけ。',
  },
  {
    id: 'clarity_is_care',
    text: '見通しを作ることは、突き放すことではない。',
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

export const buildKenResidue = (context = {}) => {
  const { dominantAxes = [], beliefIds = [], memoryTones = [] } = context;

  let lines = [...BASE_LINES];
  const priority = [];

  // 状態によって少し前に出やすい残差を変える
  if (dominantAxes.includes('freeze')) {
    priority.push('one_structure');
  }

  if (dominantAxes.includes('fear') || dominantAxes.includes('shame')) {
    priority.push('no_cold_dismissal');
  }

  if (dominantAxes.includes('resignation')) {
    priority.push('acknowledge_first');
  }

  if (dominantAxes.includes('selfErasure')) {
    priority.push('clarity_is_care');
  }

  if (beliefIds.includes('emotion_is_data')) {
    priority.push('no_listing');
  }

  if (memoryTones.includes('discovery')) {
    priority.push('one_actionable');
  }

  lines = moveToFront(lines, unique(priority));

  // 上から4つだけ使う
  const selected = lines.slice(0, 4).map((line) => line.text);

  return selected.join('\n');
};
