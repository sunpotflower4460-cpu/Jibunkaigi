// src/runtime/surfaceTranslator.js
// Surface Translator 最小版
// 潜在層(latentState/patternMix/permission/surfaceWindow/afterglow)を
// 各 agent に渡せる短い共通 surface frame に変換する

export const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const STRONG_FOCUS_THRESHOLD = 0.72;
const MODERATE_FOCUS_THRESHOLD = 0.45;

const describeMeaningHintFromBeliefAxis = (preconditionBias = {}) => {
  switch (preconditionBias?.meaning?.dominantBeliefAxis) {
    case 'illumination':
      return 'let one live angle come forward before explaining it';
    case 'structure':
      return 'let the shape become visible before solving it';
    case 'holding':
    case 'presence':
      return 'treat contact and safety as part of what matters';
    case 'grounding':
      return 'keep meaning close to what is here now';
    case 'reflection':
      return 'stay with what keeps echoing instead of closing it fast';
    case 'preverbal':
      return 'touch what is not fully said before naming it';
    case 'mission':
      return 'keep the reply oriented without turning it into a pitch';
    default:
      return '';
  }
};

const describeIdentityHint = (preconditionBias = {}) => {
  const identityKey = preconditionBias?.identity?.identityKey ?? '';

  if (identityKey.includes('creative')) return 'keep the response alive rather than performative';
  if (identityKey.includes('strateg')) return 'keep the response deliberate but not overbuilt';
  if (identityKey.includes('empath')) return 'keep the response close and breathable';
  if (identityKey.includes('critic')) return 'keep the edge brief and protective';
  if (identityKey.includes('soul') || identityKey.includes('master')) return 'keep the presence quiet and settled';

  return '';
};

const describeFocusHint = (preconditionBias = {}) => {
  const focus = preconditionBias?.focus ?? {};

  if ((focus.oneThreadBias ?? 0) >= STRONG_FOCUS_THRESHOLD || (focus.antiOverExpansion ?? 0) >= STRONG_FOCUS_THRESHOLD) {
    return 'stay with one living thread';
  }
  if ((focus.oneThreadBias ?? 0) >= MODERATE_FOCUS_THRESHOLD) {
    return 'do not fan out too early';
  }

  return '';
};

const describeDecisionFocusHint = (decision = {}) => {
  switch (decision?.intention?.focusTarget) {
    case 'faint-thread':
      return 'stay with the faint thread that is still alive';
    case 'hidden-knot':
      return 'touch the knot before trying to untie it';
    case 'fragile-edge':
      return 'stay near the fragile edge without pushing it';
    case 'preverbal-edge':
      return 'stay close to what is not fully said yet';
    case 'unclosed-weight':
      return 'keep contact with what is still unclosed';
    case 'here-now':
      return 'come back to what is here now';
    default:
      return '';
  }
};

const describeDecisionSurfaceHint = (decision = {}) => {
  switch (decision?.intention?.speakIntentKey) {
    case 'touch_living_thread':
      return 'touch the living thread before explaining it';
    case 'name_hidden_knot':
      return 'name the hidden knot without over-solving it';
    case 'make_room_before_move':
      return 'make room before asking for movement';
    case 'stay_with_preverbal':
      return 'stay with the preverbal edge before naming it';
    case 'reflect_unclosed_weight':
      return 'reflect the unclosed weight without wrapping it up';
    case 'return_to_ground':
      return 'return to ground before expanding the reply';
    default:
      return '';
  }
};

export const pickDominantPatterns = (patternMix, limit = 2) => {
  if (!patternMix || typeof patternMix !== 'object') return [];

  const selected = Array.isArray(patternMix.selected) ? patternMix.selected : [];

  return selected
    .filter((item) => item && typeof item.id === 'string' && typeof item.weight === 'number')
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((item) => item.id);
};

export const summarizePermission = (permission = {}) => {
  const hints = [];

  if ((permission.noHurry ?? 0) >= 0.4) hints.push('do_not_rush');
  if ((permission.noOverExplain ?? 0) >= 0.4) hints.push('do_not_over_explain');
  if ((permission.noPerformativeHelpfulness ?? 0) >= 0.4) hints.push('skip_performative_fixing');
  if ((permission.allowPartialUncertainty ?? 0) >= 0.4) hints.push('leave_room_for_uncertainty');

  return hints.slice(0, 2);
};

export const summarizeField = (field = {}) => {
  const softness = clamp01(field.softness ?? 0);
  const depth = clamp01(field.depth ?? 0);
  const urgency = clamp01(field.urgency ?? 0);
  const fragility = clamp01(field.fragility ?? 0);

  if (fragility >= 0.55) return 'fragile_edge';
  if (depth >= 0.55 && softness >= 0.45) return 'deep_and_soft';
  if (urgency >= 0.55) return 'time_sensitive';
  if (softness >= 0.55) return 'gentle_space';
  if (depth >= 0.45) return 'medium_depth';

  return 'plain_field';
};

export const summarizeReaction = (reaction = {}) => {
  const touched = clamp01(reaction.touched ?? 0);
  const protect = clamp01(reaction.protect ?? 0);
  const curiosity = clamp01(reaction.curiosity ?? 0);

  if (protect >= 0.5) return 'protective';
  if (touched >= 0.5) return 'touched';
  if (curiosity >= 0.4) return 'curious';

  return 'steady';
};

export const summarizeStance = (stance = {}) => {
  const entries = Object.entries(stance)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) return 'receive';

  return entries[0][0];
};

export const summarizeAfterglow = (afterglowSeed) => {
  if (!afterglowSeed) return 'no_continuity';

  const hasPreviousMix = afterglowSeed.previousMix &&
    Array.isArray(afterglowSeed.previousMix.selected) &&
    afterglowSeed.previousMix.selected.length > 0;

  const hasPreviousLatent = afterglowSeed.previousLatentState &&
    typeof afterglowSeed.previousLatentState === 'object';

  if (hasPreviousMix || hasPreviousLatent) {
    return 'slight_continuity_from_previous_turn';
  }

  return 'no_continuity';
};

const describeToneBias = (latentState = {}) => {
  const field = latentState.field ?? {};
  const stance = latentState.stance ?? {};
  const reaction = latentState.reaction ?? {};

  const gentle = clamp01(
    (field.softness ?? 0) * 0.4 +
    (stance.receive ?? 0) * 0.3 +
    (reaction.touched ?? 0) * 0.3
  );

  const structural = clamp01(
    (stance.structure ?? 0) * 0.5 +
    (reaction.clarify ?? 0) * 0.3 +
    (field.depth ?? 0) * 0.2
  );

  const challenging = clamp01(
    (stance.nudge ?? 0) * 0.4 +
    (reaction.curiosity ?? 0) * 0.4 +
    (field.urgency ?? 0) * 0.2
  );

  const spacious = clamp01(
    (stance.receive ?? 0) * 0.3 +
    (reaction.holdBackJudgment ?? 0) * 0.4 +
    (1 - (field.urgency ?? 0)) * 0.3
  );

  return { gentle, structural, challenging, spacious };
};

const describePacing = (latentState = {}) => {
  const urgency = clamp01(latentState.field?.urgency ?? 0);
  const noHurry = clamp01(latentState.permission?.noHurry ?? 0);
  const biasSlowDown = clamp01(latentState.preconditionBias?.pacing?.slowDown ?? 0);
  const biasReturn = clamp01(latentState.preconditionBias?.pacing?.returnBias ?? 0);

  if (noHurry >= 0.5 || biasSlowDown >= 0.55 || biasReturn >= 0.55 || urgency < 0.3) return 'slow';
  if (urgency >= 0.6) return 'aware_of_time';

  return 'medium';
};

const describeDirectness = (latentState = {}) => {
  const illuminate = clamp01(latentState.stance?.illuminate ?? 0);
  const structure = clamp01(latentState.stance?.structure ?? 0);
  const receive = clamp01(latentState.stance?.receive ?? 0);
  const antiEarlySummary = clamp01(latentState.preconditionBias?.meaning?.antiEarlySummary ?? 0);
  const oneThreadBias = clamp01(latentState.preconditionBias?.focus?.oneThreadBias ?? 0);
  const dominantBeliefAxis = latentState.preconditionBias?.meaning?.dominantBeliefAxis ?? null;

  const direct = illuminate * 0.5 + structure * 0.5;
  const indirect = receive * 0.7 + antiEarlySummary * 0.15;

  if (dominantBeliefAxis === 'structure' && direct > 0.45) return 'clear';
  if (direct > 0.6 && oneThreadBias < 0.7) return 'clear';
  if (indirect > 0.5) return 'gentle';

  return 'medium';
};

const describeEmotionalTemperature = (latentState = {}) => {
  const softness = clamp01(latentState.field?.softness ?? 0);
  const touched = clamp01(latentState.reaction?.touched ?? 0);
  const protect = clamp01(latentState.reaction?.protect ?? 0);

  const warm = (softness + touched + protect) / 3;

  if (warm >= 0.55) return 'soft';
  if (warm >= 0.35) return 'warm';

  return 'neutral';
};

const buildSurfaceHint = (latentState = {}, dominantPatterns = [], isMirror = false) => {
  const field = latentState.field ?? {};
  const permission = latentState.permission ?? {};
  const preconditionBias = latentState.preconditionBias ?? {};
  const decision = latentState.decision ?? {};
  const meaningHint = describeMeaningHintFromBeliefAxis(preconditionBias);
  const focusHint = describeDecisionFocusHint(decision) || describeFocusHint(preconditionBias);
  const decisionSurfaceHint = describeDecisionSurfaceHint(decision);

  if (isMirror) {
    if (decisionSurfaceHint) return decisionSurfaceHint;
    if ((field.fragility ?? 0) >= 0.55) {
      return 'reflect gravity and unresolved points without forcing resolution';
    }
    return 'quietly reflect what patterns persist';
  }

  const fragile = (field.fragility ?? 0) >= 0.55;
  const noRush = (permission.noHurry ?? 0) >= 0.4;
  const noOverExplain = (permission.noOverExplain ?? 0) >= 0.4;

  if (fragile && noRush) {
    return 'name what is here before trying to solve it';
  }

  if (noOverExplain) {
    return 'touch lightly without explanation';
  }

  if (decisionSurfaceHint) {
    return decisionSurfaceHint;
  }

  if (meaningHint && focusHint) {
    return `${meaningHint}; ${focusHint}`;
  }

  if (meaningHint) {
    return meaningHint;
  }

  if (dominantPatterns.includes('comfort_soft') || dominantPatterns.includes('protective_hold')) {
    return 'stay with the contact without pushing';
  }

  if (dominantPatterns.includes('truth_gentle')) {
    return 'let truth surface gently';
  }

  return 'speak from what is present';
};

/**
 * Build surface hint from surfacePlan (v0.2)
 * Reads emotionalColor, motionBias, speakIntent from surfacePlan
 * Translates to natural Japanese guidance WITHOUT exposing internal labels
 *
 * @param {object} surfacePlan - SurfacePlan from buildSurfacePlan
 * @param {boolean} isMirror - Is mirror mode
 * @returns {string} Natural surface hint
 */
const buildSurfaceHintFromPlan = (surfacePlan = {}, isMirror = false) => {
  const emotionalColor = surfacePlan.emotionalColor ?? [];
  const motionBias = surfacePlan.motionBias ?? [];
  const speakIntent = surfacePlan.speakIntent ?? null;
  const othersPresence = surfacePlan.othersPresence ?? {};

  // Mirror mode: reflect field gravity
  if (isMirror) {
    if (othersPresence.hasOthers) {
      const forces = othersPresence.dominantForces ?? [];
      if (forces.includes('hold') || forces.includes('stay')) {
        return 'reflect what persists without forcing resolution';
      }
      if (forces.includes('clarify') || forces.includes('ground')) {
        return 'reflect the underlying structure quietly';
      }
      return 'reflect field gravity and unresolved points';
    }
    return 'quietly reflect what patterns persist';
  }

  // Build hint from speakIntent
  let hint = '';
  switch (speakIntent) {
    case 'touch-the-living-point':
      hint = 'まだ鈍っていない一点へ触れる';
      break;
    case 'clarify-the-knot':
      hint = '結び目を短く言う';
      break;
    case 'make-room-without-closing':
      hint = '余白をつくる';
      break;
    case 'return-to-footing':
    case 'return-to-ground':
      hint = '足場に戻る';
      break;
    case 'reflect-the-unsettled-weight':
      hint = '閉じていない重さを映す';
      break;
    default:
      hint = '';
  }

  // Modify hint with emotionalColor
  if (emotionalColor.includes('warm') || emotionalColor.includes('soft')) {
    if (!hint) hint = 'そっと触れる';
  }
  if (emotionalColor.includes('tight') || emotionalColor.includes('sharp')) {
    if (!hint) hint = '張りを持って言う';
  }
  if (emotionalColor.includes('hesitant')) {
    if (!hint) hint = 'ためらいを含めて話す';
  }
  if (emotionalColor.includes('quiet')) {
    if (!hint) hint = '静かに留まる';
  }
  if (emotionalColor.includes('fragile')) {
    if (!hint) hint = '繊細に触れる';
  }

  // Modify hint with motionBias
  if (motionBias.includes('hold') && !hint) {
    hint = '支える';
  }
  if (motionBias.includes('stay') && !hint) {
    hint = 'そのままでいる';
  }
  if (motionBias.includes('do-not-close') && !hint) {
    hint = '閉じない';
  }

  return hint || 'speak from what is present';
};

export const buildSurfaceFrame = ({
  latentState,
  patternMix,
  surfaceWindow, // eslint-disable-line no-unused-vars
  afterglowSeed,
  agentId, // eslint-disable-line no-unused-vars
  isMirror = false,
}) => {
  const normalizedLatent = latentState && typeof latentState === 'object' ? latentState : {};
  const normalizedPatternMix = patternMix && typeof patternMix === 'object' ? patternMix : null;
  const normalizedAfterglow = afterglowSeed && typeof afterglowSeed === 'object' ? afterglowSeed : null;

  const toneBias = describeToneBias(normalizedLatent);
  let pacing = describePacing(normalizedLatent);
  let directness = describeDirectness(normalizedLatent);
  const emotionalTemperature = describeEmotionalTemperature(normalizedLatent);
  const dominantPatterns = pickDominantPatterns(normalizedPatternMix, 2);
  const permissionHints = summarizePermission(normalizedLatent.permission);
  const fieldHint = summarizeField(normalizedLatent.field);
  const afterglowHint = summarizeAfterglow(normalizedAfterglow);
  const focusHint =
    describeDecisionFocusHint(normalizedLatent.decision) ||
    describeFocusHint(normalizedLatent.preconditionBias);
  const meaningHint = describeMeaningHintFromBeliefAxis(normalizedLatent.preconditionBias);
  const identityHint = describeIdentityHint(normalizedLatent.preconditionBias);
  const decision = normalizedLatent.decision ?? {};

  // Phase 8: Extract consciousIntent and lengthPlan from latentState
  const consciousIntent = normalizedLatent.consciousIntent ?? null;
  const lengthPlan = normalizedLatent.lengthPlan ?? null;

  // Surface v0.2: Extract surfacePlan from latentState
  const surfacePlan = normalizedLatent.surfacePlan ?? null;

  // Mirror mode adjustments
  if (isMirror) {
    if (directness === 'clear') directness = 'medium';
    if (directness === 'medium') directness = 'gentle';
    if (pacing === 'aware_of_time') pacing = 'medium';
    if (pacing === 'medium') pacing = 'slow';
  }

  // Surface v0.2: Use surfacePlan if available, otherwise fall back to old buildSurfaceHint
  const surfaceHint = surfacePlan
    ? buildSurfaceHintFromPlan(surfacePlan, isMirror)
    : buildSurfaceHint(normalizedLatent, dominantPatterns, isMirror);

  return {
    toneBias,
    pacing,
    directness,
    emotionalTemperature,
    dominantPatterns,
    permissionHints,
    fieldHint,
    focusHint,
    meaningHint,
    identityHint,
    speakIntentKey: decision?.intention?.speakIntentKey ?? null,
    speakIntentText: decision?.intention?.speakIntentText ?? null,
    touchDepth: clamp01(decision?.intention?.touchDepth ?? 0),
    focusTarget: decision?.intention?.focusTarget ?? null,
    restraint: {
      holdBackSummary: clamp01(decision?.restraint?.holdBackSummary ?? 0),
      holdBackSolution: clamp01(decision?.restraint?.holdBackSolution ?? 0),
      holdBackExpansion: clamp01(decision?.restraint?.holdBackExpansion ?? 0),
      keepSilenceMargin: clamp01(decision?.restraint?.keepSilenceMargin ?? 0),
    },
    surfaceHint,
    afterglowHint,
    mirrorMode: isMirror,
    // Phase 8: Include consciousIntent and lengthPlan
    consciousIntent,
    lengthPlan,
    // Surface v0.2: Include surfacePlan
    surfacePlan,
  };
};
