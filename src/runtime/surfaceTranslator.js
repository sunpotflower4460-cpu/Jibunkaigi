// src/runtime/surfaceTranslator.js
// Surface Translator 最小版
// 潜在層(latentState/patternMix/permission/surfaceWindow/afterglow)を
// 各 agent に渡せる短い共通 surface frame に変換する

export const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

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

  if (noHurry >= 0.5 || urgency < 0.3) return 'slow';
  if (urgency >= 0.6) return 'aware_of_time';

  return 'medium';
};

const describeDirectness = (latentState = {}) => {
  const illuminate = clamp01(latentState.stance?.illuminate ?? 0);
  const structure = clamp01(latentState.stance?.structure ?? 0);
  const receive = clamp01(latentState.stance?.receive ?? 0);

  const direct = illuminate * 0.5 + structure * 0.5;
  const indirect = receive * 0.7;

  if (direct > 0.6) return 'clear';
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

  if (isMirror) {
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

  if (dominantPatterns.includes('comfort_soft') || dominantPatterns.includes('protective_hold')) {
    return 'stay with the contact without pushing';
  }

  if (dominantPatterns.includes('truth_gentle')) {
    return 'let truth surface gently';
  }

  return 'speak from what is present';
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

  // Mirror mode adjustments
  if (isMirror) {
    if (directness === 'clear') directness = 'medium';
    if (directness === 'medium') directness = 'gentle';
    if (pacing === 'aware_of_time') pacing = 'medium';
    if (pacing === 'medium') pacing = 'slow';
  }

  const surfaceHint = buildSurfaceHint(normalizedLatent, dominantPatterns, isMirror);

  return {
    toneBias,
    pacing,
    directness,
    emotionalTemperature,
    dominantPatterns,
    permissionHints,
    fieldHint,
    surfaceHint,
    afterglowHint,
    mirrorMode: isMirror,
  };
};
