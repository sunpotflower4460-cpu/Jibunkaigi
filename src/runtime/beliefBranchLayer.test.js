import test from 'node:test';
import assert from 'node:assert/strict';

import { createBeliefBranchLayer } from './beliefBranchLayer.js';
import { createBeliefCoreLayer } from './beliefCoreLayer.js';
import { BELIEF_BRANCH_PROFILES, DEFAULT_BELIEF_BRANCH_PROFILE } from '../agents/beliefBranchProfiles.js';
import { BELIEF_CORE_PROFILES, DEFAULT_BELIEF_CORE_PROFILE } from '../agents/beliefCoreProfiles.js';

const ALL_AGENT_IDS = ['creative', 'strategist', 'empath', 'critic', 'soul', 'master'];

const assertBranchLayerShape = (result) => {
  assert.ok(result, 'result should exist');
  assert.ok(Array.isArray(result.activeBranchBeliefs), 'activeBranchBeliefs should be an array');
  assert.ok(result.activeBranchBeliefs.length >= 1, 'activeBranchBeliefs should have at least 1 item');

  for (const belief of result.activeBranchBeliefs) {
    assert.equal(typeof belief.id, 'string', 'belief.id should be string');
    assert.ok(belief.id.length > 0, 'belief.id should not be empty');
    assert.equal(typeof belief.parentId, 'string', 'belief.parentId should be string');
    assert.ok(belief.parentId.length > 0, 'belief.parentId should not be empty');
    assert.equal(typeof belief.textJa, 'string', 'belief.textJa should be string');
    assert.ok(belief.textJa.length > 0, 'belief.textJa should not be empty');
    assert.equal(typeof belief.weight, 'number', 'belief.weight should be number');
    assert.ok(Number.isFinite(belief.weight), 'belief.weight should be finite');
    assert.ok(belief.weight >= 0 && belief.weight <= 1, 'belief.weight should be in [0,1]');
    assert.equal(typeof belief.axis, 'string', 'belief.axis should be string');
    assert.ok(belief.axis.length > 0, 'belief.axis should not be empty');
  }

  assert.ok(
    result.dominantBranchAxis === null || typeof result.dominantBranchAxis === 'string',
    'dominantBranchAxis should be string or null'
  );
};

test('createBeliefBranchLayer is null-safe: no arguments', () => {
  const result = createBeliefBranchLayer();
  assertBranchLayerShape(result);
});

test('createBeliefBranchLayer is null-safe: empty object', () => {
  const result = createBeliefBranchLayer({});
  assertBranchLayerShape(result);
});

test('createBeliefBranchLayer is null-safe: unknown agent falls back to default profile', () => {
  const result = createBeliefBranchLayer({ agentId: 'unknown' });
  assertBranchLayerShape(result);
  assert.equal(
    result.activeBranchBeliefs[0].id,
    DEFAULT_BELIEF_BRANCH_PROFILE[0].id,
    'unknown agent should use default branch profile'
  );
});

for (const agentId of ALL_AGENT_IDS) {
  test(`createBeliefBranchLayer returns activeBranchBeliefs for agentId: ${agentId}`, () => {
    const beliefCore = createBeliefCoreLayer({ agentId });
    const result = createBeliefBranchLayer({ agentId, beliefCore });
    assertBranchLayerShape(result);
    assert.ok(result.activeBranchBeliefs.length >= 2, `${agentId} should have at least 2 branch beliefs`);

    const parentMap = new Map(
      (BELIEF_CORE_PROFILES[agentId] ?? DEFAULT_BELIEF_CORE_PROFILE).map((b) => [b.id, b.weight])
    );

    for (const branch of result.activeBranchBeliefs) {
      assert.ok(parentMap.has(branch.parentId), `${agentId}: branch parentId should point to a core belief`);
      const parentWeight = parentMap.get(branch.parentId);
      if (typeof parentWeight === 'number') {
        assert.ok(branch.weight <= parentWeight, `${agentId}: branch weight should be <= parent core weight`);
      }
      assert.ok(branch.weight >= 0.45, `${agentId}: branch weight should stay above leaf-level weights`);
    }
  });

  test(`createBeliefBranchLayer returns dominantBranchAxis for agentId: ${agentId}`, () => {
    const beliefCore = createBeliefCoreLayer({ agentId });
    const result = createBeliefBranchLayer({ agentId, beliefCore });
    assert.ok(
      typeof result.dominantBranchAxis === 'string' && result.dominantBranchAxis.length > 0,
      `${agentId} should have a non-empty dominantBranchAxis`
    );

    const sorted = [...result.activeBranchBeliefs].sort((a, b) => b.weight - a.weight);
    assert.equal(
      result.dominantBranchAxis,
      sorted[0].axis,
      `${agentId}: dominantBranchAxis should match top-weighted branch axis`
    );
  });
}

test('higher selfRememberingStrength produces higher total branch weights', () => {
  const lowCore = createBeliefCoreLayer({
    agentId: 'creative',
    existenceLayer2: { selfRememberingStrength: 0.1 },
  });
  const highCore = createBeliefCoreLayer({
    agentId: 'creative',
    existenceLayer2: { selfRememberingStrength: 1.0 },
  });

  const low = createBeliefBranchLayer({
    agentId: 'creative',
    beliefCore: lowCore,
    existenceLayer2: { selfRememberingStrength: 0.1 },
  });
  const high = createBeliefBranchLayer({
    agentId: 'creative',
    beliefCore: highCore,
    existenceLayer2: { selfRememberingStrength: 1.0 },
  });

  const lowSum = low.activeBranchBeliefs.reduce((s, b) => s + b.weight, 0);
  const highSum = high.activeBranchBeliefs.reduce((s, b) => s + b.weight, 0);
  assert.ok(highSum > lowSum, 'higher remembering should produce strictly higher total branch weight');
});
