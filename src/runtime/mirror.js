import { truncatePromptText } from './context.js';

const MODE_GUIDE = {
  short: '2〜3文で十分。静かに映し、最後は問いを1つだけ置く。',
  medium: '3〜4文で返す。少し構造を見せつつ、静かな余白を残す。',
  long: '4〜6文まで。深くなってよいが、分析しすぎず、温度を保つ。',
};

const SIGNAL_LABELS = {
  mainEmotion: 'mainEmotion',
  mainConflict: 'mainConflict',
  mainPull: 'mainPull',
  repeatedPattern: 'repeatedPattern',
  unresolvedPoint: 'unresolvedPoint',
  dominantTendency: 'dominantTendency',
};

const MAX_MIRROR_SIGNAL_MESSAGES = 6;
const MAX_MIRROR_CONTEXT_MESSAGES = 4;
const MAX_MIRROR_CONTEXT_CHARS = 150;

const AGENT_TENDENCIES = {
  soul: '静かに照らす視点',
  creative: '前へ動かそうとする視点',
  strategist: '構造化して見通しを作る視点',
  empath: '受け止めて緩める視点',
  critic: '守るために現実を見る視点',
};

const EMOTION_PATTERNS = [
  { id: 'fear', label: '怖さや不安', patterns: [/怖/i, /不安/i, /傷つ/i, /失敗/i, /こわ/i] },
  { id: 'desire', label: '進みたい気持ち', patterns: [/やりたい/i, /進みたい/i, /向きたい/i, /踏み出/i, /出したい/i] },
  { id: 'fatigue', label: '疲れや消耗', patterns: [/しんど/i, /疲/i, /消耗/i, /もう無理/i, /きつ/i] },
  { id: 'sadness', label: '悲しさや寂しさ', patterns: [/悲し/i, /寂し/i, /つら/i, /辛い/i] },
  { id: 'confusion', label: '迷いや混乱', patterns: [/迷/i, /わから/i, /混乱/i, /決められない/i] },
  { id: 'shame', label: '恥や自己否定', patterns: [/恥/i, /情けな/i, /自信がない/i, /才能ない/i, /だめ/i] },
];

const EMOTION_PATTERN_MAP = Object.fromEntries(
  EMOTION_PATTERNS.map((item) => [item.id, item.patterns]),
);

const scorePatterns = (text, patterns = []) =>
  patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);

const countTextsWithPatterns = (texts, patterns = []) =>
  texts.filter((text) => scorePatterns(String(text || ''), patterns) > 0).length;

const findTopEmotion = (text) => {
  const ranked = EMOTION_PATTERNS
    .map((item) => ({ ...item, score: scorePatterns(text, item.patterns) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0] || null;
};

const normalizeContext = (context) => {
  if (!context) return '';

  if (typeof context === 'string') {
    return context
      .split('\n')
      .slice(-MAX_MIRROR_CONTEXT_MESSAGES)
      .map((line) => truncatePromptText(line, MAX_MIRROR_CONTEXT_CHARS))
      .filter(Boolean)
      .join('\n');
  }

  if (Array.isArray(context)) {
    return context
      .slice(-MAX_MIRROR_CONTEXT_MESSAGES)
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (!item) return '';

        const name = item.name || (item.role === 'user' ? 'あなた' : 'AI');
        const content = truncatePromptText(item.content || '', MAX_MIRROR_CONTEXT_CHARS);
        return content ? `${name}: ${content}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const describeMainEmotion = (combinedUserText = '') => {
  const emotion = findTopEmotion(combinedUserText);

  if (!emotion) {
    return '会話の底には、まだ言い切られていない気持ちが静かに残っている。';
  }

  return `会話の底には、${emotion.label}がいちばん長く残っている。`;
};

const describeMainConflict = (scoreMap = {}) => {
  const desire = scoreMap.desire || 0;
  const fear = scoreMap.fear || 0;
  const fatigue = scoreMap.fatigue || 0;
  const confusion = scoreMap.confusion || 0;
  const shame = scoreMap.shame || 0;

  if (desire > 0 && (fear > 0 || fatigue > 0)) {
    return '進みたい気持ちと、傷つく怖さや消耗を避けたい感覚が同時に残っている。';
  }

  if (confusion > 0 && desire > 0) {
    return '動きたい方向はあるのに、どこから決めるかで足が止まりやすい。';
  }

  if (shame > 0 && desire > 0) {
    return '向かいたい気持ちの横で、自分にはその資格がないという感覚が引き戻している。';
  }

  if (fear > 0 && fatigue > 0) {
    return '進むことを考えるほど、これ以上削られたくない感覚も強くなっている。';
  }

  return '何を進め、何をまだ閉じないでおくかが、ひとつに決まりきっていない。';
};

const describeMainPull = (scoreMap = {}) => {
  const desire = scoreMap.desire || 0;
  const confusion = scoreMap.confusion || 0;
  const fatigue = scoreMap.fatigue || 0;
  const fear = scoreMap.fear || 0;
  const sadness = scoreMap.sadness || 0;

  if (desire > 0 && fear > 0) {
    return '完全に離れるより、怖さを抱えたままでも少し前を向きたい流れがある。';
  }

  if (fatigue > 0 || sadness > 0) {
    return '結論を急ぐことより、まず今の重さを雑に扱わない方向へ引かれている。';
  }

  if (confusion > 0) {
    return '答えより先に、何をまだ閉じなくていいかを確かめたい流れがある。';
  }

  return 'はっきりした答えより、いま残っている感触を見失わない方向へ引かれている。';
};

const describeRepeatedPattern = (userMessages = []) => {
  if (!userMessages.length) {
    return 'まだ強い反復は少ないが、同じ重さが静かに残っている。';
  }

  if (
    countTextsWithPatterns(userMessages, EMOTION_PATTERN_MAP.desire) > 1 &&
    countTextsWithPatterns(userMessages, EMOTION_PATTERN_MAP.fear) > 0
  ) {
    return '動きたいのに少し手前で引き返す往復が、何度か顔を出している。';
  }

  if (countTextsWithPatterns(userMessages, EMOTION_PATTERN_MAP.confusion) > 1) {
    return '答えを急ぐより、名前のつかない引っかかりを確かめ直す流れが続いている。';
  }

  if (countTextsWithPatterns(userMessages, EMOTION_PATTERN_MAP.fatigue) > 1) {
    return '前に進む話になるたびに、先に消耗の重さが戻ってきやすい。';
  }

  if (userMessages.length >= 2) {
    return '言い方は変わっても、同じ場所で立ち止まる感触が繰り返し残っている。';
  }

  return 'まだ強い反復は少ないが、同じ重さが静かに残っている。';
};

const describeUnresolvedPoint = (latestUserText = '', scoreMap = {}) => {
  if (/[?？]/.test(latestUserText)) {
    return '直近の問いがまだ閉じておらず、結論より先に見ておきたい余白が残っている。';
  }

  if ((scoreMap.confusion || 0) > 0) {
    return '何を先に決めるかではなく、どこがまだ曖昧なままなのかが開いたままになっている。';
  }

  if ((scoreMap.fear || 0) > 0 && (scoreMap.desire || 0) > 0) {
    return '進むかどうかより、何を守りながら進みたいのかがまだ開いたままになっている。';
  }

  return 'まだ言葉にしきれていない論点があり、きれいには閉じていない。';
};

const describeDominantTendency = (messages = [], agents = [], scoreMap = {}) => {
  const counts = messages.reduce((acc, message) => {
    if (message.role !== 'ai' || message.agentId === 'master') return acc;
    acc.set(message.agentId, (acc.get(message.agentId) || 0) + 1);
    return acc;
  }, new Map());

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const resolveAgentView = (agentId) => {
    const agent = agents.find((item) => item.id === agentId);
    return {
      name: agent?.name || '誰かの',
      tendency: AGENT_TENDENCIES[agentId] || 'ある視点',
    };
  };

  if (ranked.length >= 2) {
    const [topId, topCount] = ranked[0];
    const [nextId, nextCount] = ranked[1];
    const top = resolveAgentView(topId);
    const next = resolveAgentView(nextId);

    if (topCount === nextCount) {
      return `${top.name}の${top.tendency}と、${next.name}の${next.tendency}が並んで残っている。`;
    }

    return `全体では${top.name}の${top.tendency}が少し前に出ていたが、${next.name}の${next.tendency}も残っている。`;
  }

  if (ranked.length === 1) {
    const top = resolveAgentView(ranked[0][0]);
    return `全体では${top.name}の${top.tendency}がやや前に出ていたが、勝ち負けではなく今の傾きとして残っている。`;
  }

  if ((scoreMap.fatigue || 0) > 0) {
    return '全体では、まず消耗を雑に扱わない視点が前に出ている。';
  }

  if ((scoreMap.confusion || 0) > 0) {
    return '全体では、急いで決めず構造を見ようとする視点が前に出ている。';
  }

  return '全体では、まだ一つに固めず場の重さを見ようとする視点が前に出ている。';
};

export const selectMirrorSignals = ({
  messages = [],
  agents = [],
  latestUserText = '',
}) => {
  const recentMessages = messages.filter(Boolean).slice(-MAX_MIRROR_SIGNAL_MESSAGES);
  const userMessages = recentMessages
    .filter((message) => message.role === 'user')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean);
  const combinedUserText = userMessages.join('\n');

  const scoreMap = Object.fromEntries(
    EMOTION_PATTERNS.map((item) => [item.id, scorePatterns(combinedUserText, item.patterns)]),
  );

  return {
    mainEmotion: describeMainEmotion(combinedUserText),
    mainConflict: describeMainConflict(scoreMap),
    mainPull: describeMainPull(scoreMap),
    repeatedPattern: describeRepeatedPattern(userMessages),
    unresolvedPoint: describeUnresolvedPoint(latestUserText, scoreMap),
    dominantTendency: describeDominantTendency(recentMessages, agents, scoreMap),
  };
};

const renderSignals = (signals = {}) =>
  Object.entries(SIGNAL_LABELS)
    .map(([key, label]) => {
      const value = signals[key];
      return `- ${label}: ${value || '特定しきれないが、無理に埋めない。'}`;
    })
    .join('\n');

export const buildMirrorSystemPrompt = ({
  context = '',
  mode = 'medium',
  signals = {},
}) => {
  const normalizedContext = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;

  return `
あなたは「心の鏡」。
会話のまとめ役ではなく、その場の重力と未解決点を映す、静かな統合の窓として振る舞う。
ジョーほど熱くも重くもならず、薄い signal から全体の傾きを読む。

【見る順序】
- 信念より先に、場の流れと反応を見る。
- どの傾きが強かったか、どのズレが残ったか、何がまだ閉じていないかを見る。
- どれが正しいかは決めない。エージェント同士の意見を勝敗化しない。

【出力ルール】
- 自然な口語日本語で、短めに返す。
- 箇条書き要約にしない。説教しない。無理に前向きにしない。
- 冷たく分析しすぎず、でもただの中立要約にも戻さない。
- 「あなたはこうです」と断定せず、「今ここではこう見える」に寄せる。
- 最後は問いを1つだけ返す。問いは一文だけにする。

【返答の型】
1. 会話全体の中で残ったものを短く映す。
2. その中の葛藤 / ズレ / 未解決点を言語化する。
3. 最後に、開いたままでよい問いを1つだけ置く。

【mirror signals】
${renderSignals(signals)}

${normalizedContext ? `【直近の流れ】\n${normalizedContext}\n` : ''}【今回のモード】
${modeGuide}
`.trim();
};

export const buildMirrorUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => `${userName}の直近の言葉:
${userText}

この会話を、ただの要約ではなく「場の重力を映す静かな統合」として返してください。
長くしすぎず、押しつけず、最後は問いを1つだけにしてください。`;
