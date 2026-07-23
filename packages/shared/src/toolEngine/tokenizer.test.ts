import { test } from 'node:test';
import assert from 'node:assert/strict';
import { igniteAndSpread } from './igniteAndSpread.ts';
import type { Tokenizer } from './ignition/ignitionTypes.ts';

// 実 kuromoji は辞書が要るため持ち込まない（指示書09）。最小のモックで挙動だけ確認する。
const mockTokenizer: Tokenizer = {
  toBaseForms: (text) => {
    if (text.includes('しんどすぎ')) return ['しんどい', 'すぎる'];
    if (text.includes('疲れました')) return ['疲れる', 'ます', 'た'];
    return text.split('');
  },
};

test('tokenizer なしで「しんどすぎて」→ サトウの限界系が反応しない', () => {
  const m = igniteAndSpread('しんどすぎて', 'satou');
  assert.equal(m.ignited.length, 0);
});

test('mockTokenizer ありで、原形化される語（しんどい）が反応する', () => {
  const m = igniteAndSpread('しんどすぎて', 'satou', { tokenizer: mockTokenizer });
  assert.ok(m.ignited.includes('belief:麻痺や大丈夫の下に本当の状態がある'));
});

test('tokenizer の有無で、既存の否定・皮肉判定が変わらない（「大丈夫じゃない」は miss のまま）', () => {
  const without = igniteAndSpread('大丈夫じゃない', 'satou');
  const withTokenizer = igniteAndSpread('大丈夫じゃない', 'satou', { tokenizer: mockTokenizer });
  assert.deepEqual(without.ignited, []);
  assert.deepEqual(withTokenizer.ignited, []);
});
