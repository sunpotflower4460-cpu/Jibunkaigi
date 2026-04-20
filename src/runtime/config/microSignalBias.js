const safeNumber = (value) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

export const MICRO_SIGNAL_BIAS_MAX_DELTA = 0.15;

export const MICRO_SIGNAL_BIAS_MAP = {
  hesitation: {
    path: ['punctuation', 'hesitation'],
    layers: {
      field: { fragility: 0.15 },
      reaction: { holdBackJudgment: 0.12 },
    },
  },
  trailOff: {
    path: ['punctuation', 'trailOff'],
    layers: {
      reaction: { touched: 0.12 },
      stance: { receive: 0.15 },
    },
  },
  fillerDensity: {
    path: ['fillers', 'fillerDensity'],
    layers: {
      field: { softness: 0.1 },
      stance: { structure: -0.12 },
    },
  },
  softNegation: {
    path: ['negationPrefix', 'softNegation'],
    layers: {
      reaction: { protect: 0.1 },
      stance: { illuminate: 0.1 },
    },
  },
  burstiness: {
    path: ['sentenceLength', 'burstiness'],
    layers: {
      field: { urgency: 0.15 },
    },
  },
  distancing: {
    path: ['quotation', 'distancing'],
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

export const getMicroSignalValue = (microSignals = {}, signalKey = '') => {
  const path = MICRO_SIGNAL_BIAS_MAP[signalKey]?.path;
  if (!Array.isArray(path) || path.length !== 2) return 0;
  return safeNumber(microSignals?.[path[0]]?.[path[1]]);
};
