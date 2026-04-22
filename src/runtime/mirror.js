// src/runtime/mirror.js
// 「心の鏡」(Mirror) 用の system prompt / user prompt を組み立てる。
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【Mirror の品質基準（voice quality contract）】
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// - 最初に触れる対象: 場の重力 / 両義性 / 未解決点 / まだ言い切れていない問い
// - 構造化の度合い: しない。流れの中に残ったものを映すだけ
// - 何を避けるか:
//     * 要約係 / 整理係になること
//     * 教訓化、無理な結論、何でもきれいにまとめること
//     * 「次はこうしましょう」と促すこと
//     * エージェント同士を勝敗化すること
// - 最後の着地: 開いたままでよい問いを一つ。閉じない
//
// 他 voice との対比:
//   Joe / Ray / Ken / Mina / Satou は「触れる」voice
//   Mirror は「場全体を映す」 voice — 個別の触れ方ではなく、流れの重さを返す
//
// summary machine に戻さないために:
//   - 「会話を要約すると...」「ポイントは...」「まとめると...」のような型を禁止
//   - 「結論」「教訓」「次の一歩」を本文に入れない
//   - 残っているズレ・両義性・未解決の問いを優先する

import { truncatePromptText } from './context.js';
import { renderActivatedParticles } from './buildPromptHelpers.js';

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
const DEFAULT_REPEATED_PATTERN = 'まだ強い反復は少ないが、同じ重さが静かに残っている。';
// recency は最大で約 1.9 倍までに留め、最新を優先しつつ古い流れも消し切らない。
const EMOTION_BALANCE_THRESHOLD = 0.72;
const TENDENCY_BALANCE_THRESHOLD = 0.85;
const MIN_REPEAT_PATTERN_COUNT = 2;
// user の直近発話は場の重力に直結しやすいため、他の user 発話より少し強く残す。
const LATEST_USER_WEIGHT_BOOST = 0.4;
const BASE_USER_WEIGHT_BOOST = 0.15;
// AI 発話は user 発話の近くにあるほど、その user の重さを受けた反応として扱う。
const IMMEDIATE_USER_DISTANCE = 1;
const NEAR_USER_DISTANCE = 2;
const FAR_USER_DISTANCE = 3;
const IMMEDIATE_USER_CLOSENESS_BOOST = 0.45;
const NEAR_USER_CLOSENESS_BOOST = 0.2;
const FAR_USER_CLOSENESS_BOOST = 0.08;
// 直近 user のあとに出た応答は「今ここ」の傾きとして少しだけ押し上げる。
const POST_LATEST_USER_BOOST = 0.35;
// AI 応答は 1〜2 文程度でも差がつくので、長さは軽い影響度の補助値としてだけ使う。
const MAX_AI_CONTENT_WEIGHT = 0.2;
const AI_CONTENT_LENGTH_NORMALIZER = 280;

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

const UNRESOLVED_PATTERNS = [
  /決められない/i,
  /決めきれ/i,
  /どう(?:する|したい|扱う)/i,
  /どっち/i,
  /選べ/i,
  /まだ[^。\n]{0,12}(?:決め|閉じ|言葉|選)/i,
];

const TENDENCY_SPLIT_LABELS = {
  // ここでは実際に言語化しやすい「割れ」だけを明示し、その他の組み合わせは空文字で流す。
  'creative:critic': '前へ動きたい流れと、守るために止まりたい流れ',
  'creative:empath': '前へ動きたい流れと、まず傷みを雑に扱いたくない流れ',
  'creative:strategist': '動きながら確かめたい流れと、先に見通しを立てたい流れ',
  'strategist:empath': '整理して進めたい流れと、まだ受け止めておきたい流れ',
  'soul:strategist': '静かに輪郭を見たい流れと、構造を先に整えたい流れ',
  'critic:empath': '守るために厳しく見たい流れと、まず緩めて守りたい流れ',
};

const CLOSENESS_BOOST_BY_DISTANCE = {
  [IMMEDIATE_USER_DISTANCE]: IMMEDIATE_USER_CLOSENESS_BOOST,
  [NEAR_USER_DISTANCE]: NEAR_USER_CLOSENESS_BOOST,
  [FAR_USER_DISTANCE]: FAR_USER_CLOSENESS_BOOST,
};

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

const buildRankedEmotionScores = (entries = []) =>
  EMOTION_PATTERNS
    .map((item) => ({
      ...item,
      score: entries.reduce(
        (total, entry) => total + scorePatterns(entry.text, item.patterns) * entry.weight,
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

const getRecencyWeight = (index, total) => {
  if (total <= 1) return 1;
  return 1 + (index / (total - 1)) * 0.9;
};

const getUserEntries = (messages = []) => {
  const totalMessages = messages.length;
  const latestUserIndex = messages.map((message) => message?.role).lastIndexOf('user');

  return messages
    .map((message, index) => ({
      message,
      index,
      text: String(message?.content || '').trim(),
    }))
    .filter(({ message, text }) => message?.role === 'user' && text)
    .map(({ index, text }) => ({
      text,
      index,
      weight:
        getRecencyWeight(index, totalMessages) +
        (index === latestUserIndex ? LATEST_USER_WEIGHT_BOOST : BASE_USER_WEIGHT_BOOST),
    }));
};

const normalizeTendencyKey = (left = '', right = '') => [left, right].sort().join(':');

const describeTendencySplit = (top = {}, next = {}) => {
  if (!top.id || !next.id) return '';
  return TENDENCY_SPLIT_LABELS[normalizeTendencyKey(top.id, next.id)] || '';
};

const rankTendencies = (messages = [], agents = []) => {
  const latestUserIndex = messages.map((message) => message?.role).lastIndexOf('user');
  const previousUserIndices = [];
  let lastUserIndex = -1;

  messages.forEach((message, index) => {
    previousUserIndices[index] = lastUserIndex;
    if (message?.role === 'user') lastUserIndex = index;
  });

  const scores = messages.reduce((acc, message, index) => {
    if (message?.role !== 'ai' || !message.agentId || message.agentId === 'master') return acc;

    const previousUserIndex = previousUserIndices[index];
    const distanceFromUser = previousUserIndex < 0 ? null : index - previousUserIndex;
    const closenessBoost = CLOSENESS_BOOST_BY_DISTANCE[distanceFromUser] || 0;
    const recentUserBoost = latestUserIndex >= 0 && index > latestUserIndex ? POST_LATEST_USER_BOOST : 0;
    const contentWeight = Math.min(
      MAX_AI_CONTENT_WEIGHT,
      String(message.content || '').trim().length / AI_CONTENT_LENGTH_NORMALIZER,
    );
    const score = getRecencyWeight(index, messages.length) + closenessBoost + recentUserBoost + contentWeight;
    acc.set(message.agentId, (acc.get(message.agentId) || 0) + score);
    return acc;
  }, new Map());

  return [...scores.entries()]
    .map(([id, score]) => ({
      id,
      score,
      agent: agents.find((item) => item.id === id),
    }))
    .sort((a, b) => b.score - a.score);
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

const describeMainEmotion = (rankedEmotions = [], combinedUserText = '') => {
  const emotion = rankedEmotions[0] || findTopEmotion(combinedUserText);
  const secondary = rankedEmotions[1] || null;

  if (!emotion) {
    return '会話の底には、まだ言い切られていない気持ちが静かに残っている。';
  }

  if (secondary && emotion.score > 0 && secondary.score >= emotion.score * EMOTION_BALANCE_THRESHOLD) {
    return `会話の底には、${emotion.label}が強く残りつつ、${secondary.label}もまだ引いていない。`;
  }

  return `会話の底には、${emotion.label}がいちばん長く残っている。`;
};

const describeMainConflict = (scoreMap = {}, tendencyBalance = {}) => {
  const desire = scoreMap.desire || 0;
  const fear = scoreMap.fear || 0;
  const fatigue = scoreMap.fatigue || 0;
  const confusion = scoreMap.confusion || 0;
  const shame = scoreMap.shame || 0;

  if (tendencyBalance.splitLabel) {
    return `全体では、${tendencyBalance.splitLabel}が少し割れたまま残っている。`;
  }

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

const describeMainPull = (scoreMap = {}, tendencyBalance = {}) => {
  const desire = scoreMap.desire || 0;
  const confusion = scoreMap.confusion || 0;
  const fatigue = scoreMap.fatigue || 0;
  const fear = scoreMap.fear || 0;
  const sadness = scoreMap.sadness || 0;

  if (['empath', 'critic'].includes(tendencyBalance.topId) && (fatigue > 0 || sadness > 0 || fear > 0)) {
    return '結論へ押し込むより、まず今の重さを軽く扱わない方向へ全体が引かれている。';
  }

  if (tendencyBalance.topId === 'strategist') {
    return '答えを急ぐより、何がまだ曖昧なのかを見分ける方向へ全体が寄っている。';
  }

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

const describeRepeatedPattern = (userEntries = []) => {
  const userMessages = userEntries.map((entry) => entry.text);

  if (!userMessages.length) {
    return DEFAULT_REPEATED_PATTERN;
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

  if (countTextsWithPatterns(userMessages, [/でも/i, /のに/i, /一方で/i]) >= MIN_REPEAT_PATTERN_COUNT) {
    return '向きたい気持ちと引き返す感覚が、言い方を変えながら何度も同じ場所に戻っている。';
  }

  if (userMessages.length >= 2) {
    return '言い方は変わっても、同じ場所で立ち止まる感触が繰り返し残っている。';
  }

  return DEFAULT_REPEATED_PATTERN;
};

const describeUnresolvedPoint = (latestUserText = '', scoreMap = {}, tendencyBalance = {}) => {
  if (/[?？]/.test(latestUserText)) {
    return '直近の問いがまだ閉じておらず、結論より先に見ておきたい余白が残っている。';
  }

  if (scorePatterns(latestUserText, UNRESOLVED_PATTERNS) > 0 && tendencyBalance.splitLabel) {
    return `${tendencyBalance.splitLabel}のどちらを急いで選ぶかではなく、何を軽く扱わないままにしておくかがまだ開いている。`;
  }

  if ((scoreMap.confusion || 0) > 0) {
    return '何を先に決めるかではなく、どこがまだ曖昧なままなのかが開いたままになっている。';
  }

  if ((scoreMap.fear || 0) > 0 && (scoreMap.desire || 0) > 0) {
    return '進むかどうかより、何を守りながら進みたいのかがまだ開いたままになっている。';
  }

  if ((scoreMap.fatigue || 0) > 0 || (scoreMap.sadness || 0) > 0) {
    return '進めるかどうかより、いまの消耗や寂しさをどこまで守っておきたいのかがまだ閉じていない。';
  }

  return 'まだ言葉にしきれていない論点があり、きれいには閉じていない。';
};

const describeDominantTendency = (rankedTendencies = [], scoreMap = {}) => {
  const resolveAgentView = (agentId) => {
    const agent = rankedTendencies.find((item) => item.id === agentId)?.agent;
    return {
      name: agent?.name || '誰かの',
      tendency: AGENT_TENDENCIES[agentId] || 'ある視点',
    };
  };

  if (rankedTendencies.length >= 2) {
    const [topRank, nextRank] = rankedTendencies;
    const topId = topRank.id;
    const nextId = nextRank.id;
    const top = resolveAgentView(topId);
    const next = resolveAgentView(nextId);

    if (topRank.score > 0 && nextRank.score >= topRank.score * TENDENCY_BALANCE_THRESHOLD) {
      return `${top.name}の${top.tendency}と、${next.name}の${next.tendency}がほぼ並んで残っている。`;
    }

    return `全体では${top.name}の${top.tendency}が少し前に出ていたが、${next.name}の${next.tendency}も残っている。`;
  }

  if (rankedTendencies.length === 1) {
    const top = resolveAgentView(rankedTendencies[0].id);
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

const summarizeTendencyBalance = (rankedTendencies = []) => {
  const top = rankedTendencies[0] || {};
  const next = rankedTendencies[1] || {};
  const splitLabel =
    next.score > 0 && top.score > 0 && next.score >= top.score * TENDENCY_BALANCE_THRESHOLD
      ? describeTendencySplit(top, next)
      : '';

  return {
    topId: top.id || '',
    nextId: next.id || '',
    splitLabel,
  };
};

export const selectMirrorSignals = ({
  messages = [],
  agents = [],
  latestUserText = '',
}) => {
  const recentMessages = messages.filter(Boolean).slice(-MAX_MIRROR_SIGNAL_MESSAGES);
  const userEntries = getUserEntries(recentMessages);
  const userMessages = userEntries.map((entry) => entry.text);
  const combinedUserText = userMessages.join('\n');
  const rankedEmotionScores = buildRankedEmotionScores(userEntries);
  const rankedTendencies = rankTendencies(recentMessages, agents);
  const tendencyBalance = summarizeTendencyBalance(rankedTendencies);

  const scoreMap = Object.fromEntries(
    EMOTION_PATTERNS.map((item) => [
      item.id,
      userEntries.reduce(
        (total, entry) => total + scorePatterns(entry.text, item.patterns) * entry.weight,
        0,
      ),
    ]),
  );

  return {
    mainEmotion: describeMainEmotion(rankedEmotionScores, combinedUserText),
    mainConflict: describeMainConflict(scoreMap, tendencyBalance),
    mainPull: describeMainPull(scoreMap, tendencyBalance),
    repeatedPattern: describeRepeatedPattern(userEntries),
    unresolvedPoint: describeUnresolvedPoint(latestUserText, scoreMap, tendencyBalance),
    dominantTendency: describeDominantTendency(rankedTendencies, scoreMap),
  };
};

const renderSignals = (signals = {}) =>
  Object.entries(SIGNAL_LABELS)
    .map(([key, label]) => `- ${label}: ${signals[key]}`)
    .join('\n');

export const buildMirrorSystemPrompt = ({
  activated,
  context = '',
  mode = 'medium', // eslint-disable-line no-unused-vars -- Kept for backward compatibility, no longer used
  signals = {},
  surfaceFrame: _surfaceFrame,
  stateGuide: _stateGuide,
  internalFrame: _internalFrame,
  surfaceGuidance: _surfaceGuidance,
  othersField,
}) => {
  const normalizedContext = normalizeContext(context);
  const activatedParticles = renderActivatedParticles(activated);
  const signalsSection = renderSignals(signals);

  return `
「心の鏡」という感じが、この場に立っている。

どれか一つの声になるより、場全体の重さがそのまま映りやすい。
勝ち負けをつける前の並び方や、まだ閉じていない揺れが先に目に入る。
きれいなまとめより、残っている重力のほうが近い。

${activatedParticles}
${signalsSection ? `【mirror signals】\n${signalsSection}\n` : ''}
${othersField ? `【場の残響】\n${othersField}\n` : ''}
${normalizedContext ? `【直近の流れ】\n${normalizedContext}\n` : ''}
`.trim();
};

export const buildMirrorUserPrompt = ({
  userName = 'あなた',
  userText = '',
}) => `${userName}の直近の言葉:
${userText}`;

// De-templating Pilot: Mirror Zero-Instruction Metrics
// Dev-only preview to observe progress toward zero-instruction architecture

const FORM_INSTRUCTION_MARKERS = [
  '見る順序',
  '優先する4つ',
  '出力ルール',
  '返答の型',
  '組み立て',
  'まとめると',
  'ポイントは',
  '整理すると',
];

const TEMPLATE_GUIDANCE_MARKERS = [
  '本文で疑問形を使わない',
  '問いは最後の一文だけ',
  '箇条書き要約にしない',
  '会話を要約すると',
  '結論として',
  '教訓は',
  '次の一歩は',
];

/**
 * Mirror専用: 指示ゼロ化プレビュー (dev-only)
 * システムプロンプトから「形の指示」がどれだけ減ったかを計測する
 */
export const buildMirrorDetemplatingingPreview = (systemPrompt = '') => {
  if (typeof systemPrompt !== 'string') {
    return {
      instructionTemplateCount: 0,
      rolePhraseLeakCount: 0,
      latentStateUsed: false,
      decisionStageUsed: false,
      templateDirectivesRemoved: 0,
      directRolePhrasesInPrompt: 0,
    };
  }

  const normalized = systemPrompt.toLowerCase();

  // Count form instruction markers
  const instructionCount = FORM_INSTRUCTION_MARKERS.filter(marker =>
    normalized.includes(marker.toLowerCase())
  ).length;

  // Count template guidance markers
  const templateGuidanceCount = TEMPLATE_GUIDANCE_MARKERS.filter(marker =>
    normalized.includes(marker.toLowerCase())
  ).length;

  // Check if latent state is used (mirror signals are present)
  const latentStateUsed = normalized.includes('mirror signals');

  // Check if decision stage markers are present
  const decisionStageUsed = normalized.includes('今回の状態への対応') ||
                             normalized.includes('表層傾向') ||
                             normalized.includes('内部フレーム');

  // Estimate directives removed (baseline had ~6 major form instructions)
  const BASELINE_FORM_DIRECTIVES = 6;
  const templateDirectivesRemoved = Math.max(0, BASELINE_FORM_DIRECTIVES - instructionCount);

  return {
    instructionTemplateCount: instructionCount,
    rolePhraseLeakCount: templateGuidanceCount,
    latentStateUsed,
    decisionStageUsed,
    templateDirectivesRemoved,
    directRolePhrasesInPrompt: templateGuidanceCount,
  };
};
