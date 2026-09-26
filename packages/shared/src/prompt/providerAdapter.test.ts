import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUniversalConversationPrompt } from './conversationPromptBuilder.ts';
import { toChatMessages, LOOK_INWARD_TOOL_CALL_ID } from './providerAdapter.ts';
import { SYSTEM_LAYER_1_MIRROR, DEVELOPER_LAYER } from './promptLayers.ts';
import { getAgentPromptProfile } from './agentPromptProfiles.ts';
import { igniteAndSpread } from '../toolEngine/igniteAndSpread.ts';

const HEAVY_INPUT = '大丈夫、あとで考える。もう何も感じない';
const NEUTRAL_INPUT = '明日の会議は何時ですか';

function build(userText: string, withSurfaced = true) {
  return buildUniversalConversationPrompt({
    userText,
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [
      { role: 'user', text: '最近眠れない' },
      { role: 'agent', text: '眠れない夜が続いているんだね', agentId: 'satou', agentLabel: 'サトウ' },
    ],
    surfaced: withSurfaced ? igniteAndSpread(userText, 'satou') : undefined,
  });
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

test('folded：system に確定テキスト3層、user に body', () => {
  const built = build(HEAVY_INPUT);
  const messages = toChatMessages(built, 'folded');
  assert.deepEqual(
    messages.map((m) => m.role),
    ['system', 'user'],
  );
  const existence = getAgentPromptProfile('satou').existence ?? '';
  assert.equal(
    messages[0].content,
    [SYSTEM_LAYER_1_MIRROR, existence, DEVELOPER_LAYER].join('\n\n'),
  );
  assert.equal(messages[1].content, built.layers.body);
});

test('folded：ユーザー入力が二重に入らない', () => {
  const built = build(HEAVY_INPUT);
  const all = toChatMessages(built, 'folded')
    .map((m) => m.content ?? '')
    .join('\n');
  assert.equal(countOccurrences(all, HEAVY_INPUT), 1);
});

test('split：system に一層目＋二層目、developer に Developer、tool に材料、user に入力', () => {
  const built = build(HEAVY_INPUT);
  assert.ok(built.sections.inner.length > 0, '前提：この入力では材料が立つ');
  const messages = toChatMessages(built, 'split');
  assert.deepEqual(
    messages.map((m) => m.role),
    ['system', 'developer', 'assistant', 'tool', 'user'],
  );
  const [system, developer, assistant, tool, user] = messages;
  const existence = getAgentPromptProfile('satou').existence ?? '';
  assert.equal(system.content, [SYSTEM_LAYER_1_MIRROR, existence].join('\n\n'));
  assert.ok(developer.content?.startsWith(DEVELOPER_LAYER));
  assert.match(developer.content ?? '', /## 応答モード/);
  assert.match(developer.content ?? '', /## 共通返答方針/);
  assert.match(developer.content ?? '', /## 直近の会話/);
  assert.match(developer.content ?? '', /## 出力/);
  assert.doesNotMatch(developer.content ?? '', /いま自分の内側で立ち上がっているもの/);
  assert.doesNotMatch(developer.content ?? '', /## 今回のユーザー入力/);
  assert.equal(assistant.role, 'assistant');
  assert.equal(assistant.role === 'assistant' && assistant.tool_calls?.[0]?.function.name, 'look_inward');
  assert.equal(tool.role === 'tool' && tool.tool_call_id, LOOK_INWARD_TOOL_CALL_ID);
  assert.equal(tool.content, built.sections.inner);
  assert.equal(user.content, HEAVY_INPUT);
});

test('split：ユーザー入力は user にだけ入る（二重にならない）', () => {
  const built = build(HEAVY_INPUT);
  const all = toChatMessages(built, 'split')
    .map((m) => m.content ?? '')
    .join('\n');
  assert.equal(countOccurrences(all, HEAVY_INPUT), 1);
});

test('split で材料が空なら、assistant と tool のメッセージが無い', () => {
  const neutral = build(NEUTRAL_INPUT);
  assert.equal(neutral.sections.inner, '', '前提：中立入力では材料が立たない');
  assert.deepEqual(
    toChatMessages(neutral, 'split').map((m) => m.role),
    ['system', 'developer', 'user'],
  );
  const noSurfaced = build(HEAVY_INPUT, false);
  assert.deepEqual(
    toChatMessages(noSurfaced, 'split').map((m) => m.role),
    ['system', 'developer', 'user'],
  );
});

test('split の tool メッセージに生の活性値（0.x）が出てこない', () => {
  for (const input of [HEAVY_INPUT, '消えたいと思うことがある', 'はいはい大丈夫大丈夫']) {
    const built = build(input);
    const tool = toChatMessages(built, 'split').find((m) => m.role === 'tool');
    if (!tool) continue;
    assert.doesNotMatch(tool.content ?? '', /\d\.\d/);
    assert.doesNotMatch(tool.content ?? '', /activation|活性値/);
  }
});

test("split の materialPlacement='developer'：材料を developer の出力の直前に置き、tool を使わない", () => {
  const built = build(HEAVY_INPUT);
  const messages = toChatMessages(built, 'split', { materialPlacement: 'developer' });
  assert.deepEqual(
    messages.map((m) => m.role),
    ['system', 'developer', 'user'],
  );
  const developer = messages[1].content ?? '';
  assert.ok(developer.includes(built.sections.inner));
  assert.ok(developer.indexOf(built.sections.inner) < developer.indexOf('## 出力'));
});

test('sections を連結すると layers.body と一致する（既存出力を変えていない）', () => {
  for (const withSurfaced of [true, false]) {
    const built = build(HEAVY_INPUT, withSurfaced);
    const { mode, policy, history, inner, userInput, output } = built.sections;
    assert.equal(
      [mode, policy, history, ...(inner ? [inner] : []), userInput, output].join('\n\n'),
      built.layers.body,
    );
  }
});
