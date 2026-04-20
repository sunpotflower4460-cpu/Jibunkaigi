import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFusedState, createInitialFusedState } from '../fusedState.js';

test('createInitialFusedState returns zeroed shape', () => {
  const result = createInitialFusedState();

  assert.deepEqual(result.lexical, {
    desire: 0,
    fear: 0,
    freeze: 0,
    reach: 0,
    resignation: 0,
    selfErasure: 0,
    shame: 0,
    unfinished: 0,
  });
  assert.equal(result.signal.punctuation.hesitation, 0);
  assert.equal(result.fused.ember, 0);
});

test('buildFusedState fuses hesitation from punctuation and freeze', () => {
  const result = buildFusedState({
    state: { freeze: 0.5 },
    microSignals: { punctuation: { hesitation: 0.8 } },
  });

  assert.equal(result.fused.hesitation, 0.68);
});

test('buildFusedState raises guardedness from fear, shame, and soft negation', () => {
  const result = buildFusedState({
    state: { fear: 0.7, shame: 0.4 },
    microSignals: {
      negationPrefix: { softNegation: 0.6 },
      quotation: { distancing: 0.5 },
    },
  });

  assert.equal(result.fused.guardedness, 0.475);
});

test('buildFusedState preserves reachability and ember from desire/reach/assertion', () => {
  const result = buildFusedState({
    state: { desire: 0.8, reach: 0.7, unfinished: 0.5 },
    microSignals: { punctuation: { assertion: 0.6 } },
  });

  assert.equal(result.fused.reachability, 0.595);
  assert.equal(result.fused.ember, 0.665);
});

test('buildFusedState converts trail off and filler density into unfinished pull', () => {
  const result = buildFusedState({
    state: { unfinished: 0.6, resignation: 0.3 },
    microSignals: {
      punctuation: { trailOff: 0.8 },
      fillers: { fillerDensity: 0.4 },
    },
  });

  assert.equal(result.fused.unfinishedPull, 0.53);
});

test('buildFusedState lifts self silencing from self erasure, hedging, and distancing', () => {
  const result = buildFusedState({
    state: { selfErasure: 0.8, shame: 0.5 },
    microSignals: {
      selfHedging: { epistemicLowering: 0.7 },
      quotation: { distancing: 0.6 },
    },
  });

  assert.equal(result.fused.selfSilencing, 0.665);
});

test('buildFusedState clamps pressure and expression tension to 1', () => {
  const result = buildFusedState({
    state: { fear: 1, freeze: 1, resignation: 1, desire: 1, reach: 1 },
    microSignals: {
      punctuation: { hesitation: 1, trailOff: 1 },
      sentenceLength: { burstiness: 1, shortnessPressure: 1 },
    },
  });

  assert.equal(result.fused.pressure, 1);
  assert.equal(result.fused.expressionTension, 1);
});
