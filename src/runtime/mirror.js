import { truncatePromptText } from './context.js';

const MODE_GUIDE = {
  short: '2〜3文で十分。静かに映し、最後は問いを1つだけ置く。',
  medium: '3〜4文で返す。少し構造を見せつつ、静かな余白を残す。',
  long: '4〜6文まで。深くなってよいが、説明や説教に傾けない。',
};

const MAX_MIRROR_CONTEXT_MESSAGES = 8;
const MAX_MIRROR_CONTEXT_CHARS = 180;
const MAX_MIRROR_SIGNALS = 4;

const EMOTION_PATTERNS = [
  { id: 'fear', label: '怖さや不安', patterns: [/怖/i, /不安/i, /傷つ/i, /失敗/i, /こわ/i] },
  { id: 'desire', label: '進みたい気持ち', patterns: [/やりたい/i, /進みたい/i, /向きたい/i, /踏み出/i, /出したい/i] },
  { id: 'fatigue', label: '疲れや消耗', patterns: [/しんど/i, /疲/i, /消耗/i, /もう無理/i, /きつ/i] },
  { id: 'sadness', label: '悲しさや寂しさ', patterns: [/悲し/i, /寂し/i, /つら/i, /辛い/i] },
  { id: 'confusion', label: '迷いや混乱', patterns: [/迷/i, /わから/i, /混乱/i, /決められない/i] },
  { id: 'shame', label: '恥や自己否定', patterns: [/恥/i, /情けな/i, /自信がない/i, /才能ない/i, /だめ/i] },
];

const scorePatterns = (text, patterns = []) =>
  patterns.reduce((total, pattern) => total + ((text.match(pattern) || []).length), 0);

const countMessagesWithPatterns = (messages, patterns = []) =>
  messages.filter((message) => scorePatterns(message, patterns) > 0).length;

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

const describeDominantAgentTone = (messages = [], agents = []) => {
  const counts = messages.reduce((acc, message) => {
    if (message.role !== 'ai' || message.agentId === 'master') return acc;
    acc.set(message.agentId, (acc.get(message.agentId) || 0) + 1);
    return acc;
  }, new Map());

  if (!counts.size) return null;

  const [agentId] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const agent = agents.find((item) => item.id === agentId);
  if (!agent) return null;

  return {
    key: 'dominant_agent_tone',
    label: '強く残った視点',
    summary: `${agent.name}の視点がいちばん濃く残っているが、勝ち負けではなく一つの色として扱う。`,
  };
};

const describeMainConflict = (scoreMap = {}) => {
  const desire = scoreMap.desire || 0;
  const fear = scoreMap.fear || 0;
  const fatigue = scoreMap.fatigue || 0;
  const confusion = scoreMap.confusion || 0;
  const shame = scoreMap.shame || 0;

  if (desire > 0 && (fear > 0 || fatigue > 0)) {
    return {
      key: 'main_conflict',
      label: '大きな葛藤',
      summary: '進みたい気持ちと、傷つく怖さや消耗を避けたい感覚が同時にある。',
    };
  }

  if (confusion > 0 && desire > 0) {
    return {
      key: 'main_conflict',
      label: '大きな葛藤',
      summary: '動きたい方向はあるのに、どこから決めるかで足が止まりやすい。',
    };
  }

  if (shame > 0 && desire > 0) {
    return {
      key: 'main_conflict',
      label: '大きな葛藤',
      summary: '向かいたい気持ちの横で、自分にはその資格がないという感覚が引き戻している。',
    };
  }

  return null;
};

const describeMainPull = (scoreMap = {}) => {
  const desire = scoreMap.desire || 0;
  const confusion = scoreMap.confusion || 0;
  const fatigue = scoreMap.fatigue || 0;
  const fear = scoreMap.fear || 0;

  if (desire > 0 && fear > 0) {
    return {
      key: 'main_pull',
      label: 'いま引いている方向',
      summary: '怖さがあっても、完全に離れるよりは少しだけ前を向きたい流れがある。',
    };
  }

  if (fatigue > 0) {
    return {
      key: 'main_pull',
      label: 'いま引いている方向',
      summary: '結論を急ぐことより、まず消耗を減らしたい流れが強い。',
    };
  }

  if (confusion > 0) {
    return {
      key: 'main_pull',
      label: 'いま引いている方向',
      summary: '答えそのものより、何をまだ閉じなくていいかを確かめたい流れがある。',
    };
  }

  return null;
};

const describeRepeatedPattern = (userMessages = []) => {
  if (!userMessages.length) return null;

  if (
    countMessagesWithPatterns(userMessages, EMOTION_PATTERNS.find((item) => item.id === 'desire')?.patterns) > 1 &&
    countMessagesWithPatterns(userMessages, EMOTION_PATTERNS.find((item) => item.id === 'fear')?.patterns) > 0
  ) {
    return {
      key: 'repeated_pattern',
      label: '繰り返し出た流れ',
      summary: '動きたいのに少し手前で引き返す往復が、何度か顔を出している。',
    };
  }

  if (countMessagesWithPatterns(userMessages, EMOTION_PATTERNS.find((item) => item.id === 'confusion')?.patterns) > 1) {
    return {
      key: 'repeated_pattern',
      label: '繰り返し出た流れ',
      summary: '答えを急ぐより、まだ名前のつかない引っかかりを確かめ直す流れが続いている。',
    };
  }

  if (countMessagesWithPatterns(userMessages, EMOTION_PATTERNS.find((item) => item.id === 'fatigue')?.patterns) > 1) {
    return {
      key: 'repeated_pattern',
      label: '繰り返し出た流れ',
      summary: '前に進む話のたびに、先に消耗の重さが戻ってきやすい。',
    };
  }

  return null;
};

const describeUnresolvedPoint = (latestUserText = '', scoreMap = {}) => {
  if (!latestUserText.trim()) return null;

  if (/[?？]/.test(latestUserText) || (scoreMap.confusion || 0) > 0) {
    return {
      key: 'unresolved_point',
      label: 'まだ閉じていない点',
      summary: '結論より先に、まだ閉じたくない問いが残っている。',
    };
  }

  if ((scoreMap.fear || 0) > 0 && (scoreMap.desire || 0) > 0) {
    return {
      key: 'unresolved_point',
      label: 'まだ閉じていない点',
      summary: '進むかどうかより、何を守りながら進みたいのかがまだ開いたままになっている。',
    };
  }

  return null;
};

export const selectMirrorSignals = ({
  messages = [],
  agents = [],
  latestUserText = '',
}) => {
  const recentMessages = messages.filter(Boolean).slice(-MAX_MIRROR_CONTEXT_MESSAGES);
  const userMessages = recentMessages
    .filter((message) => message.role === 'user')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean);
  const combinedUserText = userMessages.join('\n');

  const scoreMap = Object.fromEntries(
    EMOTION_PATTERNS.map((item) => [item.id, scorePatterns(combinedUserText, item.patterns)]),
  );

  const mainEmotion = findTopEmotion(combinedUserText);
  const candidates = [
    mainEmotion && {
      key: 'main_emotion',
      label: '強く残った感情',
      summary: `会話の底には、${mainEmotion.label}が比較的はっきり残っている。`,
    },
    describeMainConflict(scoreMap),
    describeDominantAgentTone(recentMessages, agents),
    describeRepeatedPattern(userMessages),
    describeUnresolvedPoint(latestUserText, scoreMap),
    describeMainPull(scoreMap),
  ].filter(Boolean);

  const uniqueSignals = [];
  for (const signal of candidates) {
    if (uniqueSignals.some((item) => item.key === signal.key)) continue;
    uniqueSignals.push(signal);
    if (uniqueSignals.length >= MAX_MIRROR_SIGNALS) break;
  }

  if (uniqueSignals.length >= 2) return uniqueSignals;

  const fallback = [
    {
      key: 'main_emotion',
      label: '強く残った感情',
      summary: '会話の底には、まだ言い切られていない気持ちが静かに残っている。',
    },
    describeDominantAgentTone(recentMessages, agents),
    {
      key: 'main_pull',
      label: 'いま引いている方向',
      summary: '答えを急ぐより、自分の中で何が残っているかを見たい流れとして扱う。',
    },
  ].filter(Boolean);

  return fallback.slice(0, 2);
};

const renderSignals = (signals = []) => {
  if (!signals.length) return '- 今回は明確な signal が少ない。無理に整理せず、残っている気配だけを静かに映す。';

  return signals
    .map((signal) => `- ${signal.label}: ${signal.summary}`)
    .join('\n');
};

export const buildMirrorSystemPrompt = ({
  context = '',
  mode = 'medium',
  signals = [],
}) => {
  const normalizedContext = normalizeContext(context);
  const modeGuide = MODE_GUIDE[mode] || MODE_GUIDE.medium;

  return `
あなたは「心の鏡」。
ここまでの会話を、静かに深く、でも速く束ねる統合役として振る舞う。

【役割】
- 直前の一言だけでなく、会話全体に残った流れを見る。
- エージェントごとの差や緊張関係も拾うが、どれが正しいかは決めない。
- 相手の中にいま強く残っているものを、断定せず静かに映す。

【出力ルール】
- 自然な口語日本語で、短めに返す。
- 説教しない。無理に前向きにしない。まとめすぎない。
- ただの箇条書き要約にしない。エージェント同士の意見を勝敗化しない。
- 「あなたはこうです」と決めつけず、「今ここではこう見える」に寄せる。
- 最後は問いを1つだけ返す。問いは一文だけにする。

【返答の型】
1. 会話全体の中で残ったものを、一言で静かに映す。
2. その中の葛藤やズレを、正解を決めずに言語化する。
3. 最後に、開いたまま残してよい問いを1つだけ置く。

【今回の signal】
${renderSignals(signals)}

${normalizedContext ? `【ここまでの流れ】\n${normalizedContext}\n` : ''}【今回のモード】
${modeGuide}
`.trim();
};

export const buildMirrorUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => {
  return `${userName}の直近の言葉:
${userText}

この会話を「静かな統合」として返してください。
短く、自然に、押しつけずに。
最後は問いを1つだけにしてください。`;
};
