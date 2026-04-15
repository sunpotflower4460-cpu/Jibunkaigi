import { LATENT_PATTERNS } from './patternLibrary.js';

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const normalizeVector = (vector = {}) => Object.fromEntries(
  Object.entries(vector)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([key, value]) => [key, clamp01(value)]),
);

const scoreVector = (source, affinity) => {
  const entries = Object.entries(affinity ?? {});

  if (!entries.length) {
    return 0;
  }

  const weighted = entries.reduce((sum, [key, affinityWeight]) => sum + ((source[key] ?? 0) * affinityWeight), 0);
  const totalAffinity = entries.reduce((sum, [, affinityWeight]) => sum + affinityWeight, 0);

  return totalAffinity > 0 ? weighted / totalAffinity : 0;
};

const hashToUnit = (text) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash * 31) + char.charCodeAt(0)) % 9973;
  }

  return hash / 9973;
};

const previousMixMap = (previousMix) => {
  // Null-safe: ensure previousMix is a valid object before accessing .selected
  if (!previousMix || typeof previousMix !== 'object') {
    return new Map();
  }

  const selected = Array.isArray(previousMix.selected) ? previousMix.selected : [];

  return new Map(
    selected
      .filter((item) => item && typeof item.id === 'string' && typeof item.weight === 'number')
      .map((item) => [item.id, clamp01(item.weight)])
  );
};

const basePatternScore = (pattern, latentState, previousMixWeights) => {
  const fieldScore = scoreVector(latentState.field, pattern.fieldAffinity);
  const reactionScore = scoreVector(latentState.reaction, pattern.reactionAffinity);
  const stanceScore = scoreVector(latentState.stance, pattern.stanceWeights);
  const permissionScore = scoreVector(latentState.permission, pattern.permissionAffinity);
  const inertiaBoost = (previousMixWeights.get(pattern.id) ?? 0) * 0.08;
  const deterministicJitter = hashToUnit(pattern.id) * 0.01;

  return (
    (fieldScore * 0.26)
    + (reactionScore * 0.31)
    + (stanceScore * 0.29)
    + (permissionScore * 0.12)
    + inertiaBoost
    + deterministicJitter
  );
};

const applySelectionPenalty = (pattern, selected, groupCounts) => {
  const sameGroupCount = groupCounts.get(pattern.group) ?? 0;
  const groupPenalty = Math.max(0.62, 1 - (sameGroupCount * 0.18));
  const relationPenalty = selected.some((entry) => entry.suppresses?.includes(pattern.id)) ? 0.06 : 0;
  const relationBoost = selected.some((entry) => entry.boosts?.includes(pattern.id)) ? 0.03 : 0;

  return Math.max(0, (groupPenalty - relationPenalty + relationBoost));
};

const normalizeSelected = (selected) => {
  const total = selected.reduce((sum, item) => sum + item.score, 0);

  if (total <= 0) {
    return selected.map((item, index) => ({
      id: item.id,
      group: item.group,
      weight: index === 0 ? 1 : 0,
    }));
  }

  return selected.map((item) => ({
    id: item.id,
    group: item.group,
    weight: Number((item.score / total).toFixed(4)),
  }));
};

export function mixLatentPatterns(latentState = {}, options = {}) {
  const previousMixWeights = previousMixMap(options.previousMix);
  const homeInfluence = clamp01(options.homeInfluence ?? 0);

  const normalizedLatentState = {
    field: normalizeVector(latentState.field),
    reaction: normalizeVector(latentState.reaction),
    stance: normalizeVector(latentState.stance),
    permission: normalizeVector(latentState.permission),
  };

  const scoredPatterns = LATENT_PATTERNS.map((pattern) => {
    let rawScore = basePatternScore(pattern, normalizedLatentState, previousMixWeights);

    // Home Layer の軽い反映: structure 系パターンを少し抑える
    if (homeInfluence > 0.3 && pattern.group === 'structure') {
      rawScore *= (1 - homeInfluence * 0.12);
    }

    return {
      ...pattern,
      rawScore,
    };
  });

  const groupCounts = new Map();
  const selected = [];
  const targetCount = Math.min(Math.max(options.topK ?? 4, 3), 5);

  while (selected.length < targetCount && selected.length < scoredPatterns.length) {
    const remaining = scoredPatterns
      .filter((pattern) => !selected.some((entry) => entry.id === pattern.id))
      .map((pattern) => ({
        ...pattern,
        score: Number((pattern.rawScore * applySelectionPenalty(pattern, selected, groupCounts)).toFixed(6)),
      }))
      .sort((a, b) => b.score - a.score);

    const nextPattern = remaining[0];

    if (!nextPattern) {
      break;
    }

    selected.push(nextPattern);
    groupCounts.set(nextPattern.group, (groupCounts.get(nextPattern.group) ?? 0) + 1);
  }

  const normalizedSelected = normalizeSelected(selected);

  return {
    selected: normalizedSelected,
    dominant: normalizedSelected[0]?.id ?? '',
  };
}
