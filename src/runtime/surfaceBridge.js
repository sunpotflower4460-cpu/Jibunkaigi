/**
 * surfaceBridge.js
 * 顕在層 v0.1 Phase 8: Minimal connection from consciousIntent/lengthPlan to surface
 *
 * PURPOSE:
 * - Bridge internal conscious intent to surface generation guidance
 * - Transform speakIntent into directional focus (NOT verbatim phrases)
 * - Transform holdBack into narrowing pressure (NOT prohibition lists)
 * - Transform lengthPlan into natural length hints (NOT token counts)
 *
 * IMPORTANT PRINCIPLES:
 * 1. consciousIntent を表層へ「そのまま読ませない」
 * 2. speakIntent は「方向」として効かせる
 * 3. holdBack は「禁止」ではなく「狭める圧」として効かせる
 * 4. lengthPlan は「完全制御」ではなく「今より揃える」ために使う
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Transform speakIntent into surface-usable focus direction
 *
 * This maps internal speakIntent labels to LOW-SEMANTIC surface guidance hints
 * WITHOUT exposing high-semantic natural language instructions to the LLM
 *
 * IMPORTANT: Keep these hints LOW-SEMANTIC and directional, not instructional
 *
 * @param {string|null} speakIntent - Internal speak intent label
 * @returns {string} Low-semantic surface guidance hint (empty string if no mapping needed)
 */
export const transformSpeakIntentToSurfaceHint = (_speakIntent) => {
  // IMPORTANT: Removed high-semantic Japanese guidance phrases
  // These were re-inventing instructions that should come from internal state
  // Now we return empty string - the direction comes from emotionalColor / motionBias instead
  return '';
};

/**
 * Transform holdBack items into surface restraint hints
 *
 * Maps internal holdBack labels to natural restraint pressure
 * WITHOUT creating prohibition lists for the LLM
 *
 * @param {string[]} holdBack - Internal hold-back labels
 * @returns {object} Surface restraint hints
 */
export const transformHoldBackToSurfaceRestraint = (holdBack = []) => {
  const restraintHints = [];
  let summarySuppression = 0;
  let solutionSuppression = 0;
  let expansionSuppression = 0;
  let closureSuppression = 0;
  let agentRefSuppression = 0;

  for (const item of holdBack) {
    switch (item) {
      case 'no-early-summary':
        restraintHints.push('要約調を抑える');
        summarySuppression = 0.75;
        break;

      case 'no-fix-yet':
        restraintHints.push('解決を急がない');
        solutionSuppression = 0.70;
        break;

      case 'no-over-expansion':
        restraintHints.push('触れる点数を増やしすぎない');
        expansionSuppression = 0.80;
        break;

      case 'do-not-close':
        restraintHints.push('断定で閉じすぎない');
        closureSuppression = 0.65;
        break;

      case 'no-explicit-agent-reference':
        restraintHints.push('他エージェントの直接言及を抑える');
        agentRefSuppression = 0.60;
        break;

      default:
        // Unknown holdBack item - skip
        break;
    }
  }

  return {
    restraintHints: restraintHints.slice(0, 3), // Limit to top 3
    summarySuppression: clamp01(summarySuppression),
    solutionSuppression: clamp01(solutionSuppression),
    expansionSuppression: clamp01(expansionSuppression),
    closureSuppression: clamp01(closureSuppression),
    agentRefSuppression: clamp01(agentRefSuppression),
  };
};

/**
 * Transform lengthPlan into surface length guidance
 *
 * Converts abstract length intention into concrete but flexible hints
 * WITHOUT rigid token counting or forced conformity
 *
 * @param {object} lengthPlan - Length plan from buildLengthPlan
 * @returns {object} Surface length guidance
 */
export const transformLengthPlanToSurfaceGuidance = (lengthPlan = {}) => {
  const target = lengthPlan.target ?? 'medium';
  const lineCountHint = lengthPlan.lineCountHint ?? 4;
  const expansionBudget = clamp01(lengthPlan.expansionBudget ?? 0.45);
  const compressionPressure = clamp01(lengthPlan.compressionPressure ?? 0.50);

  const hints = [];

  // Target-based natural hints
  if (target === 'short') {
    hints.push('短めに収める');
  } else if (target === 'long') {
    hints.push('必要なら少し広げてよい');
  } else {
    hints.push('自然な長さでよい');
  }

  // Line count as soft guidance
  if (lineCountHint <= 2) {
    hints.push('1つの cluster だけ');
  } else if (lineCountHint >= 6) {
    hints.push('必要なら補助 cluster も使う');
  }

  // Expansion budget hints
  if (expansionBudget < 0.35) {
    hints.push('expansion をかなり抑える');
  } else if (expansionBudget > 0.60) {
    hints.push('少し広がってよい');
  }

  // Compression pressure hints
  if (compressionPressure > 0.65) {
    hints.push('圧縮して伝える');
  } else if (compressionPressure < 0.40) {
    hints.push('余白を持たせてよい');
  }

  return {
    target,
    lineCountHint,
    expansionBudget,
    compressionPressure,
    lengthGuidanceHints: hints.slice(0, 3), // Limit to top 3
  };
};

/**
 * Build complete surface guidance from consciousIntent and lengthPlan
 *
 * Main bridge function that combines all transformations into
 * a unified surface guidance object
 *
 * @param {object} params
 * @param {object} params.consciousIntent - Conscious intent from buildConsciousIntent
 * @param {object} params.lengthPlan - Length plan from buildLengthPlan
 * @returns {object} Complete surface guidance
 */
export const buildSurfaceGuidanceFromIntent = ({
  consciousIntent = null,
  lengthPlan = null,
} = {}) => {
  // Null safety
  const safeIntent = consciousIntent && typeof consciousIntent === 'object' ? consciousIntent : {};
  const safePlan = lengthPlan && typeof lengthPlan === 'object' ? lengthPlan : {};

  // Extract core elements
  const speakIntent = safeIntent.speakIntent ?? null;
  const holdBack = Array.isArray(safeIntent.holdBack) ? safeIntent.holdBack : [];

  // Transform each component
  const speakIntentHint = transformSpeakIntentToSurfaceHint(speakIntent);
  const restraint = transformHoldBackToSurfaceRestraint(holdBack);
  const lengthGuidance = transformLengthPlanToSurfaceGuidance(safePlan);

  return {
    // Speak intent as directional focus
    speakIntentHint,
    speakIntentKey: speakIntent, // Keep key for debug

    // Hold-back as narrowing pressure
    restraintHints: restraint.restraintHints,
    summarySuppression: restraint.summarySuppression,
    solutionSuppression: restraint.solutionSuppression,
    expansionSuppression: restraint.expansionSuppression,
    closureSuppression: restraint.closureSuppression,
    agentRefSuppression: restraint.agentRefSuppression,

    // Length as flexible guidance
    lengthTarget: lengthGuidance.target,
    lineCountHint: lengthGuidance.lineCountHint,
    expansionBudget: lengthGuidance.expansionBudget,
    compressionPressure: lengthGuidance.compressionPressure,
    lengthGuidanceHints: lengthGuidance.lengthGuidanceHints,
  };
};

/**
 * Format surface guidance for debug/compare display
 *
 * @param {object} surfaceGuidance - Surface guidance from buildSurfaceGuidanceFromIntent
 * @returns {string} Formatted debug string
 */
export const formatSurfaceGuidanceForDebug = (surfaceGuidance = {}) => {
  if (!surfaceGuidance || typeof surfaceGuidance !== 'object') {
    return 'no surface guidance';
  }

  const intent = surfaceGuidance.speakIntentKey || '-';
  const restraints = surfaceGuidance.restraintHints?.join(', ') || '-';
  const length = surfaceGuidance.lengthTarget || 'medium';
  const lines = surfaceGuidance.lineCountHint ?? 4;
  const expand = (surfaceGuidance.expansionBudget ?? 0).toFixed(2);
  const compress = (surfaceGuidance.compressionPressure ?? 0).toFixed(2);

  return `intent: ${intent} | restraint: ${restraints} | length: ${length} / lines=${lines} / expand=${expand} / compress=${compress}`;
};
