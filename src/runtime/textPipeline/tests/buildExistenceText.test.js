// src/runtime/textPipeline/tests/buildExistenceText.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExistenceText } from '../buildExistenceText.js';

test('buildExistenceText: generates text from existence2', () => {
  const latentState = {
    existence2: {
      identityFeelingText: '自分は観察する人',
      recalledSelfTraits: ['静かに見る', '言葉を選ぶ'],
    },
    beliefCore: {
      dominantBeliefAxis: 'illumination',
    },
  };

  const result = buildExistenceText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(result.includes('自分は観察する人'), 'should include identityFeelingText');
  assert.ok(result.includes('静かに見る'), 'should include recalledSelfTraits');
  assert.ok(result.includes('光が届かない場所に目が向く'), 'should include axis feeling');
});

test('buildExistenceText: handles empty existence2', () => {
  const latentState = {
    existence2: {},
    beliefCore: {},
  };

  const result = buildExistenceText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.strictEqual(result, '', 'should return empty string');
});

test('buildExistenceText: limits traits to 2', () => {
  const latentState = {
    existence2: {
      recalledSelfTraits: ['trait1', 'trait2', 'trait3', 'trait4'],
    },
  };

  const result = buildExistenceText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  const traitCount = (result.match(/trait/g) || []).length;
  assert.ok(traitCount <= 2, 'should include at most 2 traits');
});

test('buildExistenceText: handles missing latentState', () => {
  const result = buildExistenceText();

  assert.ok(typeof result === 'string', 'should return string');
  assert.strictEqual(result, '', 'should return empty string');
});
