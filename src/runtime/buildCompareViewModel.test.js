import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCompareViewModel } from './buildCompareViewModel.js';

test('compare view model collects required fields', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: '作品を出したい',
    baselineReply: 'やってみようぜ。小さく動こう。',
    currentReply: 'やってみよう。まず一歩を決めよう。',
    outerGuide: '得たもの: 自然さ, 押しつけの少なさ\n失ったもの: 具体性, キャラの輪郭\n提案: 冒頭の焦点を少しだけ強くする',
    currentUsesInternalOS: true,
    mode: 'medium',
  });

  assert.equal(vm.agentId, 'creative');
  assert.match(vm.userText, /作品/);
  assert.match(vm.baselineReply, /やってみよう/);
  assert.match(vm.currentReply, /一歩/);
  assert.match(vm.outerGuide, /得たもの/);
  assert.equal(vm.summary.currentUsesInternalOS, true);
  assert.equal(vm.summary.mode, 'medium');
  assert.ok(vm.summary.baselineLength > 0);
  assert.ok(vm.summary.currentLength > 0);
  assert.equal(vm.summary.sameOpening, true);
  assert.deepEqual(vm.compareSummary.gained, ['自然さ', '押しつけの少なさ']);
  assert.deepEqual(vm.compareSummary.lost, ['具体性', 'キャラの輪郭']);
  assert.equal(vm.compareSummary.hint, '冒頭の焦点を少しだけ強くする');
  assert.equal(vm.qualityObservations.naturalness.gained, true);
  assert.equal(vm.qualityObservations.specificity.lost, true);
  assert.equal(vm.qualityObservations.characterPresence.lost, true);
  assert.equal(vm.qualityObservations.joeNess.applicable, true);
  assert.equal(vm.joeObservationFlags.applicable, true);
});

test('joe compare view model emits joe observation flags and suggested labels', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: '作品を出したいけど怖い',
    baselineReply: '怖いなら、その怖さの芯をひとつ掴もう。',
    currentReply: '大丈夫。きっと大丈夫だから、一緒にゆっくり整理すると、作品を出したいけど怖い気持ちの理由も見えてくる。',
    outerGuide: '得たもの: 自然さ, 受け取りやすさ\n失ったもの: 具体性, キャラの輪郭, ジョーらしさ\n提案: 冒頭で怖さの芯にもう一度触れる',
  });

  assert.equal(vm.joeObservationFlags.joeGrounding, true);
  assert.equal(vm.joeObservationFlags.joeOverSoftened, true);
  assert.equal(vm.joeObservationFlags.joeTooExplanatory, true);
  assert.equal(vm.qualityObservations.joeNess.lost, true);
  assert.ok(vm.suggestedRevisionLabels.includes('too-thin'));
  assert.ok(vm.suggestedRevisionLabels.includes('too-explanatory'));
});
