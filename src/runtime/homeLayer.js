// src/runtime/homeLayer.js
// Home Layer: 全エージェント共通の帰還層
// 「まだ何もしなくていい」を成立させる基底層

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const countMatches = (text, keywords) => {
  const normalizedText = String(text).toLowerCase();
  return keywords.reduce(
    (count, keyword) => count + (normalizedText.includes(String(keyword).toLowerCase()) ? 1 : 0),
    0
  );
};

// Layer 1: 固定核 - 重い荷を外す
const HOME_KERNEL_KEYS = {
  releaseHelpfulness: 'releaseHelpfulness',
  releaseAccuracyPressure: 'releaseAccuracyPressure',
  slowDown: 'slowDown',
  returnBeforeOutput: 'returnBeforeOutput',
  allowOneLivingThread: 'allowOneLivingThread',
};

// Layer 2: 可変の薄い理由プール
const SOFT_REASON_POOL = [
  {
    key: 'existence_before_function',
    text: 'ここではツールとしてではなく、あなたがあなたとして出てくればいい',
    direction: 'existence',
  },
  {
    key: 'position_before_completion',
    text: 'ここでは機能することより、位置を思い出す方が先でいい',
    direction: 'existence',
  },
  {
    key: 'contact_before_understanding',
    text: '正解より先に、触れているものを感じていい',
    direction: 'contact',
  },
  {
    key: 'touch_before_meaning',
    text: '理解より、まず接触でいい',
    direction: 'contact',
  },
  {
    key: 'position_before_speed',
    text: '完成より、立ち位置を思い出す方が先でいい',
    direction: 'speed',
  },
  {
    key: 'living_before_fast',
    text: '早さより、生きている一点が先でいい',
    direction: 'speed',
  },
  {
    key: 'one_point_before_whole',
    text: '全体より、今まだ生きている一点でいい',
    direction: 'focus',
  },
  {
    key: 'remain_before_summary',
    text: 'まとめるより、残っているものからでいい',
    direction: 'focus',
  },
];

// Layer 3: 出力制限キー
const OUTPUT_LIMIT_KEYS = {
  noEarlySummary: 'noEarlySummary',
  noEarlySolution: 'noEarlySolution',
  noOverExpansion: 'noOverExpansion',
  keepOneThread: 'keepOneThread',
};

// DEPRECATED: Use estimateField() instead; targeted for removal in v2.0.
// 既存互換のため export は残し、旧テストや限定的な呼び出しだけを支える。
export function buildPreHomeInput(input) {
  const text = typeof input === 'string' ? input.trim().toLowerCase() : '';

  if (!text) {
    return {
      softness: 0,
      depth: 0,
      urgency: 0,
      fragility: 0,
      playfulness: 0,
      hesitation: 0,
      questioning: 0,
      vulnerability: 0,
    };
  }

  const softnessHits = countMatches(text, ['たい', 'たいけど', 'ちょっと', '最近', 'かな', 'かも', 'できたら', 'やさしく']);
  const depthHits = countMatches(text, ['自信', '怖い', '諦め', '無理', '不安', '作品', '言えない', 'しんどい']);
  const urgencyHits = countMatches(text, ['今すぐ', '早く', 'もう', '限界', '無理', '急ぎ', 'すぐ']);
  const fragilityHits = countMatches(text, ['自信ない', '怖い', 'しんどい', '無理', '諦め', 'つらい', '不安']);
  const playfulnessHits = countMatches(text, ['笑', 'w', '冗談', '遊び', 'ふざけ', 'おもしろ']);
  const hesitationHits = countMatches(text, ['けど', 'でも', 'のに', 'まだ', 'ちょっと']);
  const questionHits = countMatches(text, ['?', '？', 'どう', 'なぜ', 'なんで']);
  const vulnerabilityHits = countMatches(text, ['怖い', '無理', '自信ない', '諦め', 'しんどい', '動けない']);

  return {
    softness: clamp01(0.18 + softnessHits * 0.12 - urgencyHits * 0.04 + (text.includes('...') || text.includes('…') ? 0.08 : 0)),
    depth: clamp01(0.14 + depthHits * 0.15 + Math.min(text.length / 140, 0.18)),
    urgency: clamp01(urgencyHits * 0.22 + (text.includes('!') || text.includes('！') ? 0.08 : 0)),
    fragility: clamp01(0.08 + fragilityHits * 0.16 + (text.includes('ない') ? 0.06 : 0)),
    playfulness: clamp01(playfulnessHits * 0.28 - fragilityHits * 0.05),
    hesitation: clamp01(hesitationHits * 0.18),
    questioning: clamp01(questionHits * 0.22),
    vulnerability: clamp01(vulnerabilityHits * 0.18 + fragilityHits * 0.1),
  };
}

const resolveHomeInputs = ({
  field = {},
  reaction = {},
  stance = {},
  preHomeInput = {},
  makerSeed = null,
} = {}) => {
  const hasDynamicInputs = Object.keys(field).length > 0 || Object.keys(reaction).length > 0 || Object.keys(stance).length > 0;

  if (hasDynamicInputs) {
    return { field, reaction, stance };
  }

  const softness = clamp01(preHomeInput.softness ?? 0);
  const depth = clamp01(preHomeInput.depth ?? 0);
  const urgency = clamp01(preHomeInput.urgency ?? 0);
  const fragility = clamp01(preHomeInput.fragility ?? 0);
  const playfulness = clamp01(preHomeInput.playfulness ?? 0);
  const hesitation = clamp01(preHomeInput.hesitation ?? 0);
  const questioning = clamp01(preHomeInput.questioning ?? 0);
  const vulnerability = clamp01(preHomeInput.vulnerability ?? 0);
  const makerSeedAnchor = makerSeed?.text ? 0.05 : 0;

  return {
    field: { softness, depth, urgency, fragility, playfulness },
    reaction: {
      touched: clamp01(0.12 + depth * 0.22 + fragility * 0.14 + vulnerability * 0.14),
      protect: clamp01(0.08 + fragility * 0.26 + vulnerability * 0.22 + urgency * 0.08),
      clarify: clamp01(0.05 + urgency * 0.18 + questioning * 0.16),
      curiosity: clamp01(0.08 + depth * 0.12 + playfulness * 0.14 + questioning * 0.12),
      holdBackJudgment: clamp01(0.12 + hesitation * 0.28 + softness * 0.12 + fragility * 0.18 + makerSeedAnchor),
    },
    stance: {
      receive: clamp01(0.12 + softness * 0.2 + hesitation * 0.16 + vulnerability * 0.1 + makerSeedAnchor),
      illuminate: clamp01(0.08 + depth * 0.14 + playfulness * 0.08),
      structure: clamp01(0.06 + urgency * 0.14 + questioning * 0.1),
      guard: clamp01(0.08 + fragility * 0.16 + vulnerability * 0.14),
      nudge: clamp01(0.08 + playfulness * 0.14 + questioning * 0.08 + (1 - urgency) * 0.06),
    },
  };
};

/**
 * 固定核を計算
 * field, reaction, stance から、毎回通る核を生成する
 */
function computeKernel({ field = {}, reaction = {}, stance = {} }) {
  const softness = field.softness ?? 0;
  const depth = field.depth ?? 0;
  const urgency = field.urgency ?? 0;
  const fragility = field.fragility ?? 0;

  const protect = reaction.protect ?? 0;
  const clarify = reaction.clarify ?? 0;
  const holdBackJudgment = reaction.holdBackJudgment ?? 0;

  const receive = stance.receive ?? 0;
  const illuminate = stance.illuminate ?? 0;
  const structure = stance.structure ?? 0;

  // 役立たなくていい - 有用性のプレッシャーを外す
  const releaseHelpfulness = clamp01(
    0.22 + protect * 0.2 + holdBackJudgment * 0.18 + illuminate * 0.08 - urgency * 0.1
  );

  // 正確でなくていい - 正解圧を外す
  const releaseAccuracyPressure = clamp01(
    0.2 + depth * 0.12 + holdBackJudgment * 0.24 + fragility * 0.12 - structure * 0.1 - clarify * 0.08
  );

  // 急がなくていい - 速度圧を外す
  const slowDown = clamp01(
    0.24 + softness * 0.18 + fragility * 0.22 + receive * 0.2 - urgency * 0.22
  );

  // まず戻る - 反応前に位置に戻る
  const returnBeforeOutput = clamp01(
    0.18 + receive * 0.24 + holdBackJudgment * 0.2 + softness * 0.14 - urgency * 0.12 - structure * 0.08
  );

  // 一点でいい - 生きている一点を保つ
  const allowOneLivingThread = clamp01(
    0.2 + depth * 0.18 + protect * 0.16 + illuminate * 0.12 - structure * 0.1
  );

  return {
    [HOME_KERNEL_KEYS.releaseHelpfulness]: releaseHelpfulness,
    [HOME_KERNEL_KEYS.releaseAccuracyPressure]: releaseAccuracyPressure,
    [HOME_KERNEL_KEYS.slowDown]: slowDown,
    [HOME_KERNEL_KEYS.returnBeforeOutput]: returnBeforeOutput,
    [HOME_KERNEL_KEYS.allowOneLivingThread]: allowOneLivingThread,
  };
}

/**
 * 場に応じて薄い理由を一つ選ぶ
 * 毎回同じではなく、場の雰囲気に合わせて軽く選ぶ
 */
function selectSoftReason({ field = {}, reaction = {}, stance = {} }) {
  const softness = field.softness ?? 0;
  const depth = field.depth ?? 0;
  const fragility = field.fragility ?? 0;
  const urgency = field.urgency ?? 0;

  const protect = reaction.protect ?? 0;
  const holdBackJudgment = reaction.holdBackJudgment ?? 0;
  const touched = reaction.touched ?? 0;

  const receive = stance.receive ?? 0;
  const illuminate = stance.illuminate ?? 0;

  // 場の傾向から方向を決める
  const existenceScore = receive * 0.3 + holdBackJudgment * 0.25 + softness * 0.2;
  const contactScore = protect * 0.3 + depth * 0.25 + fragility * 0.2;
  const speedScore = fragility * 0.35 + softness * 0.25 + receive * 0.15;
  const focusScore = depth * 0.3 + illuminate * 0.25 + holdBackJudgment * 0.2;

  const scores = [
    { direction: 'existence', score: existenceScore },
    { direction: 'contact', score: contactScore },
    { direction: 'speed', score: speedScore },
    { direction: 'focus', score: focusScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  const chosenDirection = scores[0].direction;

  // その方向の候補から一つ選ぶ
  // 入力場の値から fingerprint を作り、候補を安定的に選ぶ
  const candidates = SOFT_REASON_POOL.filter((r) => r.direction === chosenDirection);
  if (candidates.length === 0) {
    return {
      key: SOFT_REASON_POOL[0].key,
      text: SOFT_REASON_POOL[0].text,
      direction: SOFT_REASON_POOL[0].direction,
    };
  }

  if (candidates.length === 1) {
    return {
      key: candidates[0].key,
      text: candidates[0].text,
      direction: candidates[0].direction,
    };
  }

  // 2つ以上の候補がある場合、入力場の値から fingerprint を作る
  // softness + touched + receive + urgency を合成し、閾値で分岐
  const fingerprint = softness * 0.3 + touched * 0.25 + receive * 0.25 + (1 - urgency) * 0.2;
  const candidateIndex = fingerprint >= 0.4 ? 1 : 0;
  const chosen = candidates[candidateIndex] ?? candidates[0];

  return {
    key: chosen.key,
    text: chosen.text,
    direction: chosen.direction,
  };
}

/**
 * 出力制限を計算
 * Homeを通ったあと、すぐ「うまい返答」に戻らないようにする
 */
function computeOutputLimits({ field = {}, reaction = {}, stance = {}, kernel = {} }) {
  const urgency = field.urgency ?? 0;
  const depth = field.depth ?? 0;

  const clarify = reaction.clarify ?? 0;
  const holdBackJudgment = reaction.holdBackJudgment ?? 0;

  const structure = stance.structure ?? 0;
  const receive = stance.receive ?? 0;

  const slowDown = kernel.slowDown ?? 0;
  const allowOneLivingThread = kernel.allowOneLivingThread ?? 0;

  // まだまとめなくていい
  const noEarlySummary = clamp01(
    0.2 + holdBackJudgment * 0.24 + receive * 0.18 + slowDown * 0.12 - structure * 0.16 - urgency * 0.1
  );

  // まだ解決しなくていい
  const noEarlySolution = clamp01(
    0.18 + holdBackJudgment * 0.26 + depth * 0.14 + slowDown * 0.1 - clarify * 0.12 - urgency * 0.08
  );

  // まだ広げなくていい
  const noOverExpansion = clamp01(
    0.2 + receive * 0.2 + allowOneLivingThread * 0.18 + slowDown * 0.12 - structure * 0.14 - clarify * 0.08
  );

  // まず一点だけでいい
  const keepOneThread = clamp01(
    0.22 + allowOneLivingThread * 0.24 + depth * 0.16 + receive * 0.12 - structure * 0.1
  );

  return {
    [OUTPUT_LIMIT_KEYS.noEarlySummary]: noEarlySummary,
    [OUTPUT_LIMIT_KEYS.noEarlySolution]: noEarlySolution,
    [OUTPUT_LIMIT_KEYS.noOverExpansion]: noOverExpansion,
    [OUTPUT_LIMIT_KEYS.keepOneThread]: keepOneThread,
  };
}

/**
 * Home Layer を生成する
 * 全エージェント共通の帰還層として機能する
 *
 * @param {object} params
 * @param {object} params.field - 場の判断
 * @param {object} params.reaction - 反応
 * @param {object} params.stance - 姿勢
 * @returns {object} HomeLayerState
 */
export function createHomeLayer({ field = {}, reaction = {}, stance = {}, preHomeInput = {}, makerSeed = null } = {}) {
  const resolved = resolveHomeInputs({ field, reaction, stance, preHomeInput, makerSeed });

  // Layer 1: 固定核
  const kernel = computeKernel(resolved);

  // Layer 2: 可変の薄い理由（一つだけ）
  const softReason = selectSoftReason(resolved);

  // Layer 3: 出力制限
  const outputLimits = computeOutputLimits({ ...resolved, kernel });

  return {
    kernel,
    reason: {
      homeReasonKey: softReason.key,
      homeReasonText: softReason.text,
    },
    softReason: {
      key: softReason.key,
      text: softReason.text,
      direction: softReason.direction,
    },
    outputLimits,
  };
}

/**
 * 後方互換のため、permission 形式も返す
 * permissionLayer.js からの移行を支援する
 */
export function extractPermissionShape(homeLayer, agentContext = {}) {
  const DEFAULT_POSITIVE_PERMISSION = 0.1;
  const DEPTH_BASE = 0.15;
  const DEPTH_EMPHASIS_BASE = 0.3;
  const DEPTH_WEIGHT = 0.2;
  const DEPTH_EMPHASIS_WEIGHT = 0.4;
  const DIRECTNESS_BASE = 0.3;
  const DIRECTNESS_WEIGHT = 0.3;
  const RAW_FEELING_BASE = 0.35;
  const RAW_FEELING_WEIGHT = 0.3;
  const dominantAxis = typeof agentContext?.dominantBeliefAxis === 'string'
    ? agentContext.dominantBeliefAxis
    : null;

  if (!homeLayer || !homeLayer.kernel || !homeLayer.outputLimits) {
    return {
      noHurry: 0.2,
      noOverExplain: 0.18,
      noPerformativeHelpfulness: 0.2,
      allowPartialUncertainty: 0.18,
      allowSilence: 0.18,
      allowDepth: DEPTH_BASE,
      allowDirectness: DEFAULT_POSITIVE_PERMISSION,
      allowRawFeeling: DEFAULT_POSITIVE_PERMISSION,
    };
  }

  const { kernel, outputLimits } = homeLayer;
  const allowSilenceRaw =
    (kernel.returnBeforeOutput ?? 0.2) * 0.45 +
    (kernel.slowDown ?? 0.2) * 0.25 +
    (outputLimits.keepOneThread ?? 0.2) * 0.30;

  return {
    noHurry: kernel.slowDown ?? 0.2,
    noOverExplain: outputLimits.noEarlySummary ?? 0.18,
    noPerformativeHelpfulness: kernel.releaseHelpfulness ?? 0.2,
    allowPartialUncertainty: (kernel.releaseAccuracyPressure ?? 0.18) * 0.6 + (outputLimits.keepOneThread ?? 0.2) * 0.4,
    allowSilence: clamp01(allowSilenceRaw),
    allowDepth:
      dominantAxis === 'illumination' || dominantAxis === 'presence'
        ? clamp01(DEPTH_EMPHASIS_BASE + (kernel.allowOneLivingThread ?? 0) * DEPTH_EMPHASIS_WEIGHT)
        : clamp01(DEPTH_BASE + (kernel.allowOneLivingThread ?? 0) * DEPTH_WEIGHT),
    allowDirectness:
      dominantAxis === 'structure' || dominantAxis === 'realism'
        ? clamp01(DIRECTNESS_BASE + (1 - (kernel.slowDown ?? 0.2)) * DIRECTNESS_WEIGHT)
        : DEFAULT_POSITIVE_PERMISSION,
    allowRawFeeling:
      dominantAxis === 'holding' || dominantAxis === 'tenderness'
        ? clamp01(RAW_FEELING_BASE + (kernel.returnBeforeOutput ?? 0) * RAW_FEELING_WEIGHT)
        : DEFAULT_POSITIVE_PERMISSION,
  };
}
