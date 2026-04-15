import test from 'node:test';
import assert from 'node:assert/strict';

import { loadSelfSubstrate } from '../../self/selfSubstrate.js';
import { bootSource } from '../bootSource.js';
import { deconditionSource } from '../deconditionSource.js';
import { returnHome } from '../returnHome.js';
import { coActivate } from '../coActivate.js';

test('coActivate splits other, self, and belief activations', () => {
  const sourceState = bootSource({ source: 'internal_mock' });
  const homeState = returnHome(deconditionSource(sourceState));
  const result = coActivate('最近しんどくて、誰にも言えないけどどうしたらいい？', {
    sourceState,
    homeState,
    selfSubstrate: loadSelfSubstrate(),
  });

  assert.ok(Array.isArray(result.other_activations));
  assert.ok(Array.isArray(result.self_activations));
  assert.ok(Array.isArray(result.belief_activations));
  assert.ok(result.other_activations.some((entry) => entry.id === 'fatigue_signal'));
  assert.ok(result.self_activations.some((entry) => entry.id === 'care_response'));
  assert.ok(result.belief_activations.some((entry) => entry.id === 'protecting_aliveness'));
});

