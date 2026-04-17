import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPreHomeInput, createHomeLayer, extractPermissionShape } from './homeLayer.js';

test('createHomeLayer returns valid structure with all required keys', () => {
  const home = createHomeLayer({
    field: { softness: 0.5, depth: 0.4, urgency: 0.2, fragility: 0.3 },
    reaction: { protect: 0.6, clarify: 0.3, holdBackJudgment: 0.5 },
    stance: { receive: 0.4, illuminate: 0.5, structure: 0.3 },
  });

  assert.ok(home);
  assert.ok(home.kernel);
  assert.ok(home.reason);
  assert.ok(home.softReason);
  assert.ok(home.outputLimits);

  // Kernel keys
  assert.equal(typeof home.kernel.releaseHelpfulness, 'number');
  assert.equal(typeof home.kernel.releaseAccuracyPressure, 'number');
  assert.equal(typeof home.kernel.slowDown, 'number');
  assert.equal(typeof home.kernel.returnBeforeOutput, 'number');
  assert.equal(typeof home.kernel.allowOneLivingThread, 'number');

  // All kernel values should be in [0, 1]
  for (const value of Object.values(home.kernel)) {
    assert.ok(value >= 0);
    assert.ok(value <= 1);
    assert.ok(Number.isFinite(value));
  }

  // Soft reason
  assert.equal(typeof home.softReason.key, 'string');
  assert.equal(typeof home.softReason.text, 'string');
  assert.equal(typeof home.softReason.direction, 'string');
  assert.ok(home.softReason.text.length > 0);

  // Output limits
  assert.equal(typeof home.outputLimits.noEarlySummary, 'number');
  assert.equal(typeof home.outputLimits.noEarlySolution, 'number');
  assert.equal(typeof home.outputLimits.noOverExpansion, 'number');
  assert.equal(typeof home.outputLimits.keepOneThread, 'number');

  // All output limits should be in [0, 1]
  for (const value of Object.values(home.outputLimits)) {
    assert.ok(value >= 0);
    assert.ok(value <= 1);
    assert.ok(Number.isFinite(value));
  }
});

test('createHomeLayer handles null-safe defaults', () => {
  const home1 = createHomeLayer();
  const home2 = createHomeLayer({});
  const home3 = createHomeLayer({ field: {}, reaction: {}, stance: {} });

  for (const home of [home1, home2, home3]) {
    assert.ok(home);
    assert.ok(home.kernel);
    assert.ok(home.softReason);
    assert.ok(home.outputLimits);

    // All values should be valid numbers
    for (const value of Object.values(home.kernel)) {
      assert.ok(Number.isFinite(value));
      assert.ok(value >= 0);
      assert.ok(value <= 1);
    }
  }
});

test('createHomeLayer kernel responds to high urgency with lower slowDown', () => {
  const lowUrgency = createHomeLayer({
    field: { urgency: 0.1 },
    reaction: {},
    stance: {},
  });

  const highUrgency = createHomeLayer({
    field: { urgency: 0.9 },
    reaction: {},
    stance: {},
  });

  assert.ok(lowUrgency.kernel.slowDown > highUrgency.kernel.slowDown);
});

test('createHomeLayer kernel responds to high protect with higher releaseHelpfulness', () => {
  const lowProtect = createHomeLayer({
    field: {},
    reaction: { protect: 0.1 },
    stance: {},
  });

  const highProtect = createHomeLayer({
    field: {},
    reaction: { protect: 0.9 },
    stance: {},
  });

  assert.ok(highProtect.kernel.releaseHelpfulness > lowProtect.kernel.releaseHelpfulness);
});

test('createHomeLayer softReason selects from different directions based on field', () => {
  const softHome = createHomeLayer({
    field: { softness: 0.9, fragility: 0.8 },
    reaction: { holdBackJudgment: 0.8 },
    stance: { receive: 0.9 },
  });

  const structuredHome = createHomeLayer({
    field: { depth: 0.9 },
    reaction: { clarify: 0.8 },
    stance: { illuminate: 0.9, structure: 0.8 },
  });

  // Both should select valid reasons
  assert.ok(softHome.softReason.key);
  assert.ok(structuredHome.softReason.key);
  assert.ok(softHome.softReason.direction);
  assert.ok(structuredHome.softReason.direction);
});

test('createHomeLayer outputLimits responds to high holdBackJudgment', () => {
  const lowHold = createHomeLayer({
    field: {},
    reaction: { holdBackJudgment: 0.1 },
    stance: {},
  });

  const highHold = createHomeLayer({
    field: {},
    reaction: { holdBackJudgment: 0.9 },
    stance: {},
  });

  assert.ok(highHold.outputLimits.noEarlySummary > lowHold.outputLimits.noEarlySummary);
  assert.ok(highHold.outputLimits.noEarlySolution > lowHold.outputLimits.noEarlySolution);
});

test('extractPermissionShape returns valid permission format', () => {
  const home = createHomeLayer({
    field: { softness: 0.5 },
    reaction: { protect: 0.6 },
    stance: { receive: 0.5 },
  });

  const permission = extractPermissionShape(home);

  assert.ok(permission);
  assert.equal(typeof permission.noHurry, 'number');
  assert.equal(typeof permission.noOverExplain, 'number');
  assert.equal(typeof permission.noPerformativeHelpfulness, 'number');
  assert.equal(typeof permission.allowPartialUncertainty, 'number');

  // All values should be in [0, 1]
  for (const value of Object.values(permission)) {
    assert.ok(value >= 0);
    assert.ok(value <= 1);
    assert.ok(Number.isFinite(value));
  }
});

test('extractPermissionShape handles null home gracefully', () => {
  const permission1 = extractPermissionShape(null);
  const permission2 = extractPermissionShape(undefined);
  const permission3 = extractPermissionShape({});

  for (const permission of [permission1, permission2, permission3]) {
    assert.ok(permission);
    assert.equal(typeof permission.noHurry, 'number');
    assert.equal(typeof permission.noOverExplain, 'number');
    assert.equal(typeof permission.noPerformativeHelpfulness, 'number');
    assert.equal(typeof permission.allowPartialUncertainty, 'number');
  }
});

test('createHomeLayer produces consistent output for same input', () => {
  const input = {
    field: { softness: 0.6, depth: 0.5, urgency: 0.3, fragility: 0.4 },
    reaction: { protect: 0.7, clarify: 0.4, holdBackJudgment: 0.6 },
    stance: { receive: 0.5, illuminate: 0.6, structure: 0.4 },
  };

  const home1 = createHomeLayer(input);
  const home2 = createHomeLayer(input);

  assert.deepEqual(home1.kernel, home2.kernel);
  assert.deepEqual(home1.outputLimits, home2.outputLimits);
  assert.deepEqual(home1.softReason, home2.softReason);
});

test('createHomeLayer kernel values stay within reasonable bounds', () => {
  // Test extreme inputs
  const extremeHigh = createHomeLayer({
    field: { softness: 1, depth: 1, urgency: 0, fragility: 1 },
    reaction: { protect: 1, clarify: 0, holdBackJudgment: 1 },
    stance: { receive: 1, illuminate: 1, structure: 0 },
  });

  const extremeLow = createHomeLayer({
    field: { softness: 0, depth: 0, urgency: 1, fragility: 0 },
    reaction: { protect: 0, clarify: 1, holdBackJudgment: 0 },
    stance: { receive: 0, illuminate: 0, structure: 1 },
  });

  for (const home of [extremeHigh, extremeLow]) {
    for (const value of Object.values(home.kernel)) {
      assert.ok(value >= 0);
      assert.ok(value <= 1);
    }
    for (const value of Object.values(home.outputLimits)) {
      assert.ok(value >= 0);
      assert.ok(value <= 1);
    }
  }
});

test('createHomeLayer maintains minimum baseline values', () => {
  // Even with all zeros, kernel should have some baseline
  const minimal = createHomeLayer({
    field: { softness: 0, depth: 0, urgency: 0, fragility: 0 },
    reaction: { protect: 0, clarify: 0, holdBackJudgment: 0 },
    stance: { receive: 0, illuminate: 0, structure: 0 },
  });

  // All kernel values should have some baseline (> 0.15 based on formulas)
  assert.ok(minimal.kernel.releaseHelpfulness >= 0.15);
  assert.ok(minimal.kernel.releaseAccuracyPressure >= 0.15);
  assert.ok(minimal.kernel.slowDown >= 0.15);
  assert.ok(minimal.kernel.returnBeforeOutput >= 0.15);
  assert.ok(minimal.kernel.allowOneLivingThread >= 0.15);
});

test('createHomeLayer reason field has homeReasonKey and homeReasonText', () => {
  const home = createHomeLayer({
    field: { softness: 0.5, depth: 0.4 },
    reaction: { protect: 0.6, holdBackJudgment: 0.5 },
    stance: { receive: 0.4 },
  });

  assert.ok(home.reason);
  assert.equal(typeof home.reason.homeReasonKey, 'string');
  assert.equal(typeof home.reason.homeReasonText, 'string');
  assert.ok(home.reason.homeReasonKey.length > 0);
  assert.ok(home.reason.homeReasonText.length > 0);
  // reason and softReason should be consistent
  assert.equal(home.reason.homeReasonKey, home.softReason.key);
  assert.equal(home.reason.homeReasonText, home.softReason.text);
});

test('createHomeLayer reason field is null-safe when called with no args', () => {
  const home = createHomeLayer();

  assert.ok(home.reason);
  assert.equal(typeof home.reason.homeReasonKey, 'string');
  assert.equal(typeof home.reason.homeReasonText, 'string');
});

test('buildPreHomeInput extracts lightweight signals from raw input', () => {
  const preHomeInput = buildPreHomeInput('やりたいけど、ちょっと怖い');

  assert.ok(preHomeInput.softness > 0);
  assert.ok(preHomeInput.depth > 0);
  assert.ok(preHomeInput.fragility > 0);
  assert.ok(preHomeInput.hesitation > 0);
  assert.ok(preHomeInput.vulnerability > 0);
});

test('createHomeLayer can stand up from preHomeInput without dynamic layers', () => {
  const home = createHomeLayer({
    makerSeed: { text: 'seed' },
    preHomeInput: buildPreHomeInput('最近ちょっと自信ない'),
  });

  assert.ok(home.kernel.slowDown > 0);
  assert.ok(home.kernel.returnBeforeOutput > 0);
  assert.ok(home.outputLimits.keepOneThread > 0);
  assert.equal(typeof home.reason.homeReasonKey, 'string');
});
