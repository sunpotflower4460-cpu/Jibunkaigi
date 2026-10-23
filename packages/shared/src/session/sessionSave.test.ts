import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeSavedSession } from './sessionSave';

interface SessionLike {
  id: string;
  title: string;
  updatedAt: number;
  pinned?: boolean;
  messages: { id: string; text: string }[];
}

const stored: SessionLike = {
  id: 's1',
  title: '今の問い',
  updatedAt: 1,
  messages: [{ id: 'm1', text: '最初の発話' }, { id: 'm2', text: '次の発話' }],
};

test('本文を持たない更新でも、保存済みの本文を消さない', () => {
  // 送信・改名・ピン留めなどは messages: [] で保存を呼ぶ（Firestore の merge と同じく本文は書かない）。
  const merged = mergeSavedSession(stored, { ...stored, messages: [], updatedAt: 2 });
  assert.deepEqual(merged.messages, stored.messages);
  assert.equal(merged.updatedAt, 2);
});

test('タイトルなどの表示用の項目は、渡された値で更新する', () => {
  const merged = mergeSavedSession(stored, {
    ...stored,
    messages: [],
    title: '改名した問い',
    pinned: true,
  });
  assert.equal(merged.title, '改名した問い');
  assert.equal(merged.pinned, true);
});

test('まだ保存されていない会話は、本文を持たない形で保存する', () => {
  const created: SessionLike = { id: 's2', title: '新しい問い', updatedAt: 3, messages: [] };
  const merged = mergeSavedSession(undefined, created);
  assert.deepEqual(merged.messages, []);
  assert.equal(merged.title, '新しい問い');
});
