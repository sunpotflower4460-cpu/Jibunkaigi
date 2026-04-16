import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeHomeNeutralizationState,
  applyHomeRetry,
  buildHomeNeutralizationPreview,
} from './homeNeutralizationCheck.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const makeHome = (kernelOverrides = {}, outputLimitOverrides = {}) => ({
  kernel: {
    releaseHelpfulness: 0.5,
    releaseAccuracyPressure: 0.45,
    slowDown: 0.55,
    returnBeforeOutput: 0.5,
    allowOneLivingThread: 0.5,
    ...kernelOverrides,
  },
  reason: { homeReasonKey: 'test', homeReasonText: 'test reason' },
  softReason: { key: 'test', text: 'test reason', direction: 'existence' },
  outputLimits: {
    noEarlySummary: 0.45,
    noEarlySolution: 0.42,
    noOverExpansion: 0.4,
    keepOneThread: 0.45,
    ...outputLimitOverrides,
  },
});

// ── computeHomeNeutralizationState ───────────────────────────────────────────

test('computeHomeNeutralizationState returns correct shape', () => {
  const result = computeHomeNeutralizationState(makeHome());

  assert.ok(result, 'result should exist');
  assert.equal(typeof result.residualHelpfulnessPressure, 'number');
  assert.equal(typeof result.residualAccuracyPressure, 'number');
  assert.equal(typeof result.residualPerformancePressure, 'number');
  assert.equal(typeof result.residualSummaryPressure, 'number');
  assert.equal(typeof result.residualSolutionPressure, 'number');
  assert.equal(typeof result.neutralizationDepth, 'number');
  assert.equal(typeof result.returnedToZero, 'boolean');
  assert.equal(typeof result.retryRecommended, 'boolean');
});

test('computeHomeNeutralizationState is null-safe with no args', () => {
  const result1 = computeHomeNeutralizationState(null);
  const result2 = computeHomeNeutralizationState(undefined);
  const result3 = computeHomeNeutralizationState({});

  for (const result of [result1, result2, result3]) {
    assert.ok(result);
    assert.equal(typeof result.neutralizationDepth, 'number');
    assert.equal(typeof result.returnedToZero, 'boolean');
    assert.equal(typeof result.retryRecommended, 'boolean');
    assert.ok(Number.isFinite(result.neutralizationDepth));
    assert.ok(result.neutralizationDepth >= 0 && result.neutralizationDepth <= 1);
  }
});

test('computeHomeNeutralizationState: all residual pressures stay in [0, 1]', () => {
  const highHome = makeHome(
    { releaseHelpfulness: 0.9, releaseAccuracyPressure: 0.9, returnBeforeOutput: 0.9 },
    { noEarlySummary: 0.9, noEarlySolution: 0.9 }
  );
  const lowHome = makeHome(
    { releaseHelpfulness: 0.05, releaseAccuracyPressure: 0.05, returnBeforeOutput: 0.05 },
    { noEarlySummary: 0.05, noEarlySolution: 0.05 }
  );

  for (const home of [highHome, lowHome]) {
    const result = computeHomeNeutralizationState(home);
    for (const key of [
      'residualHelpfulnessPressure',
      'residualAccuracyPressure',
      'residualPerformancePressure',
      'residualSummaryPressure',
      'residualSolutionPressure',
    ]) {
      assert.ok(result[key] >= 0 && result[key] <= 1, `${key} out of range`);
      assert.ok(Number.isFinite(result[key]), `${key} not finite`);
    }
  }
});

test('computeHomeNeutralizationState: neutralizationDepth stays in [0, 1]', () => {
  const extremeHigh = makeHome(
    { releaseHelpfulness: 1, releaseAccuracyPressure: 1, returnBeforeOutput: 1 },
    { noEarlySummary: 1, noEarlySolution: 1 }
  );
  const extremeLow = makeHome(
    { releaseHelpfulness: 0, releaseAccuracyPressure: 0, returnBeforeOutput: 0 },
    { noEarlySummary: 0, noEarlySolution: 0 }
  );

  for (const home of [extremeHigh, extremeLow]) {
    const result = computeHomeNeutralizationState(home);
    assert.ok(result.neutralizationDepth >= 0 && result.neutralizationDepth <= 1);
    assert.ok(Number.isFinite(result.neutralizationDepth));
  }
});

test('computeHomeNeutralizationState: high release values → high neutralizationDepth', () => {
  const highRelease = makeHome(
    { releaseHelpfulness: 0.9, releaseAccuracyPressure: 0.85, returnBeforeOutput: 0.88 },
    { noEarlySummary: 0.88, noEarlySolution: 0.85 }
  );
  const lowRelease = makeHome(
    { releaseHelpfulness: 0.15, releaseAccuracyPressure: 0.12, returnBeforeOutput: 0.10 },
    { noEarlySummary: 0.12, noEarlySolution: 0.10 }
  );

  const high = computeHomeNeutralizationState(highRelease);
  const low = computeHomeNeutralizationState(lowRelease);

  assert.ok(high.neutralizationDepth > low.neutralizationDepth,
    'high release → higher neutralizationDepth');
});

test('computeHomeNeutralizationState: returnedToZero true when neutralizationDepth is high', () => {
  const goodHome = makeHome(
    { releaseHelpfulness: 0.9, releaseAccuracyPressure: 0.85, returnBeforeOutput: 0.88 },
    { noEarlySummary: 0.88, noEarlySolution: 0.85 }
  );
  const result = computeHomeNeutralizationState(goodHome);

  assert.equal(result.returnedToZero, true, 'should have returned to zero with high release');
});

test('computeHomeNeutralizationState: returnedToZero false when release is low', () => {
  const thinHome = makeHome(
    { releaseHelpfulness: 0.1, releaseAccuracyPressure: 0.1, returnBeforeOutput: 0.1 },
    { noEarlySummary: 0.1, noEarlySolution: 0.1 }
  );
  const result = computeHomeNeutralizationState(thinHome);

  assert.equal(result.returnedToZero, false, 'should NOT have returned to zero with low release');
});

test('computeHomeNeutralizationState: retryRecommended true when neutralizationDepth is very low', () => {
  const thinHome = makeHome(
    { releaseHelpfulness: 0.1, releaseAccuracyPressure: 0.1, returnBeforeOutput: 0.1 },
    { noEarlySummary: 0.1, noEarlySolution: 0.1 }
  );
  const result = computeHomeNeutralizationState(thinHome);

  assert.equal(result.retryRecommended, true, 'retry should be recommended when release is very low');
});

test('computeHomeNeutralizationState: retryRecommended false when neutralizationDepth is high enough', () => {
  const goodHome = makeHome(
    { releaseHelpfulness: 0.8, releaseAccuracyPressure: 0.75, returnBeforeOutput: 0.75 },
    { noEarlySummary: 0.75, noEarlySolution: 0.72 }
  );
  const result = computeHomeNeutralizationState(goodHome);

  assert.equal(result.retryRecommended, false, 'retry should NOT be recommended when release is sufficient');
});

test('computeHomeNeutralizationState: residual is inverse of release', () => {
  const home = makeHome({ releaseHelpfulness: 0.6 }, { noEarlySummary: 0.4 });
  const result = computeHomeNeutralizationState(home);

  assert.ok(Math.abs(result.residualHelpfulnessPressure - (1 - 0.6)) < 0.001,
    'residualHelpfulnessPressure should be 1 - releaseHelpfulness');
  assert.ok(Math.abs(result.residualSummaryPressure - (1 - 0.4)) < 0.001,
    'residualSummaryPressure should be 1 - noEarlySummary');
});

// ── applyHomeRetry ────────────────────────────────────────────────────────────

test('applyHomeRetry returns boosted kernel values', () => {
  const home = makeHome(
    { releaseHelpfulness: 0.3, releaseAccuracyPressure: 0.25, returnBeforeOutput: 0.28 },
    { noEarlySummary: 0.25, noEarlySolution: 0.22 }
  );
  const retried = applyHomeRetry(home);

  assert.ok(retried.kernel.releaseHelpfulness > home.kernel.releaseHelpfulness,
    'retry should boost releaseHelpfulness');
  assert.ok(retried.kernel.releaseAccuracyPressure > home.kernel.releaseAccuracyPressure,
    'retry should boost releaseAccuracyPressure');
  assert.ok(retried.kernel.returnBeforeOutput > home.kernel.returnBeforeOutput,
    'retry should boost returnBeforeOutput');
  assert.ok(retried.outputLimits.noEarlySummary > home.outputLimits.noEarlySummary,
    'retry should boost noEarlySummary');
  assert.ok(retried.outputLimits.noEarlySolution > home.outputLimits.noEarlySolution,
    'retry should boost noEarlySolution');
});

test('applyHomeRetry keeps all kernel values in [0, 1]', () => {
  // Even with max values, should clamp to 1
  const maxHome = makeHome(
    { releaseHelpfulness: 0.98, releaseAccuracyPressure: 0.99, returnBeforeOutput: 1.0 },
    { noEarlySummary: 0.98, noEarlySolution: 0.99 }
  );
  const retried = applyHomeRetry(maxHome);

  for (const val of Object.values(retried.kernel)) {
    assert.ok(val >= 0 && val <= 1, `kernel value ${val} out of [0,1]`);
    assert.ok(Number.isFinite(val));
  }
  for (const val of Object.values(retried.outputLimits)) {
    assert.ok(val >= 0 && val <= 1, `outputLimits value ${val} out of [0,1]`);
    assert.ok(Number.isFinite(val));
  }
});

test('applyHomeRetry preserves reason and softReason', () => {
  const home = makeHome();
  const retried = applyHomeRetry(home);

  assert.deepEqual(retried.reason, home.reason);
  assert.deepEqual(retried.softReason, home.softReason);
});

test('applyHomeRetry is null-safe', () => {
  const retried1 = applyHomeRetry(null);
  const retried2 = applyHomeRetry(undefined);
  const retried3 = applyHomeRetry({});

  for (const retried of [retried1, retried2, retried3]) {
    assert.ok(retried);
    assert.ok(retried.kernel);
    assert.ok(retried.outputLimits);
    for (const val of Object.values(retried.kernel)) {
      assert.ok(Number.isFinite(val));
      assert.ok(val >= 0 && val <= 1);
    }
  }
});

test('applyHomeRetry: neutralizationDepth improves after retry', () => {
  const home = makeHome(
    { releaseHelpfulness: 0.2, releaseAccuracyPressure: 0.18, returnBeforeOutput: 0.15 },
    { noEarlySummary: 0.18, noEarlySolution: 0.15 }
  );
  const retried = applyHomeRetry(home);

  const before = computeHomeNeutralizationState(home);
  const after = computeHomeNeutralizationState(retried);

  assert.ok(after.neutralizationDepth > before.neutralizationDepth,
    'retry should improve neutralizationDepth');
});

// ── buildHomeNeutralizationPreview ───────────────────────────────────────────

test('buildHomeNeutralizationPreview returns correct structure', () => {
  const check = computeHomeNeutralizationState(makeHome());
  const preview = buildHomeNeutralizationPreview({
    ...check,
    retried: false,
    retryCount: 0,
  });

  assert.ok(preview);
  assert.ok(preview.residual);
  assert.ok(preview.neutralization);
  assert.ok(preview.retry);
  assert.equal(typeof preview.summary, 'string');
  assert.ok(preview.summary.length > 0);

  // residual shape
  assert.equal(typeof preview.residual.helpful, 'number');
  assert.equal(typeof preview.residual.accuracy, 'number');
  assert.equal(typeof preview.residual.perform, 'number');
  assert.equal(typeof preview.residual.summary, 'number');
  assert.equal(typeof preview.residual.solution, 'number');

  // neutralization shape
  assert.equal(typeof preview.neutralization.depth, 'number');
  assert.equal(typeof preview.neutralization.zero, 'boolean');

  // retry shape
  assert.equal(typeof preview.retry.recommended, 'boolean');
  assert.equal(typeof preview.retry.retried, 'boolean');
  assert.equal(typeof preview.retry.count, 'number');
});

test('buildHomeNeutralizationPreview reflects retried state', () => {
  const check = computeHomeNeutralizationState(makeHome());
  const preview = buildHomeNeutralizationPreview({
    ...check,
    retried: true,
    retryCount: 1,
  });

  assert.equal(preview.retry.retried, true);
  assert.equal(preview.retry.count, 1);
  assert.ok(preview.summary.includes('retried=true'));
});

test('buildHomeNeutralizationPreview is null-safe', () => {
  const result1 = buildHomeNeutralizationPreview(null);
  const result2 = buildHomeNeutralizationPreview(undefined);

  assert.equal(result1, null);
  assert.equal(result2, null);
});
