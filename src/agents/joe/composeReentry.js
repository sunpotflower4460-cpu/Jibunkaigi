import {
  getMicroSignalValue,
  JOE_REENTRY_MICRO_SIGNAL_TAG_BIAS,
} from '../../runtime/config/microSignalBias.js';
import {
  buildReentryText,
  JOE_REENTRY_PART_CORPUS,
  JOE_REENTRY_PART_LABELS,
  JOE_REENTRY_PART_ORDER,
  REENTRY_VARIANTS,
} from './reentryCorpus.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const normalizeRecord = (value) => (value && typeof value === 'object' ? value : {});

const normalizeJoeReentryInput = (input = {}) => ({
  state: normalizeRecord(input.state),
  microSignals: normalizeRecord(input.microSignals),
  beliefTension: input.beliefTension && typeof input.beliefTension === 'object' ? input.beliefTension : null,
  afterglowSeed: input.afterglowSeed && typeof input.afterglowSeed === 'object' ? input.afterglowSeed : null,
  othersField: Array.isArray(input.othersField) ? input.othersField : [],
});

const applyMicroSignalTagBias = (state = {}, microSignals = {}) => {
  const derivedState = { ...state };

  Object.entries(JOE_REENTRY_MICRO_SIGNAL_TAG_BIAS).forEach(([signalKey, tagWeights]) => {
    const intensity = clamp01(getMicroSignalValue(microSignals, signalKey));
    if (intensity <= 0) return;

    Object.entries(tagWeights).forEach(([tag, weight]) => {
      derivedState[tag] = clamp01((derivedState[tag] ?? 0) + (intensity * (Number(weight) || 0)));
    });
  });

  return derivedState;
};

const mergeVectors = (...vectors) => {
  const merged = {};

  vectors.forEach((vector) => {
    Object.entries(normalizeRecord(vector)).forEach(([key, value]) => {
      merged[key] = Math.max(clamp01(value), merged[key] ?? 0);
    });
  });

  return merged;
};

const getTopInputs = (vector = {}, limit = 5) => Object.entries(vector)
  .filter(([, value]) => clamp01(value) > 0)
  .sort((a, b) => b[1] - a[1])
  .slice(0, limit)
  .map(([tag, value]) => ({ tag, value: clamp01(value) }));

const cosineSimilarity = (vector = {}, tags = []) => {
  const uniqueTags = Array.from(new Set(Array.isArray(tags) ? tags : []));
  if (!uniqueTags.length) return 0;

  const dot = uniqueTags.reduce((sum, tag) => sum + clamp01(vector[tag] ?? 0), 0);
  const magnitudeVector = Math.sqrt(
    Object.values(vector).reduce((sum, value) => sum + (clamp01(value) ** 2), 0),
  );
  const magnitudeCandidate = Math.sqrt(uniqueTags.length);

  if (magnitudeVector === 0 || magnitudeCandidate === 0) return 0;
  return dot / (magnitudeVector * magnitudeCandidate);
};

const tagMatchScore = (vector = {}, tags = []) => {
  const uniqueTags = Array.from(new Set(Array.isArray(tags) ? tags : []));
  if (!uniqueTags.length) return 0;
  return uniqueTags.reduce((sum, tag) => sum + clamp01(vector[tag] ?? 0), 0) / uniqueTags.length;
};

const scoreCorpusCandidate = (candidate, vector = {}) => {
  const tagScore = tagMatchScore(vector, candidate?.tags);
  const cosine = cosineSimilarity(vector, candidate?.tags);
  return {
    ...candidate,
    score: (tagScore * 0.65) + (cosine * 0.35),
    tagScore,
    cosineSimilarity: cosine,
  };
};

const getTensionStrength = (beliefTension, tensionType) => {
  const tensions = Array.isArray(beliefTension?.activeTensions) ? beliefTension.activeTensions : [];
  return tensions
    .filter((entry) => entry?.tensionType === tensionType)
    .reduce((max, entry) => Math.max(max, clamp01(entry?.strength ?? 0)), 0);
};

const deriveObservationVector = (state = {}, microSignals = {}) => {
  const hesitation = clamp01(getMicroSignalValue(microSignals, 'hesitation'));
  const trailOff = clamp01(getMicroSignalValue(microSignals, 'trailOff'));

  return mergeVectors(state, {
    receive: Math.max(hesitation, trailOff, clamp01(state.freeze ?? 0), clamp01(state.fear ?? 0) * 0.8),
    fragile: Math.max(clamp01(state.fear ?? 0), clamp01(state.shame ?? 0), clamp01(state.unfinished ?? 0)),
    trace: Math.max(clamp01(state.unfinished ?? 0), clamp01(state.reach ?? 0)),
    alive: Math.max(clamp01(state.desire ?? 0), clamp01(state.reach ?? 0), clamp01(state.unfinished ?? 0) * 0.6),
    density: Math.max(clamp01(state.freeze ?? 0), clamp01(state.shame ?? 0)),
    hesitation,
  });
};

const deriveJudgmentVector = (state = {}, beliefTension = null) => {
  const friction = getTensionStrength(beliefTension, 'friction');
  const violation = getTensionStrength(beliefTension, 'violation');
  const pull = getTensionStrength(beliefTension, 'pull');
  const protection = getTensionStrength(beliefTension, 'protection');
  const totalTensionStrength = clamp01(beliefTension?.totalTensionStrength ?? 0);

  return mergeVectors(state, {
    holdBack: Math.max(totalTensionStrength, friction, protection),
    nonClosure: Math.max(protection, pull, clamp01(state.unfinished ?? 0)),
    avoidAssertion: Math.max(friction, violation, clamp01(state.fear ?? 0) * 0.7, clamp01(state.shame ?? 0)),
    antiPerformance: Math.max(clamp01(state.shame ?? 0), violation),
    touch: Math.max(pull, clamp01(state.reach ?? 0), clamp01(state.desire ?? 0) * 0.7),
    restraint: Math.max(totalTensionStrength, clamp01(state.freeze ?? 0)),
  });
};

const countMatchingEntries = (othersField = [], predicate) => othersField.reduce(
  (count, entry) => (predicate(entry) ? count + 1 : count),
  0,
);

const deriveOutputConstraintVector = (afterglowSeed = null, othersField = []) => {
  const previousLatentState = afterglowSeed?.previousLatentState && typeof afterglowSeed.previousLatentState === 'object'
    ? afterglowSeed.previousLatentState
    : {};
  const previousMixSelected = Array.isArray(afterglowSeed?.previousMix?.selected)
    ? afterglowSeed.previousMix.selected
    : [];
  const structurePressure = countMatchingEntries(
    othersField,
    (entry) => entry?.agentId === 'ken'
      || entry?.toneTags?.includes('structural')
      || entry?.forceTags?.includes('clarify')
      || entry?.forceTags?.includes('ground')
      || /構造|整理/.test(entry?.gist || ''),
  );
  const holdingPressure = countMatchingEntries(
    othersField,
    (entry) => entry?.toneTags?.includes('holding')
      || entry?.toneTags?.includes('soft')
      || entry?.forceTags?.includes('hold')
      || entry?.forceTags?.includes('slow-down'),
  );
  const feelingMixWeight = previousMixSelected
    .filter((item) => item?.group === 'feeling' || item?.group === 'move')
    .reduce((sum, item) => sum + clamp01(item?.weight ?? 0), 0);
  const thoughtMixWeight = previousMixSelected
    .filter((item) => item?.group === 'thought')
    .reduce((sum, item) => sum + clamp01(item?.weight ?? 0), 0);

  return {
    receive: Math.max(
      clamp01(previousLatentState?.stance?.receive ?? 0),
      clamp01(previousLatentState?.reaction?.protect ?? 0),
      clamp01(holdingPressure / 2),
    ),
    touch: Math.max(
      clamp01(previousLatentState?.reaction?.touched ?? 0),
      clamp01(feelingMixWeight / 1.5),
    ),
    outline: Math.max(
      clamp01(previousLatentState?.reaction?.holdBackJudgment ?? 0),
      clamp01(previousLatentState?.stance?.illuminate ?? 0),
    ),
    density: Math.max(
      clamp01(feelingMixWeight / 1.5),
      clamp01(previousLatentState?.field?.fragility ?? 0),
    ),
    structureAvoid: Math.max(
      clamp01(structurePressure / 2),
      clamp01(previousLatentState?.stance?.receive ?? 0) * 0.6,
    ),
    imageryLimit: Math.max(
      clamp01(structurePressure / 2),
      clamp01(previousLatentState?.stance?.structure ?? 0) * 0.5,
      clamp01(thoughtMixWeight / 2),
    ),
    restraint: Math.max(
      clamp01(previousLatentState?.stance?.guard ?? 0),
      clamp01(previousLatentState?.reaction?.holdBackJudgment ?? 0),
    ),
    antiPerformance: clamp01(structurePressure / 2),
  };
};

const selectPartCandidate = (partKey, vector, providedCorpus = null) => {
  const fallbackCorpus = JOE_REENTRY_PART_CORPUS[partKey] || [];
  const providedCorpusWasEmpty = Array.isArray(providedCorpus) && providedCorpus.length === 0;
  const activeCorpus = Array.isArray(providedCorpus) && providedCorpus.length > 0
    ? providedCorpus
    : fallbackCorpus;
  const corpusToScore = activeCorpus.length > 0 ? activeCorpus : fallbackCorpus;
  const scored = corpusToScore
    .map((candidate) => scoreCorpusCandidate(candidate, vector))
    .sort((a, b) => b.score - a.score);
  const selected = scored[0] || scoreCorpusCandidate(fallbackCorpus[0], vector);

  return {
    label: JOE_REENTRY_PART_LABELS[partKey],
    input: getTopInputs(vector),
    selected: {
      ...selected,
      score: clamp01(selected?.score ?? 0),
      tagScore: clamp01(selected?.tagScore ?? 0),
      cosineSimilarity: clamp01(selected?.cosineSimilarity ?? 0),
    },
    fallbackUsed: providedCorpusWasEmpty || !scored.length,
  };
};

const buildOverallCandidates = (selected, mergedVector) => {
  const scoredVariants = REENTRY_VARIANTS
    .map((variant) => scoreCorpusCandidate(variant, mergedVector))
    .sort((a, b) => b.score - a.score)
    .map((candidate, index, array) => {
      const totalScore = array.reduce((sum, item) => sum + item.score, 0) || 1;
      return {
        ...candidate,
        weight: candidate.score / totalScore,
        selected: false,
        breakdown: getTopInputs(mergeVectors(
          ...candidate.tags.map((tag) => ({ [tag]: mergedVector[tag] ?? 0 })),
        ), 6),
      };
    });

  return [
    {
      ...selected,
      weight: 1,
      selected: true,
    },
    ...scoredVariants,
  ];
};

export const composeJoeReentry = (input = {}, options = {}) => {
  const {
    state,
    microSignals,
    beliefTension,
    afterglowSeed,
    othersField,
  } = normalizeJoeReentryInput(input);
  const biasedState = applyMicroSignalTagBias(state, microSignals);
  const corpusOverride = options.corpus && typeof options.corpus === 'object' ? options.corpus : {};

  const observation = selectPartCandidate(
    'observation',
    deriveObservationVector(biasedState, microSignals),
    corpusOverride.observation,
  );
  const judgment = selectPartCandidate(
    'judgment',
    deriveJudgmentVector(biasedState, beliefTension),
    corpusOverride.judgment,
  );
  const outputConstraint = selectPartCandidate(
    'outputConstraint',
    deriveOutputConstraintVector(afterglowSeed, othersField),
    corpusOverride.outputConstraint,
  );

  const orderedParts = {
    observation: observation.selected,
    judgment: judgment.selected,
    outputConstraint: outputConstraint.selected,
  };
  const finalText = buildReentryText(orderedParts);
  const mergedVector = mergeVectors(
    Object.fromEntries(observation.input.map(({ tag, value }) => [tag, value])),
    Object.fromEntries(judgment.input.map(({ tag, value }) => [tag, value])),
    Object.fromEntries(outputConstraint.input.map(({ tag, value }) => [tag, value])),
  );
  const selectedTags = Array.from(new Set(
    JOE_REENTRY_PART_ORDER.flatMap((partKey) => orderedParts[partKey]?.tags || []),
  ));
  const selected = {
    text: finalText,
    tags: selectedTags,
    score: clamp01(
      (observation.selected.score + judgment.selected.score + outputConstraint.selected.score) / 3,
    ),
    breakdown: getTopInputs(mergedVector, 6),
    composition: {
      parts: [observation, judgment, outputConstraint],
      finalText,
      fallbackUsed: observation.fallbackUsed || judgment.fallbackUsed || outputConstraint.fallbackUsed,
    },
  };

  return {
    selected,
    allCandidates: buildOverallCandidates(selected, mergedVector),
  };
};
