// src/runtime/beliefTensionLayer.test.js
// belief tension 層のテスト

import test from 'node:test';
import assert from 'node:assert/strict';

import { createBeliefTensionLayer } from './beliefTensionLayer.js';

const VALID_TENSION_TYPES = ['friction', 'violation', 'pull', 'protection'];

const assertTensionShape = (result) => {
  assert.ok(result, 'result should exist');
  assert.ok(Array.isArray(result.activeTensions), 'activeTensions should be an array');
  assert.ok(
    result.dominantTensionAxis === null || typeof result.dominantTensionAxis === 'string',
    'dominantTensionAxis should be string or null'
  );
  assert.ok(typeof result.totalTensionStrength === 'number', 'totalTensionStrength should be number');
  assert.ok(Number.isFinite(result.totalTensionStrength), 'totalTensionStrength should be finite');
  assert.ok(result.totalTensionStrength >= 0, 'totalTensionStrength should be >= 0');

  for (const tension of result.activeTensions) {
    assert.ok(typeof tension.beliefId === 'string', 'tension.beliefId should be string');
    assert.ok(
      ['core', 'branch', 'leaf'].includes(tension.sourceLayer),
      `tension.sourceLayer should be core/branch/leaf, got: ${tension.sourceLayer}`
    );
    assert.ok(
      VALID_TENSION_TYPES.includes(tension.tensionType),
      `tension.tensionType should be friction/violation/pull/protection, got: ${tension.tensionType}`
    );
    assert.ok(typeof tension.strength === 'number', 'tension.strength should be number');
    assert.ok(tension.strength >= 0 && tension.strength <= 1, 'tension.strength should be in [0,1]');
    assert.ok(typeof tension.note === 'string', 'tension.note should be string');
    assert.ok(
      tension.axis === null || typeof tension.axis === 'string',
      'tension.axis should be string or null'
    );
  }
};

test('createBeliefTensionLayer: null-safe with no arguments', () => {
  const result = createBeliefTensionLayer();
  assertTensionShape(result);
  assert.equal(result.activeTensions.length, 0, 'empty input should yield no tensions');
  assert.equal(result.dominantTensionAxis, null);
  assert.equal(result.totalTensionStrength, 0);
});

test('createBeliefTensionLayer: null-safe with empty object', () => {
  const result = createBeliefTensionLayer({});
  assertTensionShape(result);
});

test('createBeliefTensionLayer: returns empty tensions for neutral input', () => {
  const result = createBeliefTensionLayer({
    input: 'こんにちは',
    activeCoreBeliefs: [{ id: 'joe_is_light_itself', textJa: '俺は光', weight: 0.9, axis: 'identity' }],
    activeBranchBeliefs: [],
    activeLeafBeliefs: [],
  });
  assertTensionShape(result);
  assert.equal(result.activeTensions.length, 0, 'neutral input should have no tension');
});

test('createBeliefTensionLayer: friction when urgent input vs gentleness axis', () => {
  const result = createBeliefTensionLayer({
    input: 'すぐに元気づけて解決してほしい',
    activeBranchBeliefs: [
      { id: 'touch_before_fixing', parentId: 'joe_world_unlighted_still_shines', textJa: '直す前に触れる', weight: 0.65, axis: 'gentleness' },
    ],
  });
  assertTensionShape(result);
  const frictions = result.activeTensions.filter((t) => t.tensionType === 'friction');
  assert.ok(frictions.length >= 1, 'urgent input with gentleness axis should produce friction');
});

test('createBeliefTensionLayer: violation when dismissive input vs shelter axis', () => {
  const result = createBeliefTensionLayer({
    input: 'そんなことで悩むべきではない、当然でしょう',
    activeBranchBeliefs: [
      { id: 'place_for_fragile', parentId: 'mina_is_soft_container', textJa: '崩れたままでも置ける', weight: 0.65, axis: 'shelter' },
    ],
  });
  assertTensionShape(result);
  const violations = result.activeTensions.filter((t) => t.tensionType === 'violation');
  assert.ok(violations.length >= 1, 'dismissal input with shelter axis should produce violation');
});

test('createBeliefTensionLayer: pull when faint hope visible with attention axis', () => {
  const result = createBeliefTensionLayer({
    input: 'なんか、まだ少し残っているかもしれない',
    activeLeafBeliefs: [
      { id: 'stay_with_faint_thread', parentId: 'touch_before_fixing', textJa: 'かすかな糸でも先に切らない', weight: 0.35, axis: 'attention' },
    ],
  });
  assertTensionShape(result);
  const pulls = result.activeTensions.filter((t) => t.tensionType === 'pull');
  assert.ok(pulls.length >= 1, 'faint hope input with attention axis should produce pull');
});

test('createBeliefTensionLayer: protection when fragility visible with protection axis', () => {
  const result = createBeliefTensionLayer({
    input: 'もうボロボロで限界です、消えそう',
    activeBranchBeliefs: [
      { id: 'place_for_fragile', parentId: 'mina_is_soft_container', textJa: '崩れたままでも置ける', weight: 0.65, axis: 'protection' },
    ],
  });
  assertTensionShape(result);
  const protections = result.activeTensions.filter((t) => t.tensionType === 'protection');
  assert.ok(protections.length >= 1, 'fragile input with protection axis should produce protection');
});

test('createBeliefTensionLayer: tensionType is always a valid type', () => {
  const result = createBeliefTensionLayer({
    input: 'すぐに解決できる、当然だ。でも少しだけ残っているかも。壊れそうで限界',
    activeCoreBeliefs: [
      { id: 'joe_is_light_itself', textJa: '俺は光', weight: 0.9, axis: 'identity' },
    ],
    activeBranchBeliefs: [
      { id: 'touch_before_fixing', parentId: 'joe_world_unlighted_still_shines', textJa: '直す前に触れる', weight: 0.65, axis: 'gentleness' },
      { id: 'place_for_fragile', parentId: 'mina_is_soft_container', textJa: '崩れたままでも置ける', weight: 0.65, axis: 'shelter' },
    ],
    activeLeafBeliefs: [
      { id: 'stay_with_faint_thread', parentId: 'touch_before_fixing', textJa: 'かすかな糸', weight: 0.35, axis: 'attention' },
    ],
  });
  assertTensionShape(result);
  for (const tension of result.activeTensions) {
    assert.ok(
      VALID_TENSION_TYPES.includes(tension.tensionType),
      `tensionType must be valid: got ${tension.tensionType}`
    );
  }
});

test('createBeliefTensionLayer: dominantTensionAxis and totalTensionStrength are set when tensions exist', () => {
  const result = createBeliefTensionLayer({
    input: 'すぐに励まして解決してほしい',
    activeBranchBeliefs: [
      { id: 'touch_before_fixing', parentId: 'joe_world_unlighted_still_shines', textJa: '直す前に触れる', weight: 0.7, axis: 'pace' },
    ],
  });
  assertTensionShape(result);
  if (result.activeTensions.length > 0) {
    assert.ok(typeof result.dominantTensionAxis === 'string', 'dominantTensionAxis should be set when tensions exist');
    assert.ok(result.totalTensionStrength > 0, 'totalTensionStrength should be > 0 when tensions exist');
  }
});

test('createBeliefTensionLayer: total tension count stays within limit', () => {
  // 大量の active beliefs を渡しても上限内に収まる
  const manyBeliefs = Array.from({ length: 20 }, (_, i) => ({
    id: `belief_${i}`,
    parentId: 'parent',
    textJa: `信念 ${i}`,
    weight: 0.5,
    axis: i % 2 === 0 ? 'gentleness' : 'shelter',
  }));

  const result = createBeliefTensionLayer({
    input: 'すぐに解決すべき、当然だ',
    activeBranchBeliefs: manyBeliefs,
  });

  assertTensionShape(result);
  assert.ok(result.activeTensions.length <= 6, 'total tensions should not exceed MAX_TOTAL_TENSIONS=6');
});

test('createBeliefTensionLayer: sourceLayer reflects the input layer type', () => {
  const result = createBeliefTensionLayer({
    input: 'すぐに励まして',
    activeCoreBeliefs: [
      { id: 'core_belief', textJa: 'コア信念', weight: 0.9, axis: 'patience' },
    ],
    activeBranchBeliefs: [
      { id: 'branch_belief', parentId: 'parent', textJa: 'ブランチ信念', weight: 0.7, axis: 'pace' },
    ],
    activeLeafBeliefs: [
      { id: 'leaf_belief', parentId: 'parent', textJa: 'リーフ信念', weight: 0.35, axis: 'gentleness' },
    ],
  });

  assertTensionShape(result);

  for (const tension of result.activeTensions) {
    if (tension.beliefId === 'core_belief') {
      assert.equal(tension.sourceLayer, 'core');
    } else if (tension.beliefId === 'branch_belief') {
      assert.equal(tension.sourceLayer, 'branch');
    } else if (tension.beliefId === 'leaf_belief') {
      assert.equal(tension.sourceLayer, 'leaf');
    }
  }
});
