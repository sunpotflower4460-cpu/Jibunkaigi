import test from 'node:test';
import assert from 'node:assert/strict';

import { estimateField } from './fieldEstimator.js';

test('estimateField deepens existential meaning-loss phrasing', () => {
  const result = estimateField('何のために働いているのか分からなくなる');

  assert.ok(result.depth > 0.3, 'depth should rise for meaning-loss input');
});
