import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildNextAfterglow,
  getAfterglowSeed,
} from './afterglow.js';

const SAMPLE_LATENT_STATE = {
  field: { softness: 0.2, depth: 1.4 },
  reaction: { touched: 0.3, protect: 0.8 },
  stance: { receive: 0.5, nudge: 1.2 },
  permission: { noHurry: 0.7, allowPartialUncertainty: -0.2 },
};

const SAMPLE_PATTERN_MIX = {
  selected: [
    { id: 'comfort_soft', group: 'soften', weight: 1.4 },
    { id: 'curious_probe', group: 'probe', weight: 0.3 },
  ],
  dominant: 'comfort_soft',
};

test('buildNextAfterglow returns a plain serializable object', () => {
  const next = buildNextAfterglow({
    latentState: SAMPLE_LATENT_STATE,
    patternMix: SAMPLE_PATTERN_MIX,
    respondingAgentId: 'creative',
  });

  assert.ok(next);
  assert.equal(typeof next.updatedAtMs, 'number');
  assert.ok(Number.isFinite(next.updatedAtMs));
  assert.equal(next.lastRespondingAgentId, 'creative');
  assert.equal(next.turnCount, 1);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(next)));
});

test('afterglow values stay clamped to 0..1 range', () => {
  const next = buildNextAfterglow({
    latentState: SAMPLE_LATENT_STATE,
    patternMix: SAMPLE_PATTERN_MIX,
    respondingAgentId: 'creative',
  });

  for (const section of Object.values(next.lastLatentState)) {
    for (const value of Object.values(section)) {
      assert.ok(value >= 0 && value <= 1);
    }
  }

  for (const item of next.lastPatternMix.selected) {
    assert.ok(item.weight >= 0 && item.weight <= 1);
  }
});

test('getAfterglowSeed is null-safe and returns empty seed', () => {
  const seed = getAfterglowSeed(null);

  assert.deepEqual(seed, { previousMix: null, previousLatentState: null });
});

test('master response does not overwrite non-master continuity', () => {
  const first = buildNextAfterglow({
    latentState: SAMPLE_LATENT_STATE,
    patternMix: SAMPLE_PATTERN_MIX,
    respondingAgentId: 'creative',
  });

  const masterUpdate = buildNextAfterglow({
    previousAfterglow: first,
    latentState: {
      field: { softness: 0.01 },
      reaction: { touched: 0.01 },
      stance: { receive: 0.01 },
      permission: { noHurry: 0.01 },
    },
    patternMix: {
      selected: [{ id: 'structural_map', group: 'structure', weight: 1 }],
      dominant: 'structural_map',
    },
    respondingAgentId: 'master',
    isMaster: true,
  });

  assert.deepEqual(masterUpdate.lastLatentState, first.lastLatentState);
  assert.deepEqual(masterUpdate.lastPatternMix, first.lastPatternMix);
  assert.equal(masterUpdate.turnCount, first.turnCount);
  assert.ok(masterUpdate.updatedAtMs >= first.updatedAtMs);
});
