const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const normalizeVector = (vector = {}) => Object.fromEntries(
  Object.entries(vector)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([key, value]) => [key, clamp01(value)]),
);

const normalizeLatentState = (state) => {
  if (!state || typeof state !== 'object') return null;

  const normalized = {
    field: normalizeVector(state.field),
    reaction: normalizeVector(state.reaction),
    stance: normalizeVector(state.stance),
    permission: normalizeVector(state.permission),
  };

  const hasValues = Object.values(normalized).some((section) => Object.keys(section).length > 0);

  return hasValues ? normalized : null;
};

const normalizePatternMix = (mix) => {
  if (!mix || typeof mix !== 'object') return null;

  const normalizedSelected = (Array.isArray(mix.selected) ? mix.selected : [])
    .filter((item) => item && typeof item.id === 'string' && typeof item.weight === 'number')
    .map((item) => ({
      id: item.id,
      group: typeof item.group === 'string' ? item.group : '',
      weight: clamp01(item.weight),
    }));

  if (!normalizedSelected.length) {
    return null;
  }

  const totalWeight = normalizedSelected.reduce((sum, item) => sum + item.weight, 0);
  const rescaledSelected = totalWeight > 0
    ? normalizedSelected.map((item) => ({
      ...item,
      weight: Number((item.weight / totalWeight).toFixed(4)),
    }))
    : normalizedSelected;

  const dominant = typeof mix.dominant === 'string' && mix.dominant
    ? mix.dominant
    : rescaledSelected[0].id;

  return {
    selected: rescaledSelected,
    dominant,
  };
};

const blendScalar = (previous, current, { previousCarry, currentWeight }) => {
  const prev = typeof previous === 'number' && Number.isFinite(previous) ? clamp01(previous) : null;
  const curr = typeof current === 'number' && Number.isFinite(current) ? clamp01(current) : 0;
  const totalWeight = (prev !== null ? previousCarry : 0) + currentWeight;
  const weighted = ((prev ?? 0) * (prev !== null ? previousCarry : 0)) + (curr * currentWeight);

  return totalWeight > 0 ? clamp01(weighted / totalWeight) : 0;
};

const blendVector = (previous = {}, current = {}, { previousCarry = 0.14, currentWeight = 0.86 } = {}) => {
  const prevNormalized = normalizeVector(previous);
  const currentNormalized = normalizeVector(current);
  const keys = new Set([...Object.keys(currentNormalized), ...Object.keys(prevNormalized)]);
  const result = {};

  keys.forEach((key) => {
    result[key] = blendScalar(prevNormalized[key], currentNormalized[key], { previousCarry, currentWeight });
  });

  return result;
};

const blendLatentState = (previousState, currentState) => {
  const prev = normalizeLatentState(previousState);
  const current = normalizeLatentState(currentState);

  if (!current) return prev;
  if (!prev) return current;

  return {
    field: blendVector(prev.field, current.field),
    reaction: blendVector(prev.reaction, current.reaction),
    stance: blendVector(prev.stance, current.stance),
    permission: blendVector(prev.permission, current.permission),
  };
};

const getAfterglowSeed = (afterglow) => {
  const hasAfterglow = afterglow && typeof afterglow === 'object';
  const previousMix = hasAfterglow ? normalizePatternMix(afterglow.lastPatternMix) : null;
  const previousLatentState = hasAfterglow ? normalizeLatentState(afterglow.lastLatentState) : null;

  return {
    previousMix,
    previousLatentState,
  };
};

const buildNextAfterglow = ({
  previousAfterglow,
  latentState,
  patternMix,
  respondingAgentId,
  isMaster = false,
} = {}) => {
  const seed = getAfterglowSeed(previousAfterglow);
  const previousTurnCount = typeof previousAfterglow?.turnCount === 'number' ? previousAfterglow.turnCount : 0;
  const normalizedLatentState = normalizeLatentState(latentState) ?? seed.previousLatentState;
  const normalizedPatternMix = normalizePatternMix(patternMix) ?? seed.previousMix;
  const nextTurnCount = isMaster ? previousTurnCount : previousTurnCount + 1;

  return {
    lastPatternMix: isMaster ? seed.previousMix ?? null : normalizedPatternMix ?? null,
    lastLatentState: isMaster ? seed.previousLatentState ?? null : normalizedLatentState ?? null,
    lastRespondingAgentId: typeof respondingAgentId === 'string'
      ? respondingAgentId
      : previousAfterglow?.lastRespondingAgentId ?? null,
    turnCount: nextTurnCount,
    updatedAtMs: Date.now(),
  };
};

export {
  clamp01,
  normalizeVector,
  normalizeLatentState,
  normalizePatternMix,
  blendScalar,
  blendVector,
  blendLatentState,
  getAfterglowSeed,
  buildNextAfterglow,
};
