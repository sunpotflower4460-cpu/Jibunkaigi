import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUniversalOthersMockResponse } from './othersMock.ts';
import type { UniversalOthersRequest } from './othersTypes.ts';

function baseRequest(overrides: Partial<UniversalOthersRequest>): UniversalOthersRequest {
  return {
    sessionId: 's1',
    userText: 'つらい',
    currentAgentId: 'mina',
    modeId: 'dialogue',
    messages: [],
    ...overrides,
  };
}

function agentIds(res: { replies: { agentId: string }[] }): string[] {
  return res.replies.map((r) => r.agentId);
}

test('OTHERS除外: 既に話したミナは結果に含まれない（6声）', () => {
  const res = createUniversalOthersMockResponse(baseRequest({ currentAgentId: 'mina' }));
  const ids = agentIds(res);
  assert.ok(!ids.includes('mina'), 'ミナが除外されていない');
  assert.equal(ids.length, 6);
});

test('OTHERS除外: 既に話したケンは結果に含まれない（6声）', () => {
  const res = createUniversalOthersMockResponse(baseRequest({ currentAgentId: 'ken' }));
  const ids = agentIds(res);
  assert.ok(!ids.includes('ken'));
  assert.equal(ids.length, 6);
});

test('OTHERS除外: currentAgentId が mirror（非concrete）なら除外せず7声', () => {
  const res = createUniversalOthersMockResponse(baseRequest({ currentAgentId: 'mirror' }));
  assert.equal(agentIds(res).length, 7);
});

test('OTHERS除外: currentAgentId が delegate（非concrete）なら除外せず7声', () => {
  const res = createUniversalOthersMockResponse(baseRequest({ currentAgentId: 'delegate' }));
  assert.equal(agentIds(res).length, 7);
});

test('OTHERS除外: targetAgentIds=[mina] かつ cur=mina → 空ガードでミナに戻る', () => {
  const res = createUniversalOthersMockResponse(
    baseRequest({ currentAgentId: 'mina', targetAgentIds: ['mina'] }),
  );
  assert.deepEqual(agentIds(res), ['mina']);
});

test('OTHERS除外: targetAgentIds 指定時もそこから currentAgentId を除外', () => {
  const res = createUniversalOthersMockResponse(
    baseRequest({ currentAgentId: 'mina', targetAgentIds: ['mina', 'ken', 'joe'] }),
  );
  const ids = agentIds(res);
  assert.ok(!ids.includes('mina'));
  assert.deepEqual(ids.sort(), ['joe', 'ken']);
});

test('OTHERS: 返答は各 agentId にラベルとテキストを持つ', () => {
  const res = createUniversalOthersMockResponse(baseRequest({ currentAgentId: 'mirror' }));
  for (const reply of res.replies) {
    assert.ok(reply.agentId);
    assert.ok(reply.agentLabel.length > 0);
    assert.ok(reply.text.length > 0);
  }
  assert.equal(res.source, 'mock-fallback');
});
