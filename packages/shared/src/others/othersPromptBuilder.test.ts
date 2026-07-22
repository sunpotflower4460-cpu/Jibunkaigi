import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUniversalOthersPrompt, type OthersAgentMaterial } from './othersPromptBuilder.ts';
import { igniteAndSpread } from '../toolEngine/igniteAndSpread.ts';
import type { UniversalOthersRequest } from './othersTypes.ts';
import type { ConcreteAgentId } from '../agents.ts';

function baseRequest(overrides: Partial<UniversalOthersRequest> = {}): UniversalOthersRequest {
  return {
    sessionId: 't1',
    userText: '最近、何をやっても満たされない気がする',
    mainReplyText: '満たされないって言いながら、本当はもう"何が足りないか"に気づいてるんじゃない？',
    currentAgentId: 'ray',
    modeId: 'dialogue',
    messages: [],
    userName: null,
    ...overrides,
  };
}

function materialsFor(userText: string, agentIds: ConcreteAgentId[]): OthersAgentMaterial[] {
  return agentIds.map((agentId) => ({ agentId, surfaced: igniteAndSpread(userText, agentId) }));
}

const NON_RAY: ConcreteAgentId[] = ['joe', 'ken', 'mina', 'satou', 'tom', 'fio'];

test('対象エージェントに currentAgentId が含まれない', () => {
  const request = baseRequest({ currentAgentId: 'ray' });
  // ray も含めた全員ぶんの materials を渡しても、builder が防御的に除外する。
  const materials = materialsFor(request.userText, [...NON_RAY, 'ray']);
  const prompt = buildUniversalOthersPrompt(request, materials);
  assert.doesNotMatch(prompt, /━━━ レイ ━━━/);
});

test('プロンプトに mainReplyText が含まれる', () => {
  const request = baseRequest();
  const materials = materialsFor(request.userText, NON_RAY);
  const prompt = buildUniversalOthersPrompt(request, materials);
  assert.match(prompt, /満たされないって言いながら/);
});

test('プロンプトに生の活性値（0.を含む数字）が出てこない（強／中／弱のみ）', () => {
  const request = baseRequest({ userText: 'もう何も感じない' });
  const materials = materialsFor(request.userText, NON_RAY);
  const prompt = buildUniversalOthersPrompt(request, materials);
  assert.doesNotMatch(prompt, /\d\.\d/, '小数（活性値）が露出している');
  assert.match(prompt, /（強）|（中）|（弱）/);
});

test('【人となり】と【今回立った思考】の両方のラベルが各エージェントブロックに出る', () => {
  const request = baseRequest();
  const materials = materialsFor(request.userText, ['satou', 'joe']);
  const prompt = buildUniversalOthersPrompt(request, materials);
  for (const label of ['サトウ', 'ジョー']) {
    assert.match(
      prompt,
      new RegExp(`━━━ ${label} ━━━\\n\\n【人となり】[\\s\\S]*?【今回立った思考】`),
      `${label} のブロックに【人となり】と【今回立った思考】の両方が無い`,
    );
  }
});

test('existence（System二層目の詩的テキスト）が含まれない', () => {
  const request = baseRequest({ currentAgentId: 'ray' });
  const materials = materialsFor(request.userText, NON_RAY);
  const prompt = buildUniversalOthersPrompt(request, materials);
  // satou の existence（確定テキスト）の一節が漏れていないこと。
  assert.doesNotMatch(prompt, /この場のひとつの面に、守る者の在り方がある/);
  assert.doesNotMatch(prompt, /語るための言葉ではない/);
});

test('材料が空のエージェントも、ブロックとしては出力される', () => {
  const request = baseRequest({ userText: '明日の会議は何時ですか' }); // 中立入力＝ほぼ無点火
  const materials = materialsFor(request.userText, ['satou', 'joe']);
  const prompt = buildUniversalOthersPrompt(request, materials);
  assert.match(prompt, /━━━ サトウ ━━━/);
  assert.match(prompt, /━━━ ジョー ━━━/);
  assert.match(prompt, /特に強く立っているものはない/);
});

test('mainReplyText が空文字でも例外を投げない', () => {
  const request = baseRequest({ mainReplyText: '' });
  const materials = materialsFor(request.userText, NON_RAY);
  assert.doesNotThrow(() => {
    const prompt = buildUniversalOthersPrompt(request, materials);
    assert.match(prompt, /ユーザー入力に直接反応してください/);
  });
});

test('## 各エージェント は ## メインの応答 より後ろにある（素材は反応対象の直後）', () => {
  const request = baseRequest();
  const materials = materialsFor(request.userText, NON_RAY);
  const prompt = buildUniversalOthersPrompt(request, materials);
  const mainIndex = prompt.indexOf('## メインの応答');
  const agentsIndex = prompt.indexOf('## 各エージェント');
  assert.ok(mainIndex >= 0 && agentsIndex >= 0, 'セクション見出しが両方見つからない');
  assert.ok(agentsIndex > mainIndex, '## 各エージェント が ## メインの応答 より前にある');
});

test('共通返答方針（/reply向け）が含まれない', () => {
  const request = baseRequest();
  const materials = materialsFor(request.userText, NON_RAY);
  const prompt = buildUniversalOthersPrompt(request, materials);
  assert.doesNotMatch(prompt, /## 共通返答方針/);
  assert.doesNotMatch(prompt, /必要なら問いを一つだけ返す/);
});

test('サトウ「もう疲れた。全部どうでもいい」で、感情（見据えるまなざし）が上限落ちしない', () => {
  const request = baseRequest({ userText: 'もう疲れた。全部どうでもいい' });
  const materials = materialsFor(request.userText, ['satou']);
  const prompt = buildUniversalOthersPrompt(request, materials);
  assert.match(prompt, /感情（強）: 見据えるまなざし/);
});
