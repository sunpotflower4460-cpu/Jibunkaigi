import test from 'node:test';
import assert from 'node:assert/strict';

import { runCrystallizationRuntime } from '../runCrystallizationRuntime.js';

test('runCrystallizationRuntime keeps source differences inside the same stage order', () => {
  const internalResult = runCrystallizationRuntime('しんどいけど、まだ終わりたくない', { source: 'internal_mock' });
  const apiResult = runCrystallizationRuntime('しんどいけど、まだ終わりたくない', { source: 'google' });

  assert.deepEqual(internalResult.stageOrder, apiResult.stageOrder);
  assert.equal(internalResult.stageOrder[0], 'source_boot');
  assert.equal(internalResult.stageOrder[8], 'self_decision');
  assert.equal(internalResult.stageOrder[9], 'utterance');
  assert.equal(internalResult.debugInfo.source, 'internal_mock');
  assert.equal(apiResult.debugInfo.source, 'google');
});
