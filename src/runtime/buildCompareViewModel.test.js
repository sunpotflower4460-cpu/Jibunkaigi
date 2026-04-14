import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCompareViewModel } from './buildCompareViewModel.js';

test('compare view model collects required fields', () => {
  const vm = buildCompareViewModel({
    agentId: 'creative',
    userText: '作品を出したい',
    baselineReply: 'やってみようぜ。小さく動こう。',
    currentReply: 'やってみよう。まず一歩を決めよう。',
    outerGuide: '自然さは増したが具体が薄れた。',
    currentUsesInternalOS: true,
    mode: 'medium',
  });

  assert.equal(vm.agentId, 'creative');
  assert.match(vm.userText, /作品/);
  assert.match(vm.baselineReply, /やってみよう/);
  assert.match(vm.currentReply, /一歩/);
  assert.match(vm.outerGuide, /自然さ/);
  assert.equal(vm.summary.currentUsesInternalOS, true);
  assert.equal(vm.summary.mode, 'medium');
  assert.ok(vm.summary.baselineLength > 0);
  assert.ok(vm.summary.currentLength > 0);
  assert.equal(vm.summary.sameOpening, true);
});
