import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUniversalConversationPrompt } from './conversationPromptBuilder.ts';
import { toChatMessages } from './providerAdapter.ts';
import type { UniversalPromptMessage } from './promptTypes.ts';

const VOICE_HEADING = '## この会話での、あなたの声';

const conversation: UniversalPromptMessage[] = [
  { role: 'user', text: '仕事がしんどい' },
  { role: 'agent', text: 'サトウの一言目。', agentId: 'satou', agentLabel: 'サトウ' },
  { role: 'user', text: 'でも辞められない' },
  { role: 'agent', text: 'ミナの返答。', agentId: 'mina', agentLabel: 'ミナ' },
  { role: 'agent', text: 'サトウの二言目。', agentId: 'satou', agentLabel: 'サトウ' },
  { role: 'agent', text: 'OTHERSのサトウの反応。', agentId: 'satou', agentLabel: 'サトウ', origin: 'others' },
  { role: 'user', text: 'どうしよう' },
  { role: 'agent', text: 'サトウの三言目。', agentId: 'satou', agentLabel: 'サトウ' },
  { role: 'agent', text: 'agentId の無い古いサトウの返答。', agentLabel: 'サトウ' },
];

function build(voiceCarryover: boolean | undefined, messages = conversation, agentId: 'satou' | 'ken' = 'satou') {
  return buildUniversalConversationPrompt({
    userText: 'もう少し話したい',
    agentId,
    modeId: 'dialogue',
    messages,
    voiceCarryover,
  });
}

test('voiceCarryover=false（または未指定）なら「あなたの声」セクションは入らない', () => {
  for (const flag of [false, undefined]) {
    const built = build(flag);
    assert.doesNotMatch(built.prompt, new RegExp(VOICE_HEADING));
    assert.equal(built.sections.voice, '');
  }
});

test('voiceCarryover=true でも、自分の過去の返答が無ければ入らない', () => {
  const built = build(true, conversation, 'ken');
  assert.doesNotMatch(built.prompt, new RegExp(VOICE_HEADING));
  const onlyUser = build(true, [{ role: 'user', text: 'はじめまして' }]);
  assert.doesNotMatch(onlyUser.prompt, new RegExp(VOICE_HEADING));
});

test('他のエージェントの返答と OTHERS の反応は見本に入らない', () => {
  const voice = build(true).sections.voice;
  assert.ok(voice.length > 0);
  assert.doesNotMatch(voice, /ミナの返答/);
  assert.doesNotMatch(voice, /OTHERSのサトウの反応/);
});

test('見本は最大3件（直近の3件）', () => {
  const voice = build(true).sections.voice;
  assert.doesNotMatch(voice, /サトウの一言目/);
  assert.match(voice, /サトウの二言目/);
  assert.match(voice, /サトウの三言目/);
  assert.match(voice, /agentId の無い古いサトウの返答/, 'agentId が無ければ agentLabel で絞る');
});

test('許可の文言で、folded では body の「直近の会話」の直前に入る', () => {
  const built = build(true);
  assert.match(built.sections.voice, /この会話で、あなたはすでにこう話してきた。同じ声のまま、続けていい。/);
  const body = built.layers.body;
  const voiceAt = body.indexOf(VOICE_HEADING);
  const historyAt = body.indexOf('## 直近の会話');
  assert.ok(voiceAt > 0 && voiceAt < historyAt);
  assert.ok(body.slice(voiceAt, historyAt).trimEnd().endsWith('サトウの三言目。\n\nagentId の無い古いサトウの返答。'));
});

test('split では developer の中（直近の会話の直前）に入り、user には入らない', () => {
  const messages = toChatMessages(build(true), 'split');
  const developer = messages.find((m) => m.role === 'developer')?.content ?? '';
  const user = messages.find((m) => m.role === 'user')?.content ?? '';
  assert.ok(developer.indexOf(VOICE_HEADING) >= 0);
  assert.ok(developer.indexOf(VOICE_HEADING) < developer.indexOf('## 直近の会話'));
  assert.doesNotMatch(user, new RegExp(VOICE_HEADING));
});

test('見本の各返答は上限で切られる', () => {
  const long = 'あ'.repeat(2_000);
  const built = build(true, [{ role: 'agent', text: long, agentId: 'satou', agentLabel: 'サトウ' }]);
  assert.ok(built.sections.voice.length < 600);
  assert.match(built.sections.voice, /…$/);
});
