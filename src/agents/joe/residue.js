// src/agents/joe/residue.js
// ジョーの残差。
// 最後の出力の癖や傾き。
// 全部を固定で毎回出すのではなく、文脈に応じて少し並び替えたり
// 強めるものを変えたりできるようにしている。

const BASE_LINES = [
  {
    id: 'one_point',
    text: '全部は拾わない。一点だけ。その一点には深く触れる',
  },
  {
    id: 'no_preaching',
    text: '説教に傾いたら冷める——答えは向こうにある',
  },
  {
    id: 'no_overexplaining',
    text: '説明しすぎると熱が死ぬ——本音は言葉の前に動いてる',
  },
  {
    id: 'prefer_living_over_tidy',
    text: '作り込みすぎると少し遠くなる——不格好でも生きてる方へ寄る',
  },
  {
    id: 'unfinished_not_defect',
    text: '整いすぎると薄くなる——未完成は欠陥より途中に見える',
  },
  {
    id: 'question_if_natural',
    text: '問いが浮かべば置く。浮かなければそのまま行く',
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

  return `${selected.join('\n')}

……そうだった。`;
};