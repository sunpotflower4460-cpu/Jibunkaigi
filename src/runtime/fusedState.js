import { zeroMicroSignals } from './estimateMicroSignals.js';
import {
  FUSED_STATE_METRIC_WEIGHTS,
  MICRO_SIGNAL_SOURCE_PATHS,
  getMicroSignalValue,
} from './config/microSignalBias.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const createLexicalState = () => ({
  desire: 0,
  fear: 0,
  freeze: 0,
  reach: 0,
  resignation: 0,
  selfErasure: 0,
  shame: 0,
  unfinished: 0,
});

const flattenSignals = (microSignals = {}) => Object.fromEntries(
  Object.keys(MICRO_SIGNAL_SOURCE_PATHS).map((signalKey) => [
    signalKey,
    clamp01(getMicroSignalValue(microSignals, signalKey)),
  ])
);

const buildWeightedMetric = ({ lexical = {}, flattened = {}, weights = {} }) => {
  const lexicalScore = Object.entries(weights.lexical ?? {}).reduce(
    (sum, [key, weight]) => sum + (clamp01(lexical[key]) * weight),
    0,
  );
  const signalScore = Object.entries(weights.signal ?? {}).reduce(
    (sum, [key, weight]) => sum + (clamp01(flattened[key]) * weight),
    0,
  );

  return clamp01(lexicalScore + signalScore);
};

export const createInitialFusedState = () => ({
  lexical: createLexicalState(),
  signal: zeroMicroSignals(),
  fused: Object.fromEntries(
    Object.keys(FUSED_STATE_METRIC_WEIGHTS).map((metricKey) => [metricKey, 0])
  ),
});

export const buildFusedState = ({ state = {}, microSignals = {} } = {}) => {
  const lexical = {
    ...createLexicalState(),
    ...Object.fromEntries(
      Object.entries(state || {}).map(([key, value]) => [key, clamp01(value)])
    ),
  };
  const signal = {
    ...zeroMicroSignals(),
    ...microSignals,
    punctuation: {
      ...zeroMicroSignals().punctuation,
      ...(microSignals?.punctuation ?? {}),
    },
    fillers: {
      ...zeroMicroSignals().fillers,
      ...(microSignals?.fillers ?? {}),
    },
    negationPrefix: {
      ...zeroMicroSignals().negationPrefix,
      ...(microSignals?.negationPrefix ?? {}),
    },
    sentenceLength: {
      ...zeroMicroSignals().sentenceLength,
      ...(microSignals?.sentenceLength ?? {}),
    },
    selfHedging: {
      ...zeroMicroSignals().selfHedging,
      ...(microSignals?.selfHedging ?? {}),
    },
    quotation: {
      ...zeroMicroSignals().quotation,
      ...(microSignals?.quotation ?? {}),
    },
  };
  const flattened = flattenSignals(signal);

  return {
    lexical,
    signal,
    fused: Object.fromEntries(
      Object.entries(FUSED_STATE_METRIC_WEIGHTS).map(([metricKey, weights]) => [
        metricKey,
        buildWeightedMetric({ lexical, flattened, weights }),
      ])
    ),
  };
};
