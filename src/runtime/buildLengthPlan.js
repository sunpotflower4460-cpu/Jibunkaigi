/**
 * buildLengthPlan.js
 * 顕在層 v0.1 Phase 7: Build length plan minimal implementation
 *
 * PURPOSE:
 * - NOT token count specification
 * - NOT rigid output length control
 * - Determine "how much do I want to say" as part of internal state
 * - Respect user's length preference while applying natural bias
 *
 * IMPORTANT PRINCIPLES:
 * 1. lengthPlan は token 指示ではなく、話したさの量である
 * 2. user selected length を尊重しつつ、自然な内的状態で補正する
 * 3. oneThreadBias や holdBack により自然に調整される
 * 4. 「medium なのに短すぎる」を減らす方向
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Get base length parameters for user selected length
 *
 * @param {string} target - 'short' | 'medium' | 'long'
 * @returns {object} { lineCountHint, expansionBudget, compressionPressure }
 */
const getBaseLengthParams = (target) => {
  switch (target) {
    case 'short':
      return {
        lineCountHint: 2,
        expansionBudget: 0.25,
        compressionPressure: 0.75,
      };
    case 'long':
      return {
        lineCountHint: 7,
        expansionBudget: 0.65,
        compressionPressure: 0.25,
      };
    case 'medium':
    default:
      return {
        lineCountHint: 4,
        expansionBudget: 0.45,
        compressionPressure: 0.50,
      };
  }
};

/**
 * Apply bias adjustments to length parameters
 *
 * @param {object} baseParams - Base length parameters
 * @param {object} context - Adjustment context
 * @returns {object} Adjusted length parameters
 */
const applyLengthAdjustments = (baseParams, context) => {
  const {
    oneThreadBias = 0,
    antiOverExpansion = 0,
    selectedClusterCount = 0,
    holdBack = [],
  } = context;

  let { lineCountHint, expansionBudget, compressionPressure } = baseParams;

  // oneThreadBias が高い → lineCount を少し下げる
  if (oneThreadBias > 0.5) {
    lineCountHint = Math.max(1, Math.round(lineCountHint * 0.85));
  } else if (oneThreadBias > 0.3) {
    lineCountHint = Math.max(1, Math.round(lineCountHint * 0.92));
  }

  // selected cluster が2個ある → lineCount を少し上げる
  if (selectedClusterCount >= 2) {
    lineCountHint = Math.round(lineCountHint * 1.15);
  }

  // holdBack に no-over-expansion がある → expansionBudget を下げる
  const hasNoOverExpansion = holdBack.includes('no-over-expansion') || antiOverExpansion > 0.5;
  if (hasNoOverExpansion) {
    expansionBudget = clamp01(expansionBudget * 0.80);
  }

  // holdBack に do-not-close がある → compressionPressure を少し下げる
  const hasDoNotClose = holdBack.includes('do-not-close');
  if (hasDoNotClose) {
    compressionPressure = clamp01(compressionPressure * 0.85);
  }

  // Ensure reasonable bounds
  lineCountHint = Math.max(1, Math.min(9, lineCountHint));
  expansionBudget = clamp01(expansionBudget);
  compressionPressure = clamp01(compressionPressure);

  return {
    lineCountHint,
    expansionBudget,
    compressionPressure,
  };
};

/**
 * Build length plan from conscious intent and context
 *
 * Input shape:
 * {
 *   userSelectedLength?: 'short' | 'medium' | 'long',
 *   consciousIntent: ConsciousIntent | null,
 *   selectedThoughts: { selected: [...] } | null,
 *   preconditionBias: { focus: {...}, pacing: {...} } | null,
 * }
 *
 * Output shape:
 * {
 *   target: 'short' | 'medium' | 'long',
 *   lineCountHint: number,
 *   expansionBudget: number,
 *   compressionPressure: number,
 * }
 *
 * @param {object} input - BuildLengthPlanInput
 * @returns {object} LengthPlan
 */
export const buildLengthPlan = (input = {}) => {
  // Null safety
  if (!input || typeof input !== 'object') {
    return {
      target: 'medium',
      lineCountHint: 4,
      expansionBudget: 0.45,
      compressionPressure: 0.50,
    };
  }

  const {
    userSelectedLength = 'medium',
    consciousIntent = null,
    selectedThoughts = null,
    preconditionBias = null,
  } = input;

  // Normalize target
  const validTargets = ['short', 'medium', 'long'];
  const target = validTargets.includes(userSelectedLength) ? userSelectedLength : 'medium';

  // Get base parameters
  const baseParams = getBaseLengthParams(target);

  // Extract adjustment context
  const oneThreadBias = clamp01(preconditionBias?.focus?.oneThreadBias ?? 0);
  const antiOverExpansion = clamp01(preconditionBias?.focus?.antiOverExpansion ?? 0);
  const selectedClusterCount = selectedThoughts?.selected?.length ?? 0;
  const holdBack = consciousIntent?.holdBack ?? [];

  const adjustmentContext = {
    oneThreadBias,
    antiOverExpansion,
    selectedClusterCount,
    holdBack,
  };

  // Apply adjustments
  const adjusted = applyLengthAdjustments(baseParams, adjustmentContext);

  return {
    target,
    ...adjusted,
  };
};

/**
 * Format lengthPlan for debug display
 * @param {object} lengthPlan - LengthPlan
 * @returns {string}
 */
export const formatLengthPlanForDebug = (lengthPlan) => {
  if (!lengthPlan || typeof lengthPlan !== 'object') {
    return 'no length plan';
  }

  const target = lengthPlan.target || 'medium';
  const lines = lengthPlan.lineCountHint ?? 4;
  const expand = (lengthPlan.expansionBudget ?? 0).toFixed(2);
  const compress = (lengthPlan.compressionPressure ?? 0).toFixed(2);

  return `${target} / lines=${lines} / expand=${expand} / compress=${compress}`;
};
