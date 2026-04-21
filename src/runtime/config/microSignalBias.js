const safeNumber = (value) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

export const MICRO_SIGNAL_SOURCE_PATHS = {
  assertion: ['punctuation', 'assertion'],
  hesitation: ['punctuation', 'hesitation'],
  trailOff: ['punctuation', 'trailOff'],
  fillerDensity: ['fillers', 'fillerDensity'],
  softNegation: ['negationPrefix', 'softNegation'],
  burstiness: ['sentenceLength', 'burstiness'],
  shortnessPressure: ['sentenceLength', 'shortnessPressure'],
  epistemicLowering: ['selfHedging', 'epistemicLowering'],
  distancing: ['quotation', 'distancing'],
};

export const MICRO_SIGNAL_BIAS_MAX_DELTA = 0.15;

export const MICRO_SIGNAL_BIAS_MAP = {
  hesitation: {
    path: MICRO_SIGNAL_SOURCE_PATHS.hesitation,
    layers: {
      field: { fragility: 0.15 },
      reaction: { holdBackJudgment: 0.12 },
    },
  },
  trailOff: {
    path: MICRO_SIGNAL_SOURCE_PATHS.trailOff,
    layers: {
      reaction: { touched: 0.12 },
      stance: { receive: 0.15 },
    },
  },
  fillerDensity: {
    path: MICRO_SIGNAL_SOURCE_PATHS.fillerDensity,
    layers: {
      field: { softness: 0.1 },
      stance: { structure: -0.12 },
    },
  },
  softNegation: {
    path: MICRO_SIGNAL_SOURCE_PATHS.softNegation,
    layers: {
      reaction: { protect: 0.1 },
      stance: { illuminate: 0.1 },
    },
  },
  burstiness: {
    path: MICRO_SIGNAL_SOURCE_PATHS.burstiness,
    layers: {
      field: { urgency: 0.15 },
    },
  },
  distancing: {
    path: MICRO_SIGNAL_SOURCE_PATHS.distancing,
    layers: {
      reaction: { holdBackJudgment: 0.1 },
    },
  },
};

export const JOE_REENTRY_MICRO_SIGNAL_TAG_BIAS = {
  hesitation: { freeze: 0.12, unfinished: 0.08 },
  trailOff: { unfinished: 0.12, reach: 0.05 },
  fillerDensity: { unfinished: 0.06, freeze: 0.04 },
  softNegation: { fear: 0.07, shame: 0.05 },
  burstiness: { desire: 0.06, reach: 0.04 },
  distancing: { freeze: 0.08, fear: 0.06 },
};

export const FUSED_STATE_METRIC_WEIGHTS = {
  hesitation: {
    lexical: { freeze: 0.4 },
    signal: { hesitation: 0.6 },
  },
  guardedness: {
    lexical: { fear: 0.25, shame: 0.2 },
    signal: { softNegation: 0.25, distancing: 0.2, epistemicLowering: 0.1 },
  },
  reachability: {
    lexical: { reach: 0.45, desire: 0.25 },
    signal: { trailOff: 0.1, assertion: 0.2 },
  },
  unfinishedPull: {
    lexical: { unfinished: 0.45, resignation: 0.15 },
    signal: { trailOff: 0.25, fillerDensity: 0.15 },
  },
  selfSilencing: {
    lexical: { selfErasure: 0.45, shame: 0.2 },
    signal: { epistemicLowering: 0.2, distancing: 0.15 },
  },
  pressure: {
    lexical: { fear: 0.25, freeze: 0.2, resignation: 0.15 },
    signal: { burstiness: 0.25, shortnessPressure: 0.15 },
  },
  expressionTension: {
    lexical: { desire: 0.18, reach: 0.18, fear: 0.18, freeze: 0.16 },
    signal: { hesitation: 0.15, trailOff: 0.15 },
  },
  ember: {
    lexical: { desire: 0.35, reach: 0.3, unfinished: 0.2 },
    signal: { assertion: 0.15 },
  },
};

export const PROTO_MEANING_THRESHOLDS = {
  light: 0.3,
  moderate: 0.35,
  sensorySelfSilencing: 0.5,
  narrativeHesitationSupport: 0.2,
  narrativeResignationSupport: 0.2,
  narrativeReachabilitySupport: 0.2,
  narrativeUnfinishedSupport: 0.2,
};

export const PROTO_MEANING_BLEND_WEIGHTS = {
  expressiveHesitation: {
    fused: { ember: 0.55, hesitation: 0.45 },
  },
  resignationPull: {
    lexical: { resignation: 0.3 },
    fused: { unfinishedPull: 0.7 },
  },
  guardedReach: {
    fused: { guardedness: 0.5, reachability: 0.5 },
  },
  pressureHolding: {
    fused: { pressure: 0.6, ember: 0.4 },
  },
  unfinishedReach: {
    lexical: { unfinished: 0.55, reach: 0.45 },
  },
};

export const PROTO_MEANING_CONTEXT_BIAS = {
  holdingOrPresenceNarrative: 0.42,
  illuminationNarrative: 0.4,
  preverbalNarrative: 0.44,
  creativeEmberNarrative: 0.43,
};

export const PROTO_MEANING_KEYWORD_BIAS = {
  discomfortSensory: 0.46,
  brittleSensory: 0.47,
  socialGazeSensory: 0.49,
};

export const PROTO_MEANING_MAX_CANDIDATES = 4;

export const MICRO_SIGNAL_TUNING_DEBUG_CONFIG = {
  bias: {
    maxDelta: MICRO_SIGNAL_BIAS_MAX_DELTA,
    sourcePaths: MICRO_SIGNAL_SOURCE_PATHS,
    layerBiases: MICRO_SIGNAL_BIAS_MAP,
  },
  fusedState: {
    sourcePaths: MICRO_SIGNAL_SOURCE_PATHS,
    metricWeights: FUSED_STATE_METRIC_WEIGHTS,
  },
  protoMeaning: {
    thresholds: PROTO_MEANING_THRESHOLDS,
    blendWeights: PROTO_MEANING_BLEND_WEIGHTS,
    contextBias: PROTO_MEANING_CONTEXT_BIAS,
    keywordBias: PROTO_MEANING_KEYWORD_BIAS,
    maxCandidates: PROTO_MEANING_MAX_CANDIDATES,
  },
};

export const getMicroSignalValue = (microSignals = {}, signalKey = '') => {
  const path = MICRO_SIGNAL_SOURCE_PATHS[signalKey] ?? MICRO_SIGNAL_BIAS_MAP[signalKey]?.path;
  if (!Array.isArray(path) || path.length !== 2) return 0;
  return safeNumber(microSignals?.[path[0]]?.[path[1]]);
};
