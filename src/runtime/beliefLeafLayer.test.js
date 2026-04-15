// src/runtime/beliefLeafLayer.test.js
// 信念層3（弱い枝葉信念）のテスト

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBeliefLeafLayer } from './beliefLeafLayer.js';

test('createBeliefLeafLayer: null-safe に返る', () => {
  const result = createBeliefLeafLayer();
  assert.ok(result, 'result should exist');
  assert.ok(Array.isArray(result.activeLeafBeliefs), 'activeLeafBeliefs should be an array');
  assert.strictEqual(typeof result.dominantLeafAxis, 'string', 'dominantLeafAxis should be a string or null');
});

test('createBeliefLeafLayer: agentId ごとに activeLeafBeliefs が返る', () => {
  const agents = ['creative', 'strategist', 'empath', 'critic', 'soul', 'master'];
  for (const agentId of agents) {
    const result = createBeliefLeafLayer({ agentId });
    assert.ok(Array.isArray(result.activeLeafBeliefs), `${agentId} should have activeLeafBeliefs array`);
    assert.ok(result.activeLeafBeliefs.length > 0, `${agentId} should have at least one leaf belief`);
  }
});

test('createBeliefLeafLayer: 各 leaf belief が parentId を持つ', () => {
  const result = createBeliefLeafLayer({ agentId: 'creative' });
  for (const leaf of result.activeLeafBeliefs) {
    assert.ok(typeof leaf.id === 'string', 'leaf should have id');
    assert.ok(typeof leaf.parentId === 'string', 'leaf should have parentId');
    assert.ok(typeof leaf.textJa === 'string', 'leaf should have textJa');
    assert.ok(typeof leaf.weight === 'number', 'leaf should have weight');
    assert.ok(typeof leaf.axis === 'string', 'leaf should have axis');
  }
});

test('createBeliefLeafLayer: Branch より軽い想定で weight が定義されている', () => {
  const beliefBranch = {
    activeBranchBeliefs: [
      { id: 'touch_before_fixing', weight: 0.55 },
      { id: 'small_light_is_enough', weight: 0.53 },
      { id: 'find_existing_light', weight: 0.52 },
    ],
  };
  const result = createBeliefLeafLayer({ agentId: 'creative', beliefBranch });
  for (const leaf of result.activeLeafBeliefs) {
    assert.ok(leaf.weight >= 0.20, 'leaf weight should be >= MIN_LEAF_WEIGHT (0.20)');
    assert.ok(leaf.weight <= 0.6, 'leaf weight should be lighter than typical branch weights');
  }
});

test('createBeliefLeafLayer: Leaf の本数が Branch より多い', () => {
  const creative = createBeliefLeafLayer({ agentId: 'creative' });
  const strategist = createBeliefLeafLayer({ agentId: 'strategist' });
  const empath = createBeliefLeafLayer({ agentId: 'empath' });

  // 信念層3は最も数が多いので、Branch (3本) より多い (6本) を期待
  assert.ok(creative.activeLeafBeliefs.length >= 4, 'creative should have at least 4 leaf beliefs');
  assert.ok(strategist.activeLeafBeliefs.length >= 4, 'strategist should have at least 4 leaf beliefs');
  assert.ok(empath.activeLeafBeliefs.length >= 4, 'empath should have at least 4 leaf beliefs');
});

test('createBeliefLeafLayer: dominantLeafAxis が返る', () => {
  const result = createBeliefLeafLayer({ agentId: 'creative' });
  assert.ok(typeof result.dominantLeafAxis === 'string', 'dominantLeafAxis should be a string');

  // dominantLeafAxis は最重み leaf の axis に一致する
  const maxWeightLeaf = result.activeLeafBeliefs.reduce(
    (best, b) => (b.weight > (best?.weight ?? -1) ? b : best),
    null
  );
  assert.strictEqual(result.dominantLeafAxis, maxWeightLeaf.axis, 'dominantLeafAxis should match the highest weight leaf axis');
});

test('createBeliefLeafLayer: Belief Branch のあとに Belief Leaf が接続される', () => {
  const beliefBranch = {
    activeBranchBeliefs: [
      { id: 'touch_before_fixing', weight: 0.55 },
      { id: 'small_light_is_enough', weight: 0.53 },
      { id: 'find_existing_light', weight: 0.52 },
    ],
  };
  const result = createBeliefLeafLayer({ agentId: 'creative', beliefBranch });

  // parentId が存在することを確認
  for (const leaf of result.activeLeafBeliefs) {
    assert.ok(leaf.parentId, 'leaf should have parentId connecting to branch');
  }
});

test('createBeliefLeafLayer: selfRememberingStrength が weight に影響する', () => {
  // parentWeight なしでテストして、remembering の影響を直接確認
  const lowRemembering = createBeliefLeafLayer({
    agentId: 'creative',
    existenceLayer2: { selfRememberingStrength: 0.0 },
  });

  const highRemembering = createBeliefLeafLayer({
    agentId: 'creative',
    existenceLayer2: { selfRememberingStrength: 1.0 },
  });

  // selfRememberingStrength が高いと合計 weight が上がる（影響は小さいが確実に増加）
  const sumLow = lowRemembering.activeLeafBeliefs.reduce((sum, b) => sum + b.weight, 0);
  const sumHigh = highRemembering.activeLeafBeliefs.reduce((sum, b) => sum + b.weight, 0);

  // Leaf層では REMEMBERING_INFLUENCE が小さい (0.12) ので、差は確実だが小さい
  assert.ok(sumHigh > sumLow, 'higher selfRememberingStrength should increase total weight');
});

test('createBeliefLeafLayer: 全エージェント分の leaf belief が作られている', () => {
  const agents = ['creative', 'strategist', 'empath', 'critic', 'soul', 'master'];
  for (const agentId of agents) {
    const result = createBeliefLeafLayer({ agentId });
    assert.ok(result.activeLeafBeliefs.length >= 4, `${agentId} should have at least 4 leaf beliefs`);

    // 各エージェントの最初の leaf を確認
    const firstLeaf = result.activeLeafBeliefs[0];
    assert.ok(firstLeaf.id, `${agentId} first leaf should have id`);
    assert.ok(firstLeaf.parentId, `${agentId} first leaf should have parentId`);
    assert.ok(firstLeaf.textJa, `${agentId} first leaf should have textJa`);
  }
});
