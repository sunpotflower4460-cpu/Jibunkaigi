import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveOthersTarget,
  type OthersTargetMessage,
} from './resolveOthersTarget.ts';

const conv: OthersTargetMessage[] = [
  { id: 'u1', role: 'user', text: '最初の問い' },
  { id: 'a1', role: 'agent', text: 'ミナの返答', agentId: 'mina', origin: 'direct' },
  { id: 'u2', role: 'user', text: '次の問い' },
  { id: 'a2', role: 'agent', text: 'ケンの返答', agentId: 'ken', origin: 'direct' },
];

test('ケース1: user message 直下 → その text、除外なし', () => {
  const r = resolveOthersTarget(conv, 'u2');
  assert.equal(r?.userText, '次の問い');
  assert.equal(r?.excludeAgentId, undefined);
});

test('ケース2: direct agent 直下 → 直前 user の text、その声を除外', () => {
  const r = resolveOthersTarget(conv, 'a1');
  assert.equal(r?.userText, '最初の問い');
  assert.equal(r?.excludeAgentId, 'mina');
});

test('ケース2: 2番目の agent 直下 → 直前 user の text、ken を除外', () => {
  const r = resolveOthersTarget(conv, 'a2');
  assert.equal(r?.userText, '次の問い');
  assert.equal(r?.excludeAgentId, 'ken');
});

test('ケース3: others origin の agent 直下 → null（OTHERS から OTHERS を出さない）', () => {
  const withOthers: OthersTargetMessage[] = [
    ...conv,
    { id: 'a3', role: 'agent', text: '他の声', agentId: 'joe', origin: 'others' },
  ];
  assert.equal(resolveOthersTarget(withOthers, 'a3'), null);
});

test('ケース4: messageId なし → 最後の user、除外は undefined（呼び出し側が補完）', () => {
  const r = resolveOthersTarget(conv);
  assert.equal(r?.userText, '次の問い');
  assert.equal(r?.excludeAgentId, undefined);
});

test('存在しない messageId → 最後の user にフォールバック', () => {
  const r = resolveOthersTarget(conv, 'does-not-exist');
  assert.equal(r?.userText, '次の問い');
});

test('user 発話が一つも無い → null', () => {
  const noUser: OthersTargetMessage[] = [
    { id: 'a1', role: 'agent', text: '声', agentId: 'ray', origin: 'direct' },
  ];
  assert.equal(resolveOthersTarget(noUser), null);
});

test('mirror の agent 直下 → 除外は undefined（mirror は具体エージェントでない）', () => {
  const withMirror: OthersTargetMessage[] = [
    { id: 'u1', role: 'user', text: '問い' },
    { id: 'm1', role: 'agent', text: '鏡', agentId: 'mirror', origin: 'direct' },
  ];
  const r = resolveOthersTarget(withMirror, 'm1');
  assert.equal(r?.userText, '問い');
  assert.equal(r?.excludeAgentId, undefined);
});
