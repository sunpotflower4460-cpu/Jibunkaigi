import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveShelfSession } from './shelfSession';

interface SessionLike {
  id: string;
  title: string;
  messages: { text: string }[];
}

const activeSession: SessionLike = {
  id: 'a',
  title: '今の問い',
  messages: [{ text: '今日は少し疲れた' }],
};
// 一覧のエントリは本文を持たない（Firestore の listSessions は messages: []）。
const listedActive: SessionLike = { ...activeSession, messages: [] };
const listedOther: SessionLike = { id: 'b', title: '別の問い', messages: [] };
const otherMessages = [{ text: '別の会話で話したこと' }];

test('開いている会話を選んでいるときは、その本文を返す', () => {
  const result = resolveShelfSession({
    activeSession,
    listedSessions: [listedActive, listedOther],
    selectedSessionId: 'a',
    loadedMessages: null,
  });
  assert.equal(result.session, activeSession);
  assert.equal(result.messages, activeSession.messages);
  assert.equal(result.messagesLoaded, true);
});

test('別の会話を選び、その本文を読み込み済みのときは、一覧のタイトルと読み込んだ本文を返す', () => {
  const result = resolveShelfSession({
    activeSession,
    listedSessions: [listedActive, listedOther],
    selectedSessionId: 'b',
    loadedMessages: { sessionId: 'b', messages: otherMessages },
  });
  assert.equal(result.session, listedOther);
  assert.equal(result.messages, otherMessages);
  assert.equal(result.messagesLoaded, true);
});

test('別の会話を選んでいて本文が未読み込みのときは、一覧の本文を使わず読み込み済みとしない', () => {
  const result = resolveShelfSession({
    activeSession,
    listedSessions: [listedActive, listedOther],
    selectedSessionId: 'b',
    loadedMessages: null,
  });
  assert.equal(result.session, listedOther);
  assert.deepEqual(result.messages, []);
  assert.equal(result.messagesLoaded, false);
});

test('読み込んだ本文が別の会話のものなら使わない', () => {
  const result = resolveShelfSession({
    activeSession,
    listedSessions: [listedActive, listedOther],
    selectedSessionId: 'b',
    loadedMessages: { sessionId: 'a', messages: activeSession.messages },
  });
  assert.equal(result.session, listedOther);
  assert.deepEqual(result.messages, []);
  assert.equal(result.messagesLoaded, false);
});

test('一覧にない id のときは、開いている会話のタイトルを返し、本文は読み込み済みとしない', () => {
  const result = resolveShelfSession({
    activeSession,
    listedSessions: [listedActive],
    selectedSessionId: 'missing',
    loadedMessages: null,
  });
  assert.equal(result.session, activeSession);
  assert.deepEqual(result.messages, []);
  assert.equal(result.messagesLoaded, false);
});

test('何も選ばれていないときは、開いている会話の本文を返す', () => {
  const result = resolveShelfSession({
    activeSession,
    listedSessions: [listedActive, listedOther],
    selectedSessionId: null,
    loadedMessages: null,
  });
  assert.equal(result.session, activeSession);
  assert.equal(result.messages, activeSession.messages);
  assert.equal(result.messagesLoaded, true);
});
