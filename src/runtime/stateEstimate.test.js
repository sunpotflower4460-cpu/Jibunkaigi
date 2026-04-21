import test from 'node:test';
import assert from 'node:assert/strict';

import { estimateState } from './stateEstimate.js';

test('estimateState captures resignation and freeze from lost motivation phrasing', () => {
  const result = estimateState('意欲が湧かなくて困っています');

  assert.ok(result.resignation > 0.2, 'resignation should rise for lost motivation');
  assert.ok(result.freeze > 0.1, 'freeze should rise for lost motivation');
});
