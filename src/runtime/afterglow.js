const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const normalizeVector = (vector = {}) => Object.fromEntries(
  Object.entries(vector)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([key, value]) => [key, clamp01(value)]),
);

const normalizeExistenceLayer1 = (layer1 = {}) => {
  const normalized = normalizeVector(layer1);
  const hintKey = typeof layer1.existenceHintKey === 'string' ? layer1.existenceHintKey : null;
  const hintText = typeof layer1.existenceHintText === 'string' ? layer1.existenceHintText : null;

  if (hintKey !== null || hintText !== null) {
    return { ...normalized, existenceHintKey: hintKey, existenceHintText: hintText };
  }

  return Object.keys(normalized).length ? normalized : null;
};

const normalizeExistenceLayer2 = (layer2 = {}) => {
  if (!layer2 || typeof layer2 !== 'object') return null;

  const agentIdentityKey = typeof layer2.agentIdentityKey === 'string' ? layer2.agentIdentityKey : '';
  const agentIdentityText = typeof layer2.agentIdentityText === 'string' ? layer2.agentIdentityText : '';
  const selfRememberingStrength = clamp01(layer2.selfRememberingStrength ?? 0);
  const recalledSelfTraits = Array.isArray(layer2.recalledSelfTraits)
    ? layer2.recalledSelfTraits.filter((trait) => typeof trait === 'string' && trait.trim()).slice(0, 4)
    : [];

  const hasIdentity = agentIdentityKey || agentIdentityText || recalledSelfTraits.length > 0 || selfRememberingStrength > 0;
  return hasIdentity
    ? { agentIdentityKey, agentIdentityText, recalledSelfTraits, selfRememberingStrength }
    : null;
};

const normalizeBeliefEntry = (entry = {}) => {
  if (!entry || typeof entry !== 'object') return null;
  const id = typeof entry.id === 'string' ? entry.id : null;
  const text = typeof entry.text === 'string' ? entry.text : null;
  if (!id || !text) return null;

  const normalized = {
    id,
    text,
    weight: clamp01(entry.weight ?? 0),
  };

  if (entry.vector && typeof entry.vector === 'object') {
    normalized.vector = entry.vector;
  }

  return normalized;
};

const normalizeBeliefLayers = (belief = {}) => {
  if (!belief || typeof belief !== 'object') return null;

  const layer1 = Array.isArray(belief.layer1) ? belief.layer1.map(normalizeBeliefEntry).filter(Boolean) : [];
  const layer2 = Array.isArray(belief.layer2) ? belief.layer2.map(normalizeBeliefEntry).filter(Boolean) : [];
  const layer3 = Array.isArray(belief.layer3) ? belief.layer3.map(normalizeBeliefEntry).filter(Boolean) : [];

  const hasLayer = layer1.length || layer2.length || layer3.length;
  return hasLayer ? { layer1, layer2, layer3 } : null;
};

const normalizeBeliefCore = (beliefCore = {}) => {
  if (!beliefCore || typeof beliefCore !== 'object') return null;

  const activeCoreBeliefs = Array.isArray(beliefCore.activeCoreBeliefs)
    ? beliefCore.activeCoreBeliefs.filter(
        (b) => b && typeof b.id === 'string' && b.id && typeof b.textJa === 'string'
      )
    : [];

  const dominantBeliefAxis =
    typeof beliefCore.dominantBeliefAxis === 'string' ? beliefCore.dominantBeliefAxis : null;

  return activeCoreBeliefs.length > 0 || dominantBeliefAxis
    ? { activeCoreBeliefs, dominantBeliefAxis }
    : null;
};

const isBranchLikeBelief = (belief = {}) =>
  belief && typeof belief.id === 'string' && typeof belief.parentId === 'string' && typeof belief.textJa === 'string';

const normalizeBeliefBranch = (beliefBranch = {}) => {
  if (!beliefBranch || typeof beliefBranch !== 'object') return null;

  const activeBranchBeliefs = Array.isArray(beliefBranch.activeBranchBeliefs)
    ? beliefBranch.activeBranchBeliefs.filter((b) => isBranchLikeBelief(b))
    : [];

  const dominantBranchAxis =
    typeof beliefBranch.dominantBranchAxis === 'string' ? beliefBranch.dominantBranchAxis : null;

  return activeBranchBeliefs.length > 0 || dominantBranchAxis
    ? { activeBranchBeliefs, dominantBranchAxis }
    : null;
};

const normalizeBeliefLeaf = (beliefLeaf = {}) => {
  if (!beliefLeaf || typeof beliefLeaf !== 'object') return null;

  const activeLeafBeliefs = Array.isArray(beliefLeaf.activeLeafBeliefs)
    ? beliefLeaf.activeLeafBeliefs.filter((b) => isBranchLikeBelief(b))
    : [];

  const dominantLeafAxis =
    typeof beliefLeaf.dominantLeafAxis === 'string' ? beliefLeaf.dominantLeafAxis : null;

  return activeLeafBeliefs.length > 0 || dominantLeafAxis
    ? { activeLeafBeliefs, dominantLeafAxis }
    : null;
};

const normalizeBeliefTension = (beliefTension = {}) => {
  if (!beliefTension || typeof beliefTension !== 'object') return null;

  const activeTensions = Array.isArray(beliefTension.activeTensions)
    ? beliefTension.activeTensions.filter(
        (t) => t && typeof t.beliefId === 'string' && typeof t.tensionType === 'string'
      )
    : [];

  const dominantTensionAxis =
    typeof beliefTension.dominantTensionAxis === 'string' ? beliefTension.dominantTensionAxis : null;
  const totalTensionStrength = clamp01(beliefTension.totalTensionStrength ?? 0);

  return activeTensions.length > 0 || dominantTensionAxis || totalTensionStrength > 0
    ? { activeTensions, dominantTensionAxis, totalTensionStrength }
    : null;
};

const normalizeLatentState = (state) => {
  if (!state || typeof state !== 'object') return null;

  const normalized = {
    field: normalizeVector(state.field),
    reaction: normalizeVector(state.reaction),
    stance: normalizeVector(state.stance),
    permission: normalizeVector(state.permission),
  };

  // Preserve makerSeed if it exists
  if (state.makerSeed && typeof state.makerSeed === 'object') {
    normalized.makerSeed = state.makerSeed;
  }

  // Preserve home layer if it exists
  if (state.home && typeof state.home === 'object') {
    normalized.home = state.home;
  }

  // Preserve existence layers when present
  const existenceLayer1 = normalizeExistenceLayer1(state.existence?.layer1);
  const existenceLayer2 = normalizeExistenceLayer2(state.existence?.layer2);
  if (existenceLayer1 || existenceLayer2) {
    normalized.existence = {};
    if (existenceLayer1) normalized.existence.layer1 = existenceLayer1;
    if (existenceLayer2) normalized.existence.layer2 = existenceLayer2;
  }

  // Preserve belief layers when present
  const belief = normalizeBeliefLayers(state.belief);
  if (belief) {
    normalized.belief = belief;
  }

  const beliefBranch = normalizeBeliefBranch(state.beliefBranch);
  if (beliefBranch) {
    normalized.beliefBranch = beliefBranch;
  }

  const beliefLeaf = normalizeBeliefLeaf(state.beliefLeaf);
  if (beliefLeaf) {
    normalized.beliefLeaf = beliefLeaf;
  }

  // Preserve beliefCore when present
  const beliefCore = normalizeBeliefCore(state.beliefCore);
  if (beliefCore) {
    normalized.beliefCore = beliefCore;
  }

  const beliefTension = normalizeBeliefTension(state.beliefTension);
  if (beliefTension) {
    normalized.beliefTension = beliefTension;
  }

  if (state.homeNeutralization && typeof state.homeNeutralization === 'object') {
    normalized.homeNeutralization = state.homeNeutralization;
  }

  if (state.existence1 && typeof state.existence1 === 'object') {
    normalized.existence1 = state.existence1;
  }

  if (state.existence2 && typeof state.existence2 === 'object') {
    normalized.existence2 = state.existence2;
  }

  if (state.preconditionFilter && typeof state.preconditionFilter === 'object') {
    normalized.preconditionFilter = state.preconditionFilter;
  }

  if (state.preconditionBias && typeof state.preconditionBias === 'object') {
    normalized.preconditionBias = state.preconditionBias;
  }

  if (state.microSignals && typeof state.microSignals === 'object') {
    normalized.microSignals = state.microSignals;
  }

  if (state.decision && typeof state.decision === 'object') {
    normalized.decision = state.decision;
  }

  const hasValues =
    (normalized.field && Object.keys(normalized.field).length > 0) ||
    (normalized.reaction && Object.keys(normalized.reaction).length > 0) ||
    (normalized.stance && Object.keys(normalized.stance).length > 0) ||
    (normalized.permission && Object.keys(normalized.permission).length > 0) ||
    Boolean(normalized.makerSeed) ||
    Boolean(normalized.home) ||
    Boolean(normalized.existence) ||
    Boolean(normalized.beliefBranch) ||
    Boolean(normalized.beliefLeaf) ||
    Boolean(normalized.belief) ||
    Boolean(normalized.beliefCore) ||
    Boolean(normalized.beliefTension) ||
    Boolean(normalized.homeNeutralization) ||
    Boolean(normalized.existence1) ||
    Boolean(normalized.existence2) ||
    Boolean(normalized.preconditionFilter) ||
    Boolean(normalized.preconditionBias) ||
    Boolean(normalized.microSignals) ||
    Boolean(normalized.decision);

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

  const blended = {
    field: blendVector(prev.field, current.field),
    reaction: blendVector(prev.reaction, current.reaction),
    stance: blendVector(prev.stance, current.stance),
    permission: blendVector(prev.permission, current.permission),
  };

  // Always use current makerSeed (makerSeed is a constant foundation)
  if (current.makerSeed) {
    blended.makerSeed = current.makerSeed;
  }

  // Always use current home layer (home is regenerated fresh each time)
  if (current.home) {
    blended.home = current.home;
  }

  // Blend existence layer1; prefer current layer2 and belief layers
  if (prev.existence || current.existence) {
    blended.existence = {};
    const blendedLayer1 = blendVector(prev.existence?.layer1, current.existence?.layer1);
    if (current.existence?.layer1?.existenceHintKey) {
      blendedLayer1.existenceHintKey = current.existence.layer1.existenceHintKey;
    }
    if (current.existence?.layer1?.existenceHintText) {
      blendedLayer1.existenceHintText = current.existence.layer1.existenceHintText;
    }
    blended.existence.layer1 = blendedLayer1;
    blended.existence.layer2 = current.existence?.layer2 || prev.existence?.layer2 || null;
  }

  if (current.belief || prev.belief) {
    blended.belief = current.belief || prev.belief || null;
  }

  if (current.beliefBranch || prev.beliefBranch) {
    blended.beliefBranch = current.beliefBranch || prev.beliefBranch || null;
  }

  if (current.beliefLeaf || prev.beliefLeaf) {
    blended.beliefLeaf = current.beliefLeaf || prev.beliefLeaf || null;
  }

  // Always use current beliefCore (core beliefs are regenerated fresh each turn)
  if (current.beliefCore || prev.beliefCore) {
    blended.beliefCore = current.beliefCore || prev.beliefCore || null;
  }

  if (current.beliefTension || prev.beliefTension) {
    blended.beliefTension = current.beliefTension || prev.beliefTension || null;
  }

  if (current.homeNeutralization || prev.homeNeutralization) {
    blended.homeNeutralization = current.homeNeutralization || prev.homeNeutralization || null;
  }

  if (current.existence1 || prev.existence1) {
    blended.existence1 = current.existence1 || prev.existence1 || null;
  }

  if (current.existence2 || prev.existence2) {
    blended.existence2 = current.existence2 || prev.existence2 || null;
  }

  if (current.preconditionFilter || prev.preconditionFilter) {
    blended.preconditionFilter = current.preconditionFilter || prev.preconditionFilter || null;
  }

  if (current.preconditionBias || prev.preconditionBias) {
    blended.preconditionBias = current.preconditionBias || prev.preconditionBias || null;
  }

  if (current.microSignals || prev.microSignals) {
    blended.microSignals = current.microSignals || prev.microSignals || null;
  }

  if (current.decision || prev.decision) {
    blended.decision = current.decision || prev.decision || null;
  }

  return blended;
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
