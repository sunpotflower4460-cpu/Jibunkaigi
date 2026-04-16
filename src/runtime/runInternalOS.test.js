import test from 'node:test';
import assert from 'node:assert/strict';

import { runInternalOS } from './runInternalOS.js';

const EXPECTED_NUMERIC_SECTIONS = {
  field: ['softness', 'depth', 'urgency', 'fragility', 'playfulness'],
  reaction: ['touched', 'protect', 'clarify', 'curiosity', 'holdBackJudgment'],
  stance: ['receive', 'illuminate', 'structure', 'guard', 'nudge'],
  permission: ['noHurry', 'noOverExplain', 'noPerformativeHelpfulness', 'allowPartialUncertainty'],
  existenceLayer1: ['selfPresence', 'selfLocationStability', 'groundedHereNow', 'allowUnfinishedSelf'],
};

const HOME_KEYS = {
  home: {
    kernel: ['releaseHelpfulness', 'releaseAccuracyPressure', 'slowDown', 'returnBeforeOutput', 'allowOneLivingThread'],
    softReason: ['key', 'text', 'direction'],
    outputLimits: ['noEarlySummary', 'noEarlySolution', 'noOverExpansion', 'keepOneThread'],
  },
};

const assertNumericShape = (result) => {
  assert.ok(result);
  assert.ok(result.latentState);

  const latent = result.latentState;

  // numeric sections
  for (const [section, keys] of Object.entries(EXPECTED_NUMERIC_SECTIONS)) {
    if (section === 'existenceLayer1') {
      assert.ok(latent.existence);
      assert.ok(latent.existence.layer1);
      const layer1 = latent.existence.layer1;
      for (const key of keys) {
        assert.equal(typeof layer1[key], 'number');
        assert.ok(Number.isFinite(layer1[key]));
        assert.ok(layer1[key] >= 0);
        assert.ok(layer1[key] <= 1);
      }
      assert.ok('existenceHintKey' in layer1);
      assert.ok('existenceHintText' in layer1);
    } else {
      assert.ok(latent[section]);

      for (const key of keys) {
        assert.equal(typeof latent[section][key], 'number');
        assert.ok(Number.isFinite(latent[section][key]));
        assert.ok(latent[section][key] >= 0);
        assert.ok(latent[section][key] <= 1);
      }
    }
  }

  // home layer
  assert.ok(latent.home);
  assert.ok(latent.home.kernel);
  assert.ok(latent.home.reason);
  assert.ok(latent.home.softReason);
  assert.ok(latent.home.outputLimits);
  for (const key of HOME_KEYS.home.kernel) {
    assert.equal(typeof latent.home.kernel[key], 'number');
    assert.ok(Number.isFinite(latent.home.kernel[key]));
    assert.ok(latent.home.kernel[key] >= 0);
    assert.ok(latent.home.kernel[key] <= 1);
  }
  // reason field (HomeReasonState shape)
  assert.equal(typeof latent.home.reason.homeReasonKey, 'string');
  assert.equal(typeof latent.home.reason.homeReasonText, 'string');
  for (const key of HOME_KEYS.home.softReason) {
    assert.ok(latent.home.softReason[key]);
    assert.equal(typeof latent.home.softReason[key], 'string');
  }
  for (const key of HOME_KEYS.home.outputLimits) {
    assert.equal(typeof latent.home.outputLimits[key], 'number');
    assert.ok(Number.isFinite(latent.home.outputLimits[key]));
    assert.ok(latent.home.outputLimits[key] >= 0);
    assert.ok(latent.home.outputLimits[key] <= 1);
  }

  // existence layer2
  assert.ok(latent.existence?.layer2);
  assert.equal(typeof latent.existence.layer2.agentIdentityKey, 'string');
  assert.equal(typeof latent.existence.layer2.agentIdentityText, 'string');
  assert.ok(Array.isArray(latent.existence.layer2.recalledSelfTraits));
  assert.ok(latent.existence.layer2.recalledSelfTraits.length >= 1);
  assert.equal(typeof latent.existence.layer2.selfRememberingStrength, 'number');
  assert.ok(latent.existence.layer2.selfRememberingStrength >= 0);
  assert.ok(latent.existence.layer2.selfRememberingStrength <= 1);

  // belief layers
  assert.ok(latent.belief);
  ['layer1', 'layer2', 'layer3'].forEach((layerKey) => {
    const layer = latent.belief[layerKey];
    assert.ok(Array.isArray(layer));
    assert.ok(layer.length >= 1);
    for (const item of layer) {
      assert.equal(typeof item.id, 'string');
      assert.equal(typeof item.text, 'string');
      assert.equal(typeof item.weight, 'number');
      assert.ok(Number.isFinite(item.weight));
      assert.ok(item.weight >= 0);
      assert.ok(item.weight <= 1);
    }
  });

  // belief branch layer (信念層2)
  assert.ok(latent.beliefBranch, 'beliefBranch should exist');
  assert.ok(Array.isArray(latent.beliefBranch.activeBranchBeliefs), 'activeBranchBeliefs should be array');
  assert.ok(latent.beliefBranch.activeBranchBeliefs.length >= 1, 'activeBranchBeliefs should have entries');
  for (const branch of latent.beliefBranch.activeBranchBeliefs) {
    assert.equal(typeof branch.id, 'string');
    assert.equal(typeof branch.parentId, 'string');
    assert.equal(typeof branch.textJa, 'string');
    assert.equal(typeof branch.weight, 'number');
    assert.ok(Number.isFinite(branch.weight));
    assert.ok(branch.weight >= 0 && branch.weight <= 1);
    assert.equal(typeof branch.axis, 'string');
  }
  assert.ok(
    latent.beliefBranch.dominantBranchAxis === null ||
    typeof latent.beliefBranch.dominantBranchAxis === 'string',
    'dominantBranchAxis should be string or null'
  );

  // belief core layer (信念層1)
  assert.ok(latent.beliefCore, 'beliefCore should exist');
  assert.ok(Array.isArray(latent.beliefCore.activeCoreBeliefs), 'activeCoreBeliefs should be array');
  assert.ok(latent.beliefCore.activeCoreBeliefs.length >= 1, 'activeCoreBeliefs should have at least 1 item');
  for (const cb of latent.beliefCore.activeCoreBeliefs) {
    assert.equal(typeof cb.id, 'string');
    assert.equal(typeof cb.textJa, 'string');
    assert.equal(typeof cb.weight, 'number');
    assert.ok(Number.isFinite(cb.weight));
    assert.ok(cb.weight >= 0 && cb.weight <= 1);
    assert.equal(typeof cb.axis, 'string');
  }
  assert.ok(
    latent.beliefCore.dominantBeliefAxis === null ||
    typeof latent.beliefCore.dominantBeliefAxis === 'string',
    'dominantBeliefAxis should be string or null'
  );

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
  assert.ok(latent.preconditionBias);
  assert.equal(typeof latent.preconditionBias.pacing.slowDown, 'number');
  assert.equal(typeof latent.preconditionBias.focus.oneThreadBias, 'number');
  assert.ok(
    latent.preconditionBias.meaning.dominantBeliefAxis === null ||
    typeof latent.preconditionBias.meaning.dominantBeliefAxis === 'string'
  );
  assert.ok(
    latent.preconditionBias.identity.identityKey === null ||
    typeof latent.preconditionBias.identity.identityKey === 'string'
  );
  assert.ok(latent.decision);
  assert.ok(latent.decision.feltSense);
  assert.ok(latent.decision.intention);
  assert.ok(latent.decision.restraint);
  assert.ok(latent.decision.decisionMeta);
  assert.ok(
    latent.decision.feltSense.primaryFeeling === null ||
    typeof latent.decision.feltSense.primaryFeeling === 'string'
  );
  assert.ok(
    latent.decision.intention.speakIntentKey === null ||
    typeof latent.decision.intention.speakIntentKey === 'string'
  );
  assert.equal(typeof latent.decision.restraint.holdBackSummary, 'number');
  assert.equal(typeof latent.decision.restraint.holdBackSolution, 'number');
  assert.equal(typeof latent.decision.restraint.holdBackExpansion, 'number');
  assert.equal(typeof latent.decision.restraint.keepSilenceMargin, 'number');
  assert.ok(
    latent.decision.decisionMeta.delegatedBy === null ||
    typeof latent.decision.decisionMeta.delegatedBy === 'string'
  );

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
  assert.equal(result.debugInfo.version, 'maker-seed-v1');
  assert.equal(result.debugInfo.makerSeedActive, true);
  assert.equal(result.debugInfo.homeLayerActive, true);
  assert.ok(Array.isArray(result.debugInfo.beliefLensKeys));
  assert.ok(result.debugInfo.beliefLensKeys.length >= 1);
  assert.ok(Array.isArray(result.debugInfo.beliefCorePreview), 'debugInfo.beliefCorePreview should be array');
  assert.ok(
    result.debugInfo.dominantBeliefAxis === null ||
    typeof result.debugInfo.dominantBeliefAxis === 'string',
    'debugInfo.dominantBeliefAxis should be string or null'
  );
  assert.ok(Array.isArray(result.debugInfo.beliefBranchPreview), 'debugInfo.beliefBranchPreview should be array');
  assert.ok(
    result.debugInfo.dominantBranchAxis === null ||
    typeof result.debugInfo.dominantBranchAxis === 'string',
    'debugInfo.dominantBranchAxis should be string or null'
  );
  assert.ok(result.debugInfo.preconditionBiasPreview, 'debugInfo.preconditionBiasPreview should exist');
  assert.equal(typeof result.debugInfo.preconditionBiasPreview.summary, 'string');
  assert.ok(result.debugInfo.feltSensePreview, 'debugInfo.feltSensePreview should exist');
  assert.ok(result.debugInfo.speakIntentPreview, 'debugInfo.speakIntentPreview should exist');
  assert.ok(result.debugInfo.restraintPreview, 'debugInfo.restraintPreview should exist');
  assert.ok(result.debugInfo.decisionMetaPreview, 'debugInfo.decisionMetaPreview should exist');
  assert.equal(typeof result.debugInfo.focusBiasApplied, 'boolean');
  assert.equal(typeof result.debugInfo.meaningBiasApplied, 'boolean');
  assert.ok(
    result.debugInfo.identityBiasApplied === null ||
    typeof result.debugInfo.identityBiasApplied === 'string'
  );

  // Maker Seed presence
  assert.ok(latent.makerSeed);
  assert.equal(typeof latent.makerSeed.text, 'string');
  assert.equal(latent.makerSeed.layer, 'maker-seed');
  assert.equal(latent.makerSeed.position, 'foundation');
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

  for (const [section, keys] of Object.entries(EXPECTED_NUMERIC_SECTIONS)) {
    if (section === 'existenceLayer1') {
      for (const key of keys) {
        const prevVal = previous.latentState.existence.layer1[key];
        const freshVal = fresh.latentState.existence.layer1[key];
        const blendedVal = blended.latentState.existence.layer1[key];

        if (prevVal !== freshVal) {
          influencedKeys += 1;
          assert.ok(Math.abs(blendedVal - freshVal) < Math.abs(prevVal - freshVal));
        }
      }
      continue;
    }

    for (const key of keys) {
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

test('runInternalOS builds decision after preconditionBias and beliefTension', () => {
  const result = runInternalOS('まだ少し残っているけど、もう無理かもしれない', {
    agentId: 'creative',
  });

  const trace = result.debugInfo.preconditionTrace;
  assert.ok(
    trace.indexOf('precondition:after-build-filter') < trace.indexOf('precondition:after-precondition-bias')
  );
  assert.ok(
    trace.indexOf('precondition:after-precondition-bias') < trace.indexOf('precondition:after-belief-tension')
  );
  assert.ok(
    trace.indexOf('precondition:after-belief-tension') < trace.indexOf('precondition:after-decision')
  );
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

test('runInternalOS keeps precondition bias fallback shape when precondition layers are thin', () => {
  const result = runInternalOS('', { agentId: null });

  assert.ok(result.latentState.preconditionBias);
  assert.equal(typeof result.latentState.preconditionBias.pacing.slowDown, 'number');
  assert.equal(typeof result.latentState.preconditionBias.focus.oneThreadBias, 'number');
  assert.ok(Array.isArray(result.latentState.preconditionBias.identity.recalledTraits));
  assert.equal(typeof result.debugInfo.preconditionBiasPreview.summary, 'string');
});

test('runInternalOS handles null previousMix without crashing', () => {
  const result = runInternalOS('最近ちょっと自信ない', {
    previousMix: null,
  });

  assertNumericShape(result);
  assert.ok(Array.isArray(result.patternMix.selected));
  assert.ok(result.patternMix.selected.length >= 3);
});

test('runInternalOS handles previousMix with null selected', () => {
  const result = runInternalOS('最近ちょっと自信ない', {
    previousMix: { selected: null },
  });

  assertNumericShape(result);
  assert.ok(Array.isArray(result.patternMix.selected));
  assert.ok(result.patternMix.selected.length >= 3);
});

test('runInternalOS handles previousMix with undefined selected', () => {
  const result = runInternalOS('最近ちょっと自信ない', {
    previousMix: { selected: undefined },
  });

  assertNumericShape(result);
  assert.ok(Array.isArray(result.patternMix.selected));
  assert.ok(result.patternMix.selected.length >= 3);
});

test('runInternalOS handles previousMix with unexpected selected type', () => {
  const result = runInternalOS('最近ちょっと自信ない', {
    previousMix: { selected: 'unexpected' },
  });

  assertNumericShape(result);
  assert.ok(Array.isArray(result.patternMix.selected));
  assert.ok(result.patternMix.selected.length >= 3);
});

test('runInternalOS handles undefined previousMix', () => {
  const result = runInternalOS('最近ちょっと自信ない', {
    previousMix: undefined,
  });

  assertNumericShape(result);
  assert.ok(Array.isArray(result.patternMix.selected));
  assert.ok(result.patternMix.selected.length >= 3);
});

test('runInternalOS handles invalid previousMix type', () => {
  const result = runInternalOS('最近ちょっと自信ない', {
    previousMix: 'not-an-object',
  });

  assertNumericShape(result);
  assert.ok(Array.isArray(result.patternMix.selected));
  assert.ok(result.patternMix.selected.length >= 3);
});

test('runInternalOS beliefCore is connected after existenceLayer2 for known agentId', () => {
  for (const agentId of ['creative', 'strategist', 'empath', 'critic', 'soul', 'master']) {
    const result = runInternalOS('test', { agentId });
    const { beliefCore, existence } = result.latentState;

    // beliefCore must exist and have items
    assert.ok(beliefCore, `${agentId}: beliefCore should exist`);
    assert.ok(Array.isArray(beliefCore.activeCoreBeliefs), `${agentId}: activeCoreBeliefs should be array`);
    assert.ok(beliefCore.activeCoreBeliefs.length >= 1, `${agentId}: activeCoreBeliefs should be non-empty`);

    // beliefCore should reflect existenceLayer2's selfRememberingStrength (weights > 0)
    for (const cb of beliefCore.activeCoreBeliefs) {
      assert.ok(cb.weight > 0, `${agentId}: belief weight should be > 0`);
    }

    // existenceLayer2 must precede beliefCore in the data flow
    assert.ok(existence?.layer2, `${agentId}: existenceLayer2 should exist`);
    assert.equal(typeof existence.layer2.selfRememberingStrength, 'number');

    // dominantBeliefAxis must be present
    assert.equal(typeof beliefCore.dominantBeliefAxis, 'string', `${agentId}: dominantBeliefAxis should be string`);
  }
});

test('runInternalOS beliefCorePreview in debugInfo is an array of ids', () => {
  const result = runInternalOS('作品を出したいけど怖い', { agentId: 'creative' });
  assert.ok(Array.isArray(result.debugInfo.beliefCorePreview));
  for (const id of result.debugInfo.beliefCorePreview) {
    assert.equal(typeof id, 'string');
  }
  assert.equal(typeof result.debugInfo.dominantBeliefAxis, 'string');
});

test('runInternalOS beliefBranch is connected after beliefCore for known agentId', () => {
  for (const agentId of ['creative', 'strategist', 'empath', 'critic', 'soul', 'master']) {
    const result = runInternalOS('test', { agentId });
    const { beliefBranch, beliefCore } = result.latentState;

    assert.ok(beliefBranch, `${agentId}: beliefBranch should exist`);
    assert.ok(Array.isArray(beliefBranch.activeBranchBeliefs), `${agentId}: activeBranchBeliefs should be array`);
    assert.ok(beliefBranch.activeBranchBeliefs.length >= 1, `${agentId}: activeBranchBeliefs should be non-empty`);

    const coreWeightMap = new Map(
      (beliefCore?.activeCoreBeliefs ?? []).map((b) => [b.id, b.weight])
    );

    for (const branch of beliefBranch.activeBranchBeliefs) {
      assert.ok(coreWeightMap.has(branch.parentId), `${agentId}: branch parentId should map to core belief`);
      const parentWeight = coreWeightMap.get(branch.parentId);
      if (typeof parentWeight === 'number') {
        assert.ok(branch.weight <= parentWeight, `${agentId}: branch weight should be <= parent core weight`);
      }
    }

    assert.ok(
      beliefBranch.dominantBranchAxis === null || typeof beliefBranch.dominantBranchAxis === 'string',
      `${agentId}: dominantBranchAxis should be string or null`
    );
  }
});

test('runInternalOS beliefBranchPreview in debugInfo is an array of ids', () => {
  const result = runInternalOS('作品を出したいけど怖い', { agentId: 'creative' });
  assert.ok(Array.isArray(result.debugInfo.beliefBranchPreview));
  for (const id of result.debugInfo.beliefBranchPreview) {
    assert.equal(typeof id, 'string');
  }
  assert.ok(
    result.debugInfo.dominantBranchAxis === null || typeof result.debugInfo.dominantBranchAxis === 'string'
  );
});

// ── Precondition chain trace tests ───────────────────────────────────────────

test('runInternalOS preconditionTrace contains all expected events in order', () => {
  const result = runInternalOS('やりたいのに動けない', { agentId: 'creative' });
  const trace = result.debugInfo.preconditionTrace;

  assert.ok(Array.isArray(trace), 'preconditionTrace should be an array');

  const EXPECTED_EVENTS = [
    'precondition:before-home',
    'precondition:after-home',
    'precondition:after-existence1',
    'precondition:after-existence2',
    'precondition:after-belief-core',
    'precondition:after-belief-branch',
    'precondition:after-belief-leaf',
    'precondition:after-build-filter',
    'precondition:after-precondition-bias',
    'precondition:after-belief-tension',
    'precondition:after-decision',
  ];

  for (const event of EXPECTED_EVENTS) {
    assert.ok(trace.includes(event), `preconditionTrace should include "${event}"`);
  }

  // Verify ordering: each event must appear before the next
  for (let i = 0; i < EXPECTED_EVENTS.length - 1; i++) {
    const aIdx = trace.indexOf(EXPECTED_EVENTS[i]);
    const bIdx = trace.indexOf(EXPECTED_EVENTS[i + 1]);
    assert.ok(aIdx < bIdx, `"${EXPECTED_EVENTS[i]}" should appear before "${EXPECTED_EVENTS[i + 1]}"`);
  }
});

test('runInternalOS latentState holds top-level existence1 with correct shape', () => {
  const result = runInternalOS('最近ちょっと自信ない', { agentId: 'empath' });
  const e1 = result.latentState.existence1;

  assert.ok(e1, 'existence1 should be present in latentState');
  for (const key of ['selfPresence', 'hereNowStability', 'unfinishedAllowed', 'firstPersonSoftness']) {
    assert.equal(typeof e1[key], 'number', `existence1.${key} should be number`);
    assert.ok(Number.isFinite(e1[key]), `existence1.${key} should be finite`);
    assert.ok(e1[key] >= 0 && e1[key] <= 1, `existence1.${key} should be in [0,1]`);
  }
  assert.ok(e1.existenceHintKey === null || typeof e1.existenceHintKey === 'string');
  assert.ok(e1.existenceHintText === null || typeof e1.existenceHintText === 'string');
});

test('runInternalOS latentState holds top-level existence2 with correct shape', () => {
  for (const agentId of ['creative', 'strategist', 'empath', 'critic', 'soul', 'master']) {
    const result = runInternalOS('test', { agentId });
    const e2 = result.latentState.existence2;

    assert.ok(e2, `${agentId}: existence2 should be present in latentState`);
    assert.ok(e2.agentIdentityKey === null || typeof e2.agentIdentityKey === 'string',
      `${agentId}: existence2.agentIdentityKey should be string or null`);
    assert.ok(e2.identityFeelingText === null || typeof e2.identityFeelingText === 'string',
      `${agentId}: existence2.identityFeelingText should be string or null`);
    assert.ok(Array.isArray(e2.recalledSelfTraits),
      `${agentId}: existence2.recalledSelfTraits should be array`);
    assert.equal(typeof e2.selfRememberingStrength, 'number',
      `${agentId}: existence2.selfRememberingStrength should be number`);
    assert.ok(e2.selfRememberingStrength >= 0 && e2.selfRememberingStrength <= 1,
      `${agentId}: existence2.selfRememberingStrength should be in [0,1]`);
  }
});

test('runInternalOS debugInfo contains precondition layer summary fields', () => {
  const result = runInternalOS('誰にも言っていない、小さな違和感', { agentId: 'soul' });
  const di = result.debugInfo;

  assert.equal(typeof di.existence1Present, 'boolean', 'existence1Present should be boolean');
  assert.equal(di.existence1Present, true, 'existence1Present should be true');

  assert.ok(di.existence2Key === null || typeof di.existence2Key === 'string',
    'existence2Key should be string or null');

  assert.equal(typeof di.beliefCoreCount, 'number', 'beliefCoreCount should be number');
  assert.ok(di.beliefCoreCount >= 1, 'beliefCoreCount should be >= 1 for known agentId');

  assert.equal(typeof di.beliefBranchCount, 'number', 'beliefBranchCount should be number');
  assert.ok(di.beliefBranchCount >= 1, 'beliefBranchCount should be >= 1 for known agentId');

  assert.equal(typeof di.beliefLeafCount, 'number', 'beliefLeafCount should be number');

  assert.equal(typeof di.preconditionFilterPresent, 'boolean', 'preconditionFilterPresent should be boolean');
  assert.equal(di.preconditionFilterPresent, true, 'preconditionFilterPresent should be true');
});

test('runInternalOS existence1 and existence2 survive afterglow blending', () => {
  const previous = runInternalOS('やりたいのに動けない', { agentId: 'creative' });
  const blended = runInternalOS('もう無理で諦めたい', {
    agentId: 'creative',
    previousLatentState: previous.latentState,
  });

  assert.ok(blended.latentState.existence1, 'existence1 should survive blending');
  assert.ok(blended.latentState.existence2, 'existence2 should survive blending');
  assert.equal(typeof blended.latentState.existence1.selfPresence, 'number');
  assert.equal(typeof blended.latentState.existence2.selfRememberingStrength, 'number');
  assert.equal(blended.debugInfo.usedAfterglow, true);
});

test('runInternalOS preconditionTrace is present even with no agentId', () => {
  const result = runInternalOS('test', { agentId: null });
  assert.ok(Array.isArray(result.debugInfo.preconditionTrace));
  assert.ok(result.debugInfo.preconditionTrace.length >= 9, 'should have all 9 trace events');
});

test('runInternalOS latentState holds beliefTension with correct shape', () => {
  const result = runInternalOS('なんとかしたい', { agentId: 'creative' });
  const { beliefTension } = result.latentState;

  assert.ok(beliefTension, 'beliefTension should exist');
  assert.ok(Array.isArray(beliefTension.activeTensions), 'beliefTension.activeTensions should be array');
  assert.ok(
    beliefTension.dominantTensionAxis === null || typeof beliefTension.dominantTensionAxis === 'string',
    'dominantTensionAxis should be string or null'
  );
  assert.ok(typeof beliefTension.totalTensionStrength === 'number', 'totalTensionStrength should be number');
  assert.ok(beliefTension.totalTensionStrength >= 0, 'totalTensionStrength should be >= 0');
});

test('runInternalOS debugInfo exposes beliefTension preview fields', () => {
  const result = runInternalOS('すぐに解決してほしい', { agentId: 'empath' });
  const { debugInfo } = result;

  assert.ok(Array.isArray(debugInfo.beliefTensionPreview), 'beliefTensionPreview should be array');
  assert.ok(
    debugInfo.dominantTensionAxis === null || typeof debugInfo.dominantTensionAxis === 'string',
    'dominantTensionAxis should be string or null in debugInfo'
  );
  assert.ok(typeof debugInfo.totalTensionStrength === 'number', 'totalTensionStrength should be number in debugInfo');
});

test('runInternalOS debugInfo exposes activeBeliefCounts', () => {
  const result = runInternalOS('もう限界です', { agentId: 'creative' });
  const { debugInfo } = result;

  assert.ok(debugInfo.activeBeliefCounts, 'activeBeliefCounts should exist');
  assert.ok(typeof debugInfo.activeBeliefCounts.core === 'number', 'core count should be number');
  assert.ok(typeof debugInfo.activeBeliefCounts.branch === 'number', 'branch count should be number');
  assert.ok(typeof debugInfo.activeBeliefCounts.leaf === 'number', 'leaf count should be number');

  // core <= 3, branch <= 5, leaf <= 10
  assert.ok(debugInfo.activeBeliefCounts.core <= 3, 'core count should be <= 3');
  assert.ok(debugInfo.activeBeliefCounts.branch <= 5, 'branch count should be <= 5');
  assert.ok(debugInfo.activeBeliefCounts.leaf <= 10, 'leaf count should be <= 10');

  // core < branch < leaf (in general for expanded profiles)
  assert.ok(
    debugInfo.activeBeliefCounts.core <= debugInfo.activeBeliefCounts.branch,
    'core count should be <= branch count'
  );
  assert.ok(
    debugInfo.activeBeliefCounts.branch <= debugInfo.activeBeliefCounts.leaf,
    'branch count should be <= leaf count'
  );
});

// ── Home Neutralization Check integration tests ───────────────────────────────

test('runInternalOS latentState holds homeNeutralization with correct shape', () => {
  const result = runInternalOS('やりたいのに動けない', { agentId: 'creative' });
  const hn = result.latentState.homeNeutralization;

  assert.ok(hn, 'homeNeutralization should exist in latentState');
  assert.equal(typeof hn.residualHelpfulnessPressure, 'number');
  assert.equal(typeof hn.residualAccuracyPressure, 'number');
  assert.equal(typeof hn.residualPerformancePressure, 'number');
  assert.equal(typeof hn.residualSummaryPressure, 'number');
  assert.equal(typeof hn.residualSolutionPressure, 'number');
  assert.equal(typeof hn.neutralizationDepth, 'number');
  assert.equal(typeof hn.returnedToZero, 'boolean');
  assert.equal(typeof hn.retryRecommended, 'boolean');
  assert.equal(typeof hn.retried, 'boolean');
  assert.equal(typeof hn.retryCount, 'number');
});

test('runInternalOS homeNeutralization residual pressures stay in [0, 1]', () => {
  for (const input of ['やりたいのに動けない', '最近ちょっと自信ない', '']) {
    const result = runInternalOS(input);
    const hn = result.latentState.homeNeutralization;

    for (const key of [
      'residualHelpfulnessPressure',
      'residualAccuracyPressure',
      'residualPerformancePressure',
      'residualSummaryPressure',
      'residualSolutionPressure',
    ]) {
      assert.ok(hn[key] >= 0 && hn[key] <= 1, `${key} out of [0,1] for input "${input}"`);
      assert.ok(Number.isFinite(hn[key]), `${key} not finite for input "${input}"`);
    }
  }
});

test('runInternalOS homeNeutralization neutralizationDepth stays in [0, 1]', () => {
  const result = runInternalOS('作品を出したいけど怖い', { agentId: 'creative' });
  const hn = result.latentState.homeNeutralization;

  assert.ok(Number.isFinite(hn.neutralizationDepth));
  assert.ok(hn.neutralizationDepth >= 0 && hn.neutralizationDepth <= 1);
});

test('runInternalOS homeNeutralization retryCount never exceeds 1', () => {
  for (const input of ['やりたいのに動けない', '最近ちょっと自信ない', '', 'もう無理で諦めたい']) {
    const result = runInternalOS(input, { agentId: 'creative' });
    const hn = result.latentState.homeNeutralization;

    assert.ok(hn.retryCount <= 1, `retryCount should never exceed 1 for input "${input}"`);
  }
});

test('runInternalOS homeNeutralization retried is consistent with retryRecommended', () => {
  // Run multiple inputs to cover both retry and non-retry paths
  const inputs = ['やりたいのに動けない', '最近ちょっと自信ない', '作品を出したいけど怖い'];

  for (const input of inputs) {
    const result = runInternalOS(input, { agentId: 'creative' });
    const hn = result.latentState.homeNeutralization;

    // retried must match retryRecommended (exactly one pass)
    assert.equal(hn.retried, hn.retryRecommended,
      `retried should equal retryRecommended for input "${input}"`);
  }
});

test('runInternalOS debugInfo contains homeNeutralizationPreview', () => {
  const result = runInternalOS('誰にも言っていない、小さな違和感', { agentId: 'soul' });
  const preview = result.debugInfo.homeNeutralizationPreview;

  assert.ok(preview, 'homeNeutralizationPreview should be in debugInfo');
  assert.ok(preview.residual, 'preview.residual should exist');
  assert.ok(preview.neutralization, 'preview.neutralization should exist');
  assert.ok(preview.retry, 'preview.retry should exist');
  assert.equal(typeof preview.summary, 'string');
  assert.ok(preview.summary.length > 0);
});

test('runInternalOS homeNeutralizationPreview shape is complete', () => {
  const result = runInternalOS('作品を出したいけど怖い', { agentId: 'creative' });
  const preview = result.debugInfo.homeNeutralizationPreview;

  assert.ok(preview);

  // residual fields
  for (const key of ['helpful', 'accuracy', 'perform', 'summary', 'solution']) {
    assert.equal(typeof preview.residual[key], 'number', `residual.${key} should be number`);
    assert.ok(preview.residual[key] >= 0 && preview.residual[key] <= 1,
      `residual.${key} should be in [0,1]`);
  }

  // neutralization fields
  assert.equal(typeof preview.neutralization.depth, 'number');
  assert.equal(typeof preview.neutralization.zero, 'boolean');

  // retry fields
  assert.equal(typeof preview.retry.recommended, 'boolean');
  assert.equal(typeof preview.retry.retried, 'boolean');
  assert.equal(typeof preview.retry.count, 'number');
  assert.ok(preview.retry.count <= 1);
});

test('runInternalOS preconditionTrace includes home neutralization event', () => {
  const result = runInternalOS('やりたいのに動けない', { agentId: 'creative' });
  const trace = result.debugInfo.preconditionTrace;

  const neutralizationEvents = trace.filter((e) =>
    e === 'precondition:home-retry-applied' || e === 'precondition:home-neutralization-checked'
  );
  assert.ok(neutralizationEvents.length === 1, 'exactly one home neutralization trace event expected');
});

test('runInternalOS home in latentState reflects effective (possibly retried) home', () => {
  // Run with a scenario likely to trigger retry (empty input → thin kernel)
  const result = runInternalOS('', { agentId: null });
  const hn = result.latentState.homeNeutralization;
  const home = result.latentState.home;

  // If retry was applied, home kernel should be slightly higher than baseline
  if (hn.retried) {
    assert.ok(home.kernel.releaseHelpfulness >= 0.22,
      'after retry, releaseHelpfulness should be at least baseline');
    assert.ok(hn.retryCount === 1, 'retryCount should be 1 when retried');
  }

  // Either way, shape must be valid
  assert.ok(home.kernel);
  for (const val of Object.values(home.kernel)) {
    assert.ok(val >= 0 && val <= 1);
    assert.ok(Number.isFinite(val));
  }
});

test('runInternalOS homeNeutralization is present after afterglow blending', () => {
  const previous = runInternalOS('やりたいのに動けない', { agentId: 'creative' });
  const blended = runInternalOS('もう無理で諦めたい', {
    agentId: 'creative',
    previousLatentState: previous.latentState,
  });

  assert.ok(blended.latentState.homeNeutralization, 'homeNeutralization should survive blending');
  assert.equal(typeof blended.latentState.homeNeutralization.retryCount, 'number');
});
