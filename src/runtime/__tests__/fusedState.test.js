import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFusedState, createInitialFusedState } from '../fusedState.js';

const assertApprox = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${actual} to be close to ${expected}`);
};

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

  assertApprox(result.fused.hesitation, 0.68);
});

test('buildFusedState raises guardedness from fear, shame, and soft negation', () => {
  const result = buildFusedState({
    state: { fear: 0.7, shame: 0.4 },
    microSignals: {
      negationPrefix: { softNegation: 0.6 },
      quotation: { distancing: 0.5 },
    },
  });

  assertApprox(result.fused.guardedness, 0.505);
});

test('buildFusedState preserves reachability and ember from desire/reach/assertion', () => {
  const result = buildFusedState({
    state: { desire: 0.8, reach: 0.7, unfinished: 0.5 },
    microSignals: { punctuation: { assertion: 0.6 } },
  });

  assertApprox(result.fused.reachability, 0.635);
  assertApprox(result.fused.ember, 0.68);
});

test('buildFusedState converts trail off and filler density into unfinished pull', () => {
  const result = buildFusedState({
    state: { unfinished: 0.6, resignation: 0.3 },
    microSignals: {
      punctuation: { trailOff: 0.8 },
      fillers: { fillerDensity: 0.4 },
    },
  });

  assertApprox(result.fused.unfinishedPull, 0.575);
});

test('buildFusedState lifts self silencing from self erasure, hedging, and distancing', () => {
  const result = buildFusedState({
    state: { selfErasure: 0.8, shame: 0.5 },
    microSignals: {
      selfHedging: { epistemicLowering: 0.7 },
      quotation: { distancing: 0.6 },
    },
  });

  assertApprox(result.fused.selfSilencing, 0.69);
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
