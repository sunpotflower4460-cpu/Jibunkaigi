import test from 'node:test';
import assert from 'node:assert/strict';

import { runInternalOS } from './runInternalOS.js';

const EXPECTED_KEYS = {
  field: ['softness', 'depth', 'urgency', 'fragility', 'playfulness'],
  reaction: ['touched', 'protect', 'clarify', 'curiosity', 'holdBackJudgment'],
  stance: ['receive', 'illuminate', 'structure', 'guard', 'nudge'],
  permission: ['noHurry', 'noOverExplain', 'noPerformativeHelpfulness', 'allowPartialUncertainty'],
};

const assertNumericShape = (result) => {
  assert.ok(result);
  assert.ok(result.latentState);

  for (const [section, keys] of Object.entries(EXPECTED_KEYS)) {
    assert.ok(result.latentState[section]);

    for (const key of keys) {
      assert.equal(typeof result.latentState[section][key], 'number');
      assert.ok(Number.isFinite(result.latentState[section][key]));
      assert.ok(result.latentState[section][key] >= 0);
      assert.ok(result.latentState[section][key] <= 1);
    }
  }

  assert.ok(Array.isArray(result.surfaceWindow));
  assert.ok(result.surfaceWindow.length >= 2);
  assert.ok(result.surfaceWindow.length <= 5);

  for (const line of result.surfaceWindow) {
    assert.equal(typeof line, 'string');
    assert.ok(line.length > 0);
  }

  assert.equal(result.debugInfo.version, 'pr1-minimum-os');
};

for (const input of [
  'やりたいのに動けない',
  '最近ちょっと自信ない',
  '作品を出したいけど怖い',
  'もう無理で諦めたい',
]) {
  test(`runInternalOS returns stable minimum shape for: ${input}`, () => {
    assertNumericShape(runInternalOS(input));
  });
}

test('runInternalOS stays stable for undefined and null input', () => {
  assertNumericShape(runInternalOS(undefined));
  assertNumericShape(runInternalOS(null));
});
