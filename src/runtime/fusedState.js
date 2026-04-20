import { zeroMicroSignals } from './estimateMicroSignals.js';

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

const flattenSignals = (microSignals = {}) => ({
  assertion: clamp01(microSignals?.punctuation?.assertion),
  hesitation: clamp01(microSignals?.punctuation?.hesitation),
  trailOff: clamp01(microSignals?.punctuation?.trailOff),
  fillerDensity: clamp01(microSignals?.fillers?.fillerDensity),
  softNegation: clamp01(microSignals?.negationPrefix?.softNegation),
  burstiness: clamp01(microSignals?.sentenceLength?.burstiness),
  shortnessPressure: clamp01(microSignals?.sentenceLength?.shortnessPressure),
  epistemicLowering: clamp01(microSignals?.selfHedging?.epistemicLowering),
  distancing: clamp01(microSignals?.quotation?.distancing),
});

export const createInitialFusedState = () => ({
  lexical: createLexicalState(),
  signal: zeroMicroSignals(),
  fused: {
    hesitation: 0,
    guardedness: 0,
    reachability: 0,
    unfinishedPull: 0,
    selfSilencing: 0,
    pressure: 0,
    expressionTension: 0,
    ember: 0,
  },
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
    fused: {
      hesitation: clamp01((flattened.hesitation * 0.6) + (lexical.freeze * 0.4)),
      guardedness: clamp01(
        (flattened.softNegation * 0.25) +
        (flattened.distancing * 0.2) +
        (flattened.epistemicLowering * 0.1) +
        (lexical.fear * 0.25) +
        (lexical.shame * 0.2)
      ),
      reachability: clamp01(
        (lexical.reach * 0.45) +
        (lexical.desire * 0.25) +
        (flattened.trailOff * 0.1) +
        (flattened.assertion * 0.2)
      ),
      unfinishedPull: clamp01(
        (lexical.unfinished * 0.45) +
        (flattened.trailOff * 0.25) +
        (flattened.fillerDensity * 0.15) +
        (lexical.resignation * 0.15)
      ),
      selfSilencing: clamp01(
        (lexical.selfErasure * 0.45) +
        (lexical.shame * 0.2) +
        (flattened.epistemicLowering * 0.2) +
        (flattened.distancing * 0.15)
      ),
      pressure: clamp01(
        (lexical.fear * 0.25) +
        (lexical.freeze * 0.2) +
        (lexical.resignation * 0.15) +
        (flattened.burstiness * 0.25) +
        (flattened.shortnessPressure * 0.15)
      ),
      expressionTension: clamp01(
        (lexical.desire * 0.18) +
        (lexical.reach * 0.18) +
        (lexical.fear * 0.18) +
        (lexical.freeze * 0.16) +
        (flattened.hesitation * 0.15) +
        (flattened.trailOff * 0.15)
      ),
      ember: clamp01(
        (lexical.desire * 0.35) +
        (lexical.reach * 0.3) +
        (lexical.unfinished * 0.2) +
        (flattened.assertion * 0.15)
      ),
    },
  };
};
