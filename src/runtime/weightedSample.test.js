import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSoftmaxWeights,
  weightedSample,
  weightedSampleIndex,
} from './weightedSample.js';

test('buildSoftmaxWeights sharpens the top score as tau gets smaller', () => {
  const scored = [
    { id: 'high', score: 2 },
    { id: 'mid', score: 1 },
    { id: 'low', score: 0 },
  ];

  const lowTau = buildSoftmaxWeights(scored, 0.5);
  const highTau = buildSoftmaxWeights(scored, 2);

  assert.ok(lowTau[0] > highTau[0]);
  assert.ok(lowTau[2] < highTau[2]);
  assert.equal(
    Number(lowTau.reduce((sum, weight) => sum + weight, 0).toFixed(6)),
    1,
  );
  assert.equal(
    Number(highTau.reduce((sum, weight) => sum + weight, 0).toFixed(6)),
    1,
  );
});

test('weightedSample follows cumulative weights and falls back to the last item', () => {
  const scored = [
    { id: 'high', score: 2 },
    { id: 'mid', score: 1 },
    { id: 'low', score: 0 },
  ];

  assert.equal(weightedSampleIndex(scored, 0.5, () => 0), 0);
  assert.equal(weightedSample(scored, 0.5, () => 0)?.id, 'high');
  assert.equal(weightedSample(scored, 0.5, () => 0.999999)?.id, 'low');
});
