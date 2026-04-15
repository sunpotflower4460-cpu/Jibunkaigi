import test from 'node:test';
import assert from 'node:assert/strict';

import { createBeliefCoreLayer } from './beliefCoreLayer.js';
import { BELIEF_CORE_PROFILES, DEFAULT_BELIEF_CORE_PROFILE } from '../agents/beliefCoreProfiles.js';

const ALL_AGENT_IDS = ['creative', 'strategist', 'empath', 'critic', 'soul', 'master'];

// ── shape helpers ──────────────────────────────────────────────────────────

const assertBeliefCoreShape = (result) => {
  assert.ok(result, 'result should exist');
  assert.ok(Array.isArray(result.activeCoreBeliefs), 'activeCoreBeliefs should be an array');
  assert.ok(result.activeCoreBeliefs.length >= 1, 'activeCoreBeliefs should have at least 1 item');

  for (const belief of result.activeCoreBeliefs) {
    assert.equal(typeof belief.id, 'string', 'belief.id should be string');
    assert.ok(belief.id.length > 0, 'belief.id should not be empty');
    assert.equal(typeof belief.textJa, 'string', 'belief.textJa should be string');
    assert.ok(belief.textJa.length > 0, 'belief.textJa should not be empty');
    assert.equal(typeof belief.weight, 'number', 'belief.weight should be number');
    assert.ok(Number.isFinite(belief.weight), 'belief.weight should be finite');
    assert.ok(belief.weight >= 0 && belief.weight <= 1, 'belief.weight should be in [0,1]');
    assert.equal(typeof belief.axis, 'string', 'belief.axis should be string');
    assert.ok(belief.axis.length > 0, 'belief.axis should not be empty');
  }

  assert.ok(
    result.dominantBeliefAxis === null || typeof result.dominantBeliefAxis === 'string',
    'dominantBeliefAxis should be string or null'
  );
};

// ── null safety ───────────────────────────────────────────────────────────

test('createBeliefCoreLayer is null-safe: no arguments', () => {
  const result = createBeliefCoreLayer();
  assertBeliefCoreShape(result);
});

test('createBeliefCoreLayer is null-safe: empty object', () => {
  const result = createBeliefCoreLayer({});
  assertBeliefCoreShape(result);
});

test('createBeliefCoreLayer is null-safe: null agentId', () => {
  const result = createBeliefCoreLayer({ agentId: null });
  assertBeliefCoreShape(result);
});

test('createBeliefCoreLayer is null-safe: undefined agentId', () => {
  const result = createBeliefCoreLayer({ agentId: undefined });
  assertBeliefCoreShape(result);
});

test('createBeliefCoreLayer is null-safe: unknown agentId falls back to default', () => {
  const result = createBeliefCoreLayer({ agentId: 'unknown_agent' });
  assertBeliefCoreShape(result);
  assert.equal(
    result.activeCoreBeliefs[0].id,
    DEFAULT_BELIEF_CORE_PROFILE[0].id,
    'unknown agent should use default profile'
  );
});

test('createBeliefCoreLayer is null-safe: null existenceLayer2', () => {
  const result = createBeliefCoreLayer({ agentId: 'creative', existenceLayer2: null });
  assertBeliefCoreShape(result);
});

test('createBeliefCoreLayer is null-safe: existenceLayer2 with no selfRememberingStrength', () => {
  const result = createBeliefCoreLayer({ agentId: 'creative', existenceLayer2: {} });
  assertBeliefCoreShape(result);
});

// ── per-agent profiles ────────────────────────────────────────────────────

for (const agentId of ALL_AGENT_IDS) {
  test(`createBeliefCoreLayer returns activeCoreBeliefs for agentId: ${agentId}`, () => {
    const result = createBeliefCoreLayer({ agentId });
    assertBeliefCoreShape(result);
    assert.ok(
      result.activeCoreBeliefs.length >= 1,
      `${agentId} should have at least 1 core belief`
    );
  });

  test(`createBeliefCoreLayer returns dominantBeliefAxis for agentId: ${agentId}`, () => {
    const result = createBeliefCoreLayer({ agentId });
    assert.ok(
      typeof result.dominantBeliefAxis === 'string' && result.dominantBeliefAxis.length > 0,
      `${agentId} should have a non-empty dominantBeliefAxis`
    );
  });
}

// ── axis coverage per agent ───────────────────────────────────────────────

test('each agent profile has at least identity, mission, and one more axis', () => {
  for (const agentId of ALL_AGENT_IDS) {
    const profile = BELIEF_CORE_PROFILES[agentId];
    assert.ok(Array.isArray(profile), `${agentId} profile should be an array`);
    assert.ok(profile.length >= 1, `${agentId} profile should have at least 1 entry`);

    const axes = profile.map((b) => b.axis);
    assert.ok(axes.includes('identity'), `${agentId} should have an identity belief`);
    assert.ok(axes.includes('mission'), `${agentId} should have a mission belief`);
  }
});

// ── dominantBeliefAxis is the axis of the highest-weight belief ───────────

test('dominantBeliefAxis corresponds to the highest-weight belief axis', () => {
  for (const agentId of ALL_AGENT_IDS) {
    const result = createBeliefCoreLayer({ agentId });
    const sorted = [...result.activeCoreBeliefs].sort((a, b) => b.weight - a.weight);
    assert.equal(
      result.dominantBeliefAxis,
      sorted[0].axis,
      `${agentId}: dominantBeliefAxis should match top-weighted belief axis`
    );
  }
});

// ── existenceLayer2 selfRememberingStrength influences weight ─────────────

test('higher selfRememberingStrength produces higher weights', () => {
  const low = createBeliefCoreLayer({
    agentId: 'creative',
    existenceLayer2: { selfRememberingStrength: 0.1 },
  });
  const high = createBeliefCoreLayer({
    agentId: 'creative',
    existenceLayer2: { selfRememberingStrength: 1.0 },
  });

  const lowSum = low.activeCoreBeliefs.reduce((s, b) => s + b.weight, 0);
  const highSum = high.activeCoreBeliefs.reduce((s, b) => s + b.weight, 0);
  assert.ok(highSum >= lowSum, 'higher remembering should produce higher or equal total weight');
});

// ── default profile ───────────────────────────────────────────────────────

test('DEFAULT_BELIEF_CORE_PROFILE has at least 1 entry and correct shape', () => {
  assert.ok(Array.isArray(DEFAULT_BELIEF_CORE_PROFILE));
  assert.ok(DEFAULT_BELIEF_CORE_PROFILE.length >= 1);
  for (const b of DEFAULT_BELIEF_CORE_PROFILE) {
    assert.equal(typeof b.id, 'string');
    assert.equal(typeof b.textJa, 'string');
    assert.equal(typeof b.weight, 'number');
    assert.equal(typeof b.axis, 'string');
  }
});
