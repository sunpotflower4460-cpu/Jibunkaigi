// src/runtime/textPipeline/tests/buildBodySignals.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBodySignals } from '../buildBodySignals.js';

test('buildBodySignals: external signals from calm field', () => {
  const input = {
    field: {
      urgency: 0.2,
      fragility: 0.3,
      softness: 0.7,
      playfulness: 0.5,
    },
    beliefTension: {
      totalTensionStrength: 0.1,
    },
    previousLatentState: {
      stance: { guard: 0.2 },
      reaction: { holdBackJudgment: 0.3 },
    },
  };

  const result = buildBodySignals(input);

  assert.ok(result.external, 'external should exist');
  assert.ok(result.internal, 'internal should exist');

  // External should reflect calm field (low urgency, low fragility)
  assert.ok(result.external.tension < 0.5, 'external tension should be low');
  assert.ok(result.external.softness > 0.5, 'external softness should be high');
  assert.ok(result.external.urgency < 0.5, 'external urgency should be low');

  // Internal should reflect low tension
  assert.ok(result.internal.tension < 0.5, 'internal tension should be low');
});

test('buildBodySignals: external calm but internal tense (mismatch pattern 1)', () => {
  const input = {
    field: {
      urgency: 0.2,
      fragility: 0.2,
      softness: 0.8,
      playfulness: 0.6,
    },
    beliefTension: {
      totalTensionStrength: 0.8,
    },
    previousLatentState: {
      stance: { guard: 0.7 },
      reaction: { holdBackJudgment: 0.6 },
    },
  };

  const result = buildBodySignals(input);

  // External: calm
  const externalTension = (result.external.tension + result.external.urgency) / 2;
  assert.ok(externalTension < 0.4, 'external should be calm');

  // Internal: tense
  const internalTension = (result.internal.tension + result.internal.contraction) / 2;
  assert.ok(internalTension > 0.6, 'internal should be tense');

  // Mismatch should be significant
  const mismatch = internalTension - externalTension;
  assert.ok(mismatch > 0.3, 'mismatch should be significant');
});

test('buildBodySignals: external tense but internal calm (mismatch pattern 2)', () => {
  const input = {
    field: {
      urgency: 0.9,
      fragility: 0.8,
      softness: 0.2,
      playfulness: 0.1,
    },
    beliefTension: {
      totalTensionStrength: 0.1,
    },
    previousLatentState: {
      stance: { guard: 0.2 },
      reaction: { holdBackJudgment: 0.2 },
    },
  };

  const result = buildBodySignals(input);

  // External: tense
  const externalTension = (result.external.tension + result.external.urgency) / 2;
  assert.ok(externalTension > 0.6, 'external should be tense');

  // Internal: calm
  const internalTension = (result.internal.tension + result.internal.contraction) / 2;
  assert.ok(internalTension < 0.4, 'internal should be calm');

  // Mismatch should be significant
  const mismatch = externalTension - internalTension;
  assert.ok(mismatch > 0.3, 'mismatch should be significant');
});

test('buildBodySignals: aligned tension (both tense)', () => {
  const input = {
    field: {
      urgency: 0.8,
      fragility: 0.7,
      softness: 0.2,
      playfulness: 0.1,
    },
    beliefTension: {
      totalTensionStrength: 0.7,
    },
    previousLatentState: {
      stance: { guard: 0.8 },
      reaction: { holdBackJudgment: 0.7 },
    },
  };

  const result = buildBodySignals(input);

  // Both should be tense
  const externalTension = (result.external.tension + result.external.urgency) / 2;
  const internalTension = (result.internal.tension + result.internal.contraction) / 2;

  assert.ok(externalTension > 0.6, 'external should be tense');
  assert.ok(internalTension > 0.6, 'internal should be tense');

  // Mismatch should be small
  const mismatch = Math.abs(externalTension - internalTension);
  assert.ok(mismatch < 0.3, 'mismatch should be small');
});

test('buildBodySignals: handles missing previousLatentState', () => {
  const input = {
    field: {
      urgency: 0.5,
      fragility: 0.5,
      softness: 0.5,
      playfulness: 0.5,
    },
    beliefTension: {
      totalTensionStrength: 0.5,
    },
  };

  const result = buildBodySignals(input);

  assert.ok(result.external, 'external should exist');
  assert.ok(result.internal, 'internal should exist');
  assert.ok(typeof result.internal.tension === 'number', 'internal tension should be number');
});
