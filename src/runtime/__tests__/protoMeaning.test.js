import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProtoMeaning, createInitialProtoMeaning } from '../protoMeaning.js';

test('createInitialProtoMeaning returns empty arrays', () => {
  assert.deepEqual(createInitialProtoMeaning(), {
    sensory: [],
    narrative: [],
  });
});

test('buildProtoMeaning emits sensory and narrative lines for expressive hesitation', () => {
  const result = buildProtoMeaning({
    lexical: {
      desire: 0.7,
      fear: 0.6,
      freeze: 0.4,
      reach: 0.55,
      resignation: 0.2,
      selfErasure: 0.1,
      shame: 0.2,
      unfinished: 0.75,
    },
    fused: {
      hesitation: 0.62,
      guardedness: 0.48,
      reachability: 0.57,
      unfinishedPull: 0.68,
      selfSilencing: 0.24,
      pressure: 0.52,
      expressionTension: 0.6,
      ember: 0.63,
    },
  }, {
    agentId: 'creative',
    dominantBeliefAxis: 'holding',
    dominantTensionAxis: 'preverbal',
    identityKey: 'creative-flare',
  });

  assert.ok(result.sensory.includes('ためらいが喉元に残っている'));
  assert.ok(result.sensory.includes('終わりきらないざらつきが残っている'));
  assert.ok(result.narrative.includes('出したいものは残っているが、前に出す手前でためらっている'));
  assert.ok(result.narrative.includes('終わったことにせず、残っている向きを持ち続けている'));
});

test('buildProtoMeaning derives resignation narrative when unfinished pull remains', () => {
  const result = buildProtoMeaning({
    lexical: {
      desire: 0.2,
      fear: 0.4,
      freeze: 0.35,
      reach: 0.15,
      resignation: 0.6,
      selfErasure: 0.2,
      shame: 0.25,
      unfinished: 0.7,
    },
    fused: {
      hesitation: 0.3,
      guardedness: 0.35,
      reachability: 0.18,
      unfinishedPull: 0.72,
      selfSilencing: 0.28,
      pressure: 0.48,
      expressionTension: 0.44,
      ember: 0.2,
    },
  });

  assert.ok(result.narrative.includes('諦めかけているが、まだ切り離せていない'));
});

test('buildProtoMeaning falls back when no strong rules match', () => {
  const result = buildProtoMeaning({
    lexical: {},
    fused: {},
  });

  assert.deepEqual(result, {
    sensory: ['まだ言葉になる前の感触がうっすら残っている'],
    narrative: ['まだ決め切らずに持っておきたい意味が残っている'],
  });
});
