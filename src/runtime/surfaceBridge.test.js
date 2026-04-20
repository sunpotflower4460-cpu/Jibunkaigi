// surfaceBridge.test.js
// Phase 8 tests: consciousIntent/lengthPlan → surface connection

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  transformSpeakIntentToSurfaceHint,
  transformHoldBackToSurfaceRestraint,
  transformLengthPlanToSurfaceGuidance,
  buildSurfaceGuidanceFromIntent,
  formatSurfaceGuidanceForDebug,
} from './surfaceBridge.js';

test('transformSpeakIntentToSurfaceHint returns empty - high-semantic hints removed', () => {
  // After Phase: Removing high-semantic re-translation
  // transformSpeakIntentToSurfaceHint now returns empty string
  // Internal state flows through emotionalColor/motionBias instead
  assert.equal(
    transformSpeakIntentToSurfaceHint('touch-the-living-point'),
    ''
  );
  assert.equal(
    transformSpeakIntentToSurfaceHint('clarify-the-knot'),
    ''
  );
  assert.equal(
    transformSpeakIntentToSurfaceHint('make-room-without-closing'),
    ''
  );
  assert.equal(
    transformSpeakIntentToSurfaceHint('unknown-intent'),
    ''
  );
  assert.equal(
    transformSpeakIntentToSurfaceHint(null),
    ''
  );
});

test('transformHoldBackToSurfaceRestraint transforms holdBack to restraint hints', () => {
  const restraint = transformHoldBackToSurfaceRestraint(['no-early-summary', 'no-fix-yet']);

  assert.ok(restraint.restraintHints.includes('要約調を抑える'));
  assert.ok(restraint.restraintHints.includes('解決を急がない'));
  assert.ok(restraint.summarySuppression > 0.5);
  assert.ok(restraint.solutionSuppression > 0.5);
});

test('transformHoldBackToSurfaceRestraint limits to top 3 hints', () => {
  const restraint = transformHoldBackToSurfaceRestraint([
    'no-early-summary',
    'no-fix-yet',
    'no-over-expansion',
    'do-not-close',
  ]);

  assert.ok(restraint.restraintHints.length <= 3);
});

test('transformLengthPlanToSurfaceGuidance transforms short target', () => {
  const guidance = transformLengthPlanToSurfaceGuidance({
    target: 'short',
    lineCountHint: 2,
    expansionBudget: 0.25,
    compressionPressure: 0.75,
  });

  assert.equal(guidance.target, 'short');
  assert.equal(guidance.lineCountHint, 2);
  assert.ok(guidance.lengthGuidanceHints.includes('短めに収める'));
  assert.ok(guidance.lengthGuidanceHints.includes('1つの cluster だけ'));
});

test('transformLengthPlanToSurfaceGuidance transforms long target', () => {
  const guidance = transformLengthPlanToSurfaceGuidance({
    target: 'long',
    lineCountHint: 7,
    expansionBudget: 0.65,
    compressionPressure: 0.25,
  });

  assert.equal(guidance.target, 'long');
  assert.equal(guidance.lineCountHint, 7);
  assert.ok(guidance.lengthGuidanceHints.includes('必要なら少し広げてよい'));
});

test('buildSurfaceGuidanceFromIntent combines consciousIntent and lengthPlan', () => {
  const consciousIntent = {
    speakIntent: 'clarify-the-knot',
    holdBack: ['no-early-summary', 'no-fix-yet'],
  };

  const lengthPlan = {
    target: 'medium',
    lineCountHint: 4,
    expansionBudget: 0.45,
    compressionPressure: 0.50,
  };

  const guidance = buildSurfaceGuidanceFromIntent({ consciousIntent, lengthPlan });

  // After Phase: high-semantic hints removed, speakIntentHint is now empty
  assert.equal(guidance.speakIntentHint, '');
  assert.equal(guidance.speakIntentKey, 'clarify-the-knot');
  assert.ok(guidance.restraintHints.includes('要約調を抑える'));
  assert.equal(guidance.lengthTarget, 'medium');
  assert.equal(guidance.lineCountHint, 4);
});

test('buildSurfaceGuidanceFromIntent handles null inputs', () => {
  const guidance = buildSurfaceGuidanceFromIntent({ consciousIntent: null, lengthPlan: null });

  assert.equal(guidance.speakIntentHint, '');
  assert.equal(guidance.speakIntentKey, null);
  assert.deepEqual(guidance.restraintHints, []);
  assert.equal(guidance.lengthTarget, 'medium');
});

test('formatSurfaceGuidanceForDebug formats guidance for debug display', () => {
  const guidance = {
    speakIntentKey: 'clarify-the-knot',
    restraintHints: ['要約調を抑える', '解決を急がない'],
    lengthTarget: 'medium',
    lineCountHint: 4,
    expansionBudget: 0.45,
    compressionPressure: 0.50,
  };

  const formatted = formatSurfaceGuidanceForDebug(guidance);

  assert.ok(formatted.includes('clarify-the-knot'));
  assert.ok(formatted.includes('要約調を抑える'));
  assert.ok(formatted.includes('medium'));
  assert.ok(formatted.includes('lines=4'));
});

test('formatSurfaceGuidanceForDebug handles null input', () => {
  const formatted = formatSurfaceGuidanceForDebug(null);

  assert.equal(formatted, 'no surface guidance');
});
