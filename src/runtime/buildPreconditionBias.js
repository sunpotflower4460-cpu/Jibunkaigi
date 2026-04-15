const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const DERIVED_ONE_THREAD_WEIGHT = 0.65;
const HOME_KERNEL_ONE_THREAD_WEIGHT = 0.2;
const HOME_OUTPUT_ONE_THREAD_WEIGHT = 0.15;
const NO_OVER_EXPANSION_WEIGHT = 0.6;
const KEEP_ONE_THREAD_WEIGHT = 0.4;

const normalizeBeliefs = (beliefs) => {
  if (!Array.isArray(beliefs)) return [];

  return beliefs
    .filter((belief) => belief && typeof belief === 'object')
    .map((belief) => ({
      id: typeof belief.id === 'string' ? belief.id : '',
      axis: typeof belief.axis === 'string' ? belief.axis : '',
      weight: clamp01(belief.weight),
    }))
    .filter((belief) => belief.id || belief.axis);
};

const normalizeTraits = (traits) => {
  if (!Array.isArray(traits)) return [];

  return [...new Set(
    traits
      .filter((trait) => typeof trait === 'string')
      .map((trait) => trait.trim())
      .filter(Boolean)
  )];
};

const pickActiveAxes = (beliefs) => [...new Set(
  beliefs
    .filter((belief) => belief.weight > 0 && belief.axis)
    .map((belief) => belief.axis)
)];

export function buildPreconditionBias(preconditionFilter = {}) {
  const home = preconditionFilter?.home ?? {};
  const kernel = home?.kernel ?? {};
  const outputLimits = home?.outputLimits ?? {};
  const existence = preconditionFilter?.existence ?? {};
  const belief = preconditionFilter?.belief ?? {};
  const derived = preconditionFilter?.derived ?? {};

  const activeCoreBeliefs = normalizeBeliefs(belief.activeCoreBeliefs);
  const activeBranchBeliefs = normalizeBeliefs(belief.activeBranchBeliefs);
  const activeLeafBeliefs = normalizeBeliefs(belief.activeLeafBeliefs);

  const slowDown = clamp01(Math.max(kernel.slowDown ?? 0, derived.slowingBias ?? 0));
  const oneThreadBias = clamp01(
    ((derived.oneLivingThreadBias ?? 0) * DERIVED_ONE_THREAD_WEIGHT) +
    ((kernel.allowOneLivingThread ?? 0) * HOME_KERNEL_ONE_THREAD_WEIGHT) +
    ((outputLimits.keepOneThread ?? 0) * HOME_OUTPUT_ONE_THREAD_WEIGHT)
  );

  return {
    pacing: {
      slowDown,
      returnBias: clamp01(Math.max(kernel.returnBeforeOutput ?? 0, derived.returnBias ?? 0)),
    },
    focus: {
      oneThreadBias,
      antiOverExpansion: clamp01(
        ((outputLimits.noOverExpansion ?? 0) * NO_OVER_EXPANSION_WEIGHT) +
        ((outputLimits.keepOneThread ?? 0) * KEEP_ONE_THREAD_WEIGHT)
      ),
      keepOneThread: clamp01(outputLimits.keepOneThread),
    },
    meaning: {
      antiEarlySummary: clamp01(outputLimits.noEarlySummary),
      antiEarlySolution: clamp01(outputLimits.noEarlySolution),
      dominantBeliefAxis:
        typeof derived.dominantBeliefAxis === 'string'
          ? derived.dominantBeliefAxis
          : belief.dominantCoreAxis ?? belief.dominantBranchAxis ?? belief.dominantLeafAxis ?? null,
      activeCoreBeliefs,
      activeBranchBeliefs,
      activeLeafBeliefs,
      activeCoreAxes: pickActiveAxes(activeCoreBeliefs),
      activeBranchAxes: pickActiveAxes(activeBranchBeliefs),
      activeLeafAxes: pickActiveAxes(activeLeafBeliefs),
    },
    identity: {
      identityKey: typeof existence.agentIdentityKey === 'string' ? existence.agentIdentityKey : null,
      selfRememberingStrength: clamp01(existence.selfRememberingStrength),
      recalledTraits: normalizeTraits(existence.recalledSelfTraits),
      selfPresence: clamp01(existence.selfPresence),
      hereNowStability: clamp01(existence.hereNowStability),
      unfinishedAllowed: clamp01(existence.unfinishedAllowed),
      firstPersonSoftness: clamp01(existence.firstPersonSoftness),
    },
  };
}

export function buildPreconditionBiasPreview(preconditionBias = {}) {
  const pacing = preconditionBias?.pacing ?? {};
  const focus = preconditionBias?.focus ?? {};
  const meaning = preconditionBias?.meaning ?? {};
  const identity = preconditionBias?.identity ?? {};

  return {
    summary: `oneThread=${clamp01(focus.oneThreadBias).toFixed(2)} / slow=${clamp01(pacing.slowDown).toFixed(2)} / axis=${meaning.dominantBeliefAxis ?? 'none'}`,
    pacing: {
      slowDown: clamp01(pacing.slowDown),
      returnBias: clamp01(pacing.returnBias),
    },
    focus: {
      oneThreadBias: clamp01(focus.oneThreadBias),
      antiOverExpansion: clamp01(focus.antiOverExpansion),
    },
    meaning: {
      dominantBeliefAxis: typeof meaning.dominantBeliefAxis === 'string' ? meaning.dominantBeliefAxis : null,
      activeCoreAxes: Array.isArray(meaning.activeCoreAxes) ? [...meaning.activeCoreAxes] : [],
      activeBranchAxes: Array.isArray(meaning.activeBranchAxes) ? [...meaning.activeBranchAxes] : [],
    },
    identity: {
      identityKey: typeof identity.identityKey === 'string' ? identity.identityKey : null,
      selfRememberingStrength: clamp01(identity.selfRememberingStrength),
      recalledTraits: Array.isArray(identity.recalledTraits) ? [...identity.recalledTraits] : [],
    },
  };
}
