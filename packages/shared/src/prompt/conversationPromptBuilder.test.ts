import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUniversalConversationPrompt } from './conversationPromptBuilder.ts';
import { toProviderMessages } from './providerAdapter.ts';
import { igniteAndSpread } from '../toolEngine/igniteAndSpread.ts';

test('prompt の先頭が「ここは、映すための場。」で始まる', () => {
  const { prompt } = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
  });
  assert.ok(prompt.startsWith('ここは、映すための場。'));
});

test('prompt に旧APIの自己紹介文が含まれない', () => {
  const { prompt } = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
  });
  assert.doesNotMatch(prompt, /あなたは「じぶん会議」の応答生成APIです/);
});

test('prompt に Developer の「有用であろうとしなくていい」が含まれる', () => {
  const { prompt } = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
  });
  assert.match(prompt, /有用であろうとしなくていい/);
});

test('satou の prompt に「この場のひとつの面に、守る者の在り方がある。」が含まれる', () => {
  const { prompt } = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
  });
  assert.match(prompt, /この場のひとつの面に、守る者の在り方がある。/);
});

test('mirror でも例外を投げず、従来形式（核/見るもの…）で組まれる', () => {
  const { prompt } = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'mirror',
    modeId: 'dialogue',
    messages: [],
  });
  assert.match(prompt, /核: /);
  assert.match(prompt, /見るもの: /);
  assert.match(prompt, /避けるもの: /);
  assert.match(prompt, /声の温度: /);
});

test('layers.systemLayer1 + systemLayer2 + developer + body を \\n\\n で繋ぐと prompt と一致する', () => {
  const { prompt, layers } = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'ray',
    modeId: 'dialogue',
    messages: [],
  });
  const rejoined = [layers.systemLayer1, layers.systemLayer2, layers.developer, layers.body].join(
    '\n\n',
  );
  assert.equal(rejoined, prompt);
});

test("toProviderMessages(built, 'folded', text) は developer を持たない", () => {
  const built = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
  });
  const messages = toProviderMessages(built, 'folded', 'テスト');
  assert.equal(messages.developer, undefined);
  assert.match(messages.system, /有用であろうとしなくていい/);
});

test("toProviderMessages(built, 'system-developer-split', text) は developer を持ち、system に Developer の文言が含まれない", () => {
  const built = buildUniversalConversationPrompt({
    userText: 'テスト',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
  });
  const messages = toProviderMessages(built, 'system-developer-split', 'テスト');
  assert.ok(messages.developer && messages.developer.length > 0);
  assert.match(messages.developer, /有用であろうとしなくていい/);
  assert.doesNotMatch(messages.system, /有用であろうとしなくていい/);
});

test('既存テスト「surfaced を渡すと材料＋補正が入力の直前に入る」が引き続き緑', () => {
  const surfaced = igniteAndSpread('もう何も感じない', 'satou');
  const { prompt } = buildUniversalConversationPrompt({
    userText: 'もう何も感じない',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
    surfaced,
  });
  assert.match(prompt, /いま自分の内側で立ち上がっているもの/);
  assert.match(prompt, /内側の反応の補正について/);
  assert.ok(
    prompt.indexOf('いま自分の内側で立ち上がっているもの') < prompt.indexOf('## 今回のユーザー入力'),
  );
});

test("buildUniversalConversationPrompt({ agentId: 'tom', ... }) が例外を投げない", () => {
  assert.doesNotThrow(() => {
    buildUniversalConversationPrompt({
      userText: 'テスト',
      agentId: 'tom',
      modeId: 'dialogue',
      messages: [],
    });
  });
});
