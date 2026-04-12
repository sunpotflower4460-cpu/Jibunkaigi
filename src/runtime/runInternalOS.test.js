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

  assert.ok(result.patternMix);
  assert.ok(Array.isArray(result.patternMix.selected));
  assert.ok(result.patternMix.selected.length >= 3);
  assert.ok(result.patternMix.selected.length <= 5);
  assert.equal(typeof result.patternMix.dominant, 'string');
  assert.equal(result.patternMix.dominant, result.patternMix.selected[0].id);

  const distinctGroups = new Set();
  let weightTotal = 0;

  for (const item of result.patternMix.selected) {
    assert.equal(typeof item.id, 'string');
    assert.equal(typeof item.group, 'string');
    assert.equal(typeof item.weight, 'number');
    assert.ok(Number.isFinite(item.weight));
    assert.ok(item.weight >= 0);
    assert.ok(item.weight <= 1);
    distinctGroups.add(item.group);
    weightTotal += item.weight;
  }

  assert.ok(distinctGroups.size >= 2);
  assert.ok(Math.abs(weightTotal - 1) < 0.01);
  assert.equal(result.debugInfo.version, 'pr4-router-mixer-minimum');
};

for (const input of [
  'やりたいのに動けない',
  '最近ちょっと自信ない',
  '作品を出したいけど怖い',
  'もう無理で諦めたい',
  '誰にも言っていない、小さな違和感',
]) {
  test(`runInternalOS returns stable minimum shape for: ${input}`, () => {
    assertNumericShape(runInternalOS(input));
  });
}

test('runInternalOS stays stable for undefined and null input', () => {
  assertNumericShape(runInternalOS(undefined));
  assertNumericShape(runInternalOS(null));
});

test('runInternalOS lightly blends previous latent state without overtaking current input', () => {
  const previous = runInternalOS('やりたいのに動けない');
  const fresh = runInternalOS('もう無理で諦めたい');
  const blended = runInternalOS('もう無理で諦めたい', {
    previousLatentState: previous.latentState,
  });

  assertNumericShape(blended);

  let influencedKeys = 0;

  for (const section of Object.keys(EXPECTED_KEYS)) {
    for (const key of EXPECTED_KEYS[section]) {
      const prevVal = previous.latentState[section][key];
      const freshVal = fresh.latentState[section][key];
      const blendedVal = blended.latentState[section][key];

      if (prevVal !== freshVal) {
        influencedKeys += 1;
        assert.ok(Math.abs(blendedVal - freshVal) < Math.abs(prevVal - freshVal));
      }
    }
  }

  assert.ok(influencedKeys > 0);
  assert.equal(blended.debugInfo.usedAfterglow, true);
});

test('runInternalOS respects previousMix inertia in patternMix selection', () => {
  const base = runInternalOS('最近ちょっと自信ない');
  const tailPattern = base.patternMix.selected[base.patternMix.selected.length - 1];

  const withPreviousMix = runInternalOS('最近ちょっと自信ない', {
    previousMix: { selected: [{ id: tailPattern.id, weight: 1 }] },
  });

  const baseWeight = tailPattern.weight;
  const carriedWeight = withPreviousMix.patternMix.selected.find((p) => p.id === tailPattern.id)?.weight ?? 0;

  assert.ok(carriedWeight >= baseWeight);
});

test('runInternalOS keeps legacy behavior when no continuity options are provided', () => {
  const input = '作品を出したいけど怖い';
  const withoutOptions = runInternalOS(input);
  const withEmptyOptions = runInternalOS(input, {});

  assert.deepEqual(withoutOptions.latentState, withEmptyOptions.latentState);
  assert.deepEqual(withoutOptions.patternMix, withEmptyOptions.patternMix);
});
