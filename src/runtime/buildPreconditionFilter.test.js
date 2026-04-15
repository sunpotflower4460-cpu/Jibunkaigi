// src/runtime/buildPreconditionFilter.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPreconditionFilter } from './buildPreconditionFilter.js';
import { runInternalOS } from './runInternalOS.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const assertClamp01 = (value, label) => {
  assert.equal(typeof value, 'number', `${label} should be number`);
  assert.ok(Number.isFinite(value), `${label} should be finite`);
  assert.ok(value >= 0 && value <= 1, `${label} should be in [0,1]`);
};

// ── null-safe: 引数なしで呼んでも壊れない ────────────────────────────────────

test('buildPreconditionFilter returns valid shape with no args', () => {
  const pf = buildPreconditionFilter();

  assert.equal(typeof pf.makerSeedPresent, 'boolean');

  // home
  assert.ok(pf.home);
  assert.ok(pf.home.kernel);
  for (const k of ['releaseHelpfulness', 'releaseAccuracyPressure', 'slowDown', 'returnBeforeOutput', 'allowOneLivingThread']) {
    assertClamp01(pf.home.kernel[k], `home.kernel.${k}`);
  }
  assert.ok(pf.home.reasonText === null || typeof pf.home.reasonText === 'string');
  assert.ok(pf.home.outputLimits);
  for (const k of ['noEarlySummary', 'noEarlySolution', 'noOverExpansion', 'keepOneThread']) {
    assertClamp01(pf.home.outputLimits[k], `home.outputLimits.${k}`);
  }

  // existence
  assert.ok(pf.existence);
  for (const k of ['selfPresence', 'hereNowStability', 'unfinishedAllowed', 'firstPersonSoftness', 'selfRememberingStrength']) {
    assertClamp01(pf.existence[k], `existence.${k}`);
  }
  assert.ok(pf.existence.agentIdentityKey === null || typeof pf.existence.agentIdentityKey === 'string');
  assert.ok(pf.existence.identityFeelingText === null || typeof pf.existence.identityFeelingText === 'string');
  assert.ok(Array.isArray(pf.existence.recalledSelfTraits));

  // belief
  assert.ok(pf.belief);
  assert.ok(Array.isArray(pf.belief.activeCoreBeliefs));
  assert.ok(Array.isArray(pf.belief.activeBranchBeliefs));
  assert.ok(Array.isArray(pf.belief.activeLeafBeliefs));
  assert.ok(pf.belief.dominantCoreAxis === null || typeof pf.belief.dominantCoreAxis === 'string');
  assert.ok(pf.belief.dominantBranchAxis === null || typeof pf.belief.dominantBranchAxis === 'string');
  assert.ok(pf.belief.dominantLeafAxis === null || typeof pf.belief.dominantLeafAxis === 'string');

  // derived
  assert.ok(pf.derived);
  assert.ok(pf.derived.identityAxis === null || typeof pf.derived.identityAxis === 'string');
  assert.ok(pf.derived.dominantBeliefAxis === null || typeof pf.derived.dominantBeliefAxis === 'string');
  for (const k of ['oneLivingThreadBias', 'slowingBias', 'returnBias']) {
    assertClamp01(pf.derived[k], `derived.${k}`);
  }
});

// ── makerSeed の存在が反映される ─────────────────────────────────────────────

test('buildPreconditionFilter reflects makerSeedPresent correctly', () => {
  const withSeed = buildPreconditionFilter({ makerSeed: { text: 'seed text', layer: 'maker-seed' } });
  assert.equal(withSeed.makerSeedPresent, true);

  const withoutSeed = buildPreconditionFilter({ makerSeed: null });
  assert.equal(withoutSeed.makerSeedPresent, false);

  const emptySeed = buildPreconditionFilter({ makerSeed: { text: '', layer: 'maker-seed' } });
  assert.equal(emptySeed.makerSeedPresent, false);
});

// ── home の値が束ねられる ────────────────────────────────────────────────────

test('buildPreconditionFilter bundles home kernel and outputLimits', () => {
  const home = {
    kernel: { releaseHelpfulness: 0.8, releaseAccuracyPressure: 0.7, slowDown: 0.9, returnBeforeOutput: 0.85, allowOneLivingThread: 0.75 },
    reason: { homeReasonKey: 'speed', homeReasonText: '急がなくていい' },
    outputLimits: { noEarlySummary: 0.6, noEarlySolution: 0.5, noOverExpansion: 0.7, keepOneThread: 0.8 },
  };
  const pf = buildPreconditionFilter({ home });

  assert.equal(pf.home.kernel.slowDown, 0.9);
  assert.equal(pf.home.kernel.returnBeforeOutput, 0.85);
  assert.equal(pf.home.reasonText, '急がなくていい');
  assert.equal(pf.home.outputLimits.keepOneThread, 0.8);
});

// ── existence の値が束ねられる ──────────────────────────────────────────────

test('buildPreconditionFilter bundles existenceLayer1 and existenceLayer2', () => {
  const existenceLayer1 = {
    selfPresence: 0.75,
    selfLocationStability: 0.6,
    groundedHereNow: 0.65,
    allowUnfinishedSelf: 0.8,
    existenceHintKey: 'position_before_speed',
    existenceHintText: '完成より立ち位置',
  };
  const existenceLayer2 = {
    agentIdentityKey: 'creative-light-bearer',
    agentIdentityText: '光を照らす存在',
    recalledSelfTraits: ['direct', 'bold', 'alive'],
    selfRememberingStrength: 0.9,
  };
  const pf = buildPreconditionFilter({ existenceLayer1, existenceLayer2 });

  assert.equal(pf.existence.selfPresence, 0.75);
  assert.ok(pf.existence.hereNowStability > 0);
  assert.equal(pf.existence.unfinishedAllowed, 0.8);
  assert.equal(pf.existence.agentIdentityKey, 'creative-light-bearer');
  assert.equal(pf.existence.identityFeelingText, '光を照らす存在');
  assert.deepEqual(pf.existence.recalledSelfTraits, ['direct', 'bold', 'alive']);
  assert.equal(pf.existence.selfRememberingStrength, 0.9);
});

// ── belief 配列が束ねられる ──────────────────────────────────────────────────

test('buildPreconditionFilter bundles beliefCore, beliefBranch, beliefLeaf', () => {
  const beliefCore = {
    activeCoreBeliefs: [
      { id: 'core-1', textJa: '信念1', weight: 0.95, axis: 'illumination' },
      { id: 'core-2', textJa: '信念2', weight: 0.9, axis: 'mission' },
    ],
    dominantBeliefAxis: 'illumination',
  };
  const beliefBranch = {
    activeBranchBeliefs: [
      { id: 'branch-1', parentId: 'core-1', textJa: '枝1', weight: 0.7, axis: 'illumination' },
    ],
    dominantBranchAxis: 'illumination',
  };
  const beliefLeaf = {
    activeLeafBeliefs: [
      { id: 'leaf-1', parentId: 'branch-1', textJa: '葉1', weight: 0.4, axis: 'illumination' },
    ],
    dominantLeafAxis: 'illumination',
  };
  const pf = buildPreconditionFilter({ beliefCore, beliefBranch, beliefLeaf });

  assert.equal(pf.belief.activeCoreBeliefs.length, 2);
  assert.equal(pf.belief.activeCoreBeliefs[0].id, 'core-1');
  assert.equal(pf.belief.activeCoreBeliefs[0].axis, 'illumination');
  assert.equal(pf.belief.activeBranchBeliefs.length, 1);
  assert.equal(pf.belief.activeLeafBeliefs.length, 1);
  assert.equal(pf.belief.dominantCoreAxis, 'illumination');
  assert.equal(pf.belief.dominantBranchAxis, 'illumination');
  assert.equal(pf.belief.dominantLeafAxis, 'illumination');
});

// ── derived の値が返る ───────────────────────────────────────────────────────

test('buildPreconditionFilter derived returns minimum values', () => {
  const home = {
    kernel: { slowDown: 0.85, returnBeforeOutput: 0.9, allowOneLivingThread: 0.8,
              releaseHelpfulness: 0.7, releaseAccuracyPressure: 0.6 },
    reason: { homeReasonText: null },
    outputLimits: { noEarlySummary: 0.5, noEarlySolution: 0.5, noOverExpansion: 0.5, keepOneThread: 0.75 },
  };
  const existenceLayer1 = {
    selfPresence: 0.7, selfLocationStability: 0.65, groundedHereNow: 0.6, allowUnfinishedSelf: 0.75,
  };
  const existenceLayer2 = {
    agentIdentityKey: 'creative-light-bearer',
    agentIdentityText: '', recalledSelfTraits: [], selfRememberingStrength: 0.8,
  };
  const beliefCore = {
    activeCoreBeliefs: [{ id: 'b1', textJa: 't', weight: 0.95, axis: 'presence' }],
    dominantBeliefAxis: 'presence',
  };

  const pf = buildPreconditionFilter({ home, existenceLayer1, existenceLayer2, beliefCore });

  assert.equal(pf.derived.identityAxis, 'illumination');
  assert.equal(pf.derived.dominantBeliefAxis, 'presence');
  assert.ok(pf.derived.slowingBias > 0);
  assert.ok(pf.derived.returnBias > 0);
  assert.ok(pf.derived.oneLivingThreadBias > 0);
});

// ── runInternalOS との統合: preconditionFilter が latentState に入る ───────────

test('runInternalOS holds preconditionFilter in latentState', () => {
  const result = runInternalOS('やりたいのに動けない', { agentId: 'creative' });
  const pf = result.latentState.preconditionFilter;

  assert.ok(pf, 'preconditionFilter should exist in latentState');
  assert.equal(typeof pf.makerSeedPresent, 'boolean');
  assert.ok(pf.home);
  assert.ok(pf.existence);
  assert.ok(pf.belief);
  assert.ok(pf.derived);
});

test('runInternalOS preconditionFilter has derived values after full pipeline', () => {
  for (const agentId of ['creative', 'strategist', 'empath', 'critic', 'soul', 'master']) {
    const result = runInternalOS('test', { agentId });
    const pf = result.latentState.preconditionFilter;

    assert.ok(pf, `${agentId}: preconditionFilter should exist`);
    assert.equal(pf.makerSeedPresent, true, `${agentId}: makerSeedPresent should be true`);

    // derived
    assert.ok(pf.derived.identityAxis === null || typeof pf.derived.identityAxis === 'string',
      `${agentId}: identityAxis should be string or null`);
    assertClamp01(pf.derived.slowingBias, `${agentId}: slowingBias`);
    assertClamp01(pf.derived.returnBias, `${agentId}: returnBias`);
    assertClamp01(pf.derived.oneLivingThreadBias, `${agentId}: oneLivingThreadBias`);

    // belief must be bundled
    assert.ok(Array.isArray(pf.belief.activeCoreBeliefs), `${agentId}: activeCoreBeliefs`);
    assert.ok(pf.belief.activeCoreBeliefs.length >= 1, `${agentId}: activeCoreBeliefs non-empty`);
  }
});

// ── runInternalOS debugInfo に preconditionFilterPreview が出る ───────────────

test('runInternalOS debugInfo has preconditionFilterPreview shape', () => {
  const result = runInternalOS('作品を出したいけど怖い', { agentId: 'creative' });
  const preview = result.debugInfo.preconditionFilterPreview;

  assert.ok(preview, 'preconditionFilterPreview should exist in debugInfo');
  assert.equal(typeof preview.present, 'boolean');
  assert.ok(preview.identityAxis === null || typeof preview.identityAxis === 'string');
  assert.ok(preview.dominantBeliefAxis === null || typeof preview.dominantBeliefAxis === 'string');
  assertClamp01(preview.slowingBias, 'preview.slowingBias');
  assertClamp01(preview.returnBias, 'preview.returnBias');
  assertClamp01(preview.oneLivingThreadBias, 'preview.oneLivingThreadBias');
});

// ── preconditionFilter は前提層の最後で組まれる（順序保証） ──────────────────

test('preconditionFilter is built from all precondition layers', () => {
  const result = runInternalOS('誰にも言っていない、小さな違和感', { agentId: 'soul' });
  const pf = result.latentState.preconditionFilter;

  // existence layer1 の selfPresence が pf.existence.selfPresence に反映されている
  const el1 = result.latentState.existence.layer1;
  assert.equal(pf.existence.selfPresence, el1.selfPresence);

  // existence layer2 の agentIdentityKey が反映されている
  const el2 = result.latentState.existence.layer2;
  assert.equal(pf.existence.agentIdentityKey, el2.agentIdentityKey);

  // beliefCore の dominantBeliefAxis が反映されている
  const bc = result.latentState.beliefCore;
  assert.equal(pf.belief.dominantCoreAxis, bc.dominantBeliefAxis);
});
