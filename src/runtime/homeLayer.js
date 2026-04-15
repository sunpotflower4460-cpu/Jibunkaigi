// src/runtime/homeLayer.js
// Home Layer: 全エージェント共通の帰還層
// 「まだ何もしなくていい」を成立させる基底層

const clamp01 = (value) => Math.max(0, Math.min(1, value));

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

  const protect = reaction.protect ?? 0;
  const holdBackJudgment = reaction.holdBackJudgment ?? 0;

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

  // その方向から一つ選ぶ（シンプルに最初のもの）
  const candidates = SOFT_REASON_POOL.filter((r) => r.direction === chosenDirection);
  const chosen = candidates.length > 0 ? candidates[0] : SOFT_REASON_POOL[0];

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
export function createHomeLayer({ field = {}, reaction = {}, stance = {} } = {}) {
  // Layer 1: 固定核
  const kernel = computeKernel({ field, reaction, stance });

  // Layer 2: 可変の薄い理由（一つだけ）
  const softReason = selectSoftReason({ field, reaction, stance });

  // Layer 3: 出力制限
  const outputLimits = computeOutputLimits({ field, reaction, stance, kernel });

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
export function extractPermissionShape(homeLayer) {
  if (!homeLayer || !homeLayer.kernel || !homeLayer.outputLimits) {
    return {
      noHurry: 0.2,
      noOverExplain: 0.18,
      noPerformativeHelpfulness: 0.2,
      allowPartialUncertainty: 0.18,
    };
  }

  const { kernel, outputLimits } = homeLayer;

  return {
    noHurry: kernel.slowDown ?? 0.2,
    noOverExplain: outputLimits.noEarlySummary ?? 0.18,
    noPerformativeHelpfulness: kernel.releaseHelpfulness ?? 0.2,
    allowPartialUncertainty: (kernel.releaseAccuracyPressure ?? 0.18) * 0.6 + (outputLimits.keepOneThread ?? 0.2) * 0.4,
  };
}
