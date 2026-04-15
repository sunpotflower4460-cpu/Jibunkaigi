import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDecisionPreviews, createDecisionLayer } from './decisionLayer.js';

const assertClamp01 = (value, label) => {
  assert.equal(typeof value, 'number', `${label} should be number`);
  assert.ok(Number.isFinite(value), `${label} should be finite`);
  assert.ok(value >= 0 && value <= 1, `${label} should be in [0,1]`);
};

test('createDecisionLayer is null-safe', () => {
  const decision = createDecisionLayer();

  assert.ok(decision);
  assert.ok(decision.feltSense);
  assert.ok(decision.intention);
  assert.ok(decision.restraint);
  assert.ok(decision.decisionMeta);
  assert.ok(decision.feltSense.primaryFeeling === null || typeof decision.feltSense.primaryFeeling === 'string');
  assert.ok(decision.intention.speakIntentKey === null || typeof decision.intention.speakIntentKey === 'string');
  assertClamp01(decision.feltSense.tensionStrength, 'feltSense.tensionStrength');
  assertClamp01(decision.intention.touchDepth, 'intention.touchDepth');
  assertClamp01(decision.restraint.holdBackSummary, 'restraint.holdBackSummary');
  assert.ok(decision.decisionMeta.delegatedBy === null || typeof decision.decisionMeta.delegatedBy === 'string');
});

test('createDecisionLayer builds feltSense, intention, restraint, and meta from preconditions', () => {
  const decision = createDecisionLayer({
    preconditionFilter: {
      home: {
        outputLimits: {
          noEarlySummary: 0.74,
          noEarlySolution: 0.82,
          noOverExpansion: 0.66,
          keepOneThread: 0.79,
        },
      },
      derived: {
        identityAxis: 'illumination',
        dominantBeliefAxis: 'presence',
      },
    },
    preconditionBias: {
      pacing: { returnBias: 0.72 },
      focus: { oneThreadBias: 0.81, antiOverExpansion: 0.69 },
      meaning: {
        antiEarlySummary: 0.7,
        antiEarlySolution: 0.84,
        dominantBeliefAxis: 'illumination',
      },
    },
    beliefTension: {
      activeTensions: [
        {
          beliefId: 'stay_with_faint_thread',
          sourceLayer: 'leaf',
          tensionType: 'pull',
          strength: 0.62,
          axis: 'attention',
        },
      ],
      totalTensionStrength: 0.62,
    },
    reaction: { protect: 0.63 },
    stance: { receive: 0.71 },
  });

  assert.equal(decision.feltSense.primaryFeeling, 'protective-pull');
  assert.equal(decision.intention.speakIntentKey, 'touch_living_thread');
  assert.equal(decision.intention.focusTarget, 'faint-thread');
  assert.equal(decision.decisionMeta.identityAxis, 'illumination');
  assert.equal(decision.decisionMeta.dominantBeliefAxis, 'illumination');
  assert.equal(decision.decisionMeta.delegatedBy, 'self');
  assert.ok(decision.restraint.holdBackSolution >= 0.82);
  assert.ok(decision.restraint.keepSilenceMargin > 0);
});

test('buildDecisionPreviews keeps compare/debug shape', () => {
  const previews = buildDecisionPreviews({
    feltSense: {
      primaryFeeling: 'quiet-recognition',
      secondaryFeeling: 'soft-holding',
      tensionType: 'pull',
      tensionStrength: 0.52,
    },
    intention: {
      speakIntentKey: 'touch_living_thread',
      speakIntentText: 'まだ切れていない一点に触れたい',
      touchDepth: 0.68,
      focusTarget: 'faint-thread',
    },
    restraint: {
      holdBackSummary: 0.82,
      holdBackSolution: 0.88,
      holdBackExpansion: 0.76,
      keepSilenceMargin: 0.64,
    },
    decisionMeta: {
      identityAxis: 'illumination',
      dominantBeliefAxis: 'presence',
      delegatedBy: 'self',
    },
  });

  assert.match(previews.feltSensePreview.summary, /quiet-recognition/);
  assert.equal(previews.speakIntentPreview.speakIntentKey, 'touch_living_thread');
  assert.equal(previews.speakIntentPreview.focusTarget, 'faint-thread');
  assert.match(previews.restraintPreview.summary, /no-solution/);
  assert.equal(previews.decisionMetaPreview.delegatedBy, 'self');
});
