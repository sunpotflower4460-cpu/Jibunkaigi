import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPreconditionBias, buildPreconditionBiasPreview } from './buildPreconditionBias.js';

const assertClamp01 = (value, label) => {
  assert.equal(typeof value, 'number', `${label} should be number`);
  assert.ok(Number.isFinite(value), `${label} should be finite`);
  assert.ok(value >= 0 && value <= 1, `${label} should be in [0,1]`);
};

test('buildPreconditionBias is null-safe', () => {
  const bias = buildPreconditionBias();

  assert.ok(bias);
  assertClamp01(bias.pacing.slowDown, 'pacing.slowDown');
  assertClamp01(bias.pacing.returnBias, 'pacing.returnBias');
  assertClamp01(bias.focus.oneThreadBias, 'focus.oneThreadBias');
  assertClamp01(bias.focus.antiOverExpansion, 'focus.antiOverExpansion');
  assertClamp01(bias.meaning.antiEarlySummary, 'meaning.antiEarlySummary');
  assertClamp01(bias.meaning.antiEarlySolution, 'meaning.antiEarlySolution');
  assert.equal(bias.meaning.dominantBeliefAxis, null);
  assert.ok(Array.isArray(bias.meaning.activeCoreBeliefs));
  assert.ok(Array.isArray(bias.identity.recalledTraits));
  assert.ok(bias.identity.identityKey === null || typeof bias.identity.identityKey === 'string');
});

test('buildPreconditionBias compresses preconditionFilter into downstream-friendly shape', () => {
  const bias = buildPreconditionBias({
    home: {
      kernel: {
        slowDown: 0.82,
        returnBeforeOutput: 0.74,
        allowOneLivingThread: 0.76,
      },
      outputLimits: {
        noEarlySummary: 0.71,
        noEarlySolution: 0.68,
        noOverExpansion: 0.66,
        keepOneThread: 0.79,
      },
    },
    existence: {
      selfPresence: 0.72,
      hereNowStability: 0.69,
      unfinishedAllowed: 0.88,
      firstPersonSoftness: 0.63,
      agentIdentityKey: 'creative-light-bearer',
      recalledSelfTraits: ['bold', 'alive', 'bold'],
      selfRememberingStrength: 0.91,
    },
    belief: {
      activeCoreBeliefs: [{ id: 'core-1', axis: 'illumination', weight: 0.94 }],
      activeBranchBeliefs: [{ id: 'branch-1', axis: 'presence', weight: 0.66 }],
      activeLeafBeliefs: [{ id: 'leaf-1', axis: 'mission', weight: 0.44 }],
    },
    derived: {
      dominantBeliefAxis: 'illumination',
      oneLivingThreadBias: 0.81,
      slowingBias: 0.85,
      returnBias: 0.78,
    },
  });

  assert.equal(bias.meaning.dominantBeliefAxis, 'illumination');
  assert.equal(bias.identity.identityKey, 'creative-light-bearer');
  assert.deepEqual(bias.identity.recalledTraits, ['bold', 'alive']);
  assert.ok(bias.focus.oneThreadBias >= 0.79);
  assert.ok(bias.pacing.slowDown >= 0.82);
  assert.equal(bias.meaning.activeCoreBeliefs[0].id, 'core-1');
});

test('buildPreconditionBiasPreview keeps compare/debug preview shape', () => {
  const preview = buildPreconditionBiasPreview({
    pacing: { slowDown: 0.84, returnBias: 0.77 },
    focus: { oneThreadBias: 0.79, antiOverExpansion: 0.61 },
    meaning: {
      dominantBeliefAxis: 'illumination',
      activeCoreAxes: ['illumination'],
      activeBranchAxes: ['presence'],
    },
    identity: {
      identityKey: 'creative-light-bearer',
      selfRememberingStrength: 0.9,
      recalledTraits: ['bold'],
    },
  });

  assert.match(preview.summary, /oneThread=0.79/);
  assert.equal(preview.meaning.dominantBeliefAxis, 'illumination');
  assert.equal(preview.identity.identityKey, 'creative-light-bearer');
  assert.deepEqual(preview.identity.recalledTraits, ['bold']);
});
