import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  strengthBucket,
  buildSurfacedMaterialBlock,
  buildCorrectionBlock,
  AGENT_CORRECTION_LENSES,
} from './promptSection.ts';
import { igniteAndSpread } from './igniteAndSpread.ts';
import { buildUniversalConversationPrompt } from '../prompt/conversationPromptBuilder.ts';

test('strengthBucket: 強/中/弱', () => {
  assert.equal(strengthBucket(0.9), '強');
  assert.equal(strengthBucket(0.66), '強');
  assert.equal(strengthBucket(0.5), '中');
  assert.equal(strengthBucket(0.4), '中');
  assert.equal(strengthBucket(0.2), '弱');
});

test('材料ブロック: 強/中/弱 と種別ラベルで出る。生の数値は絶対に出さない', () => {
  const m = igniteAndSpread('もう何も感じない', 'satou');
  const block = buildSurfacedMaterialBlock(m);
  assert.match(block, /いま自分の内側で立ち上がっているもの/);
  assert.match(block, /信念（強）/);
  assert.match(block, /感情（/);
  // 生の数値（0.74 等）が混ざっていないこと。
  assert.doesNotMatch(block, /\d\.\d/, '小数（活性値）が露出している');
});

test('材料ブロック: 中立入力（励起なし）では空（材料を出さない）', () => {
  const m = igniteAndSpread('明日の会議は何時ですか', 'satou');
  assert.equal(buildSurfacedMaterialBlock(m), '');
});

test('材料ブロック: 件数上限を尊重する', () => {
  const m = igniteAndSpread('もう何も感じない', 'satou');
  const block = buildSurfacedMaterialBlock(m, { maxNodes: 2 });
  const nodeLines = block.split('\n').filter((l) => /（[強中弱]）:/.test(l));
  assert.equal(nodeLines.length, 2);
});

test('補正ブロック: 保守枠の語順（まず材料／この声の角度から）が入る', () => {
  const block = buildCorrectionBlock('satou', 'サトウ');
  assert.match(block, /まず材料に従ってください/);
  assert.match(block, /この声（サトウ）の角度から見えるものに限ります/);
  assert.match(block, /別の視点になってはいけません/);
  assert.match(block, /無理に何かを足す必要はありません/);
});

test('補正ブロック: サトウの気づきの目に「言葉にならない気配」を使わない（人格の境界）', () => {
  assert.doesNotMatch(AGENT_CORRECTION_LENSES.satou, /言葉にならない気配/);
  assert.match(AGENT_CORRECTION_LENSES.satou, /皮肉/);
});

test('補正ブロック: ジョーに「無い火を灯ったことにはしない」枠が入る', () => {
  const block = buildCorrectionBlock('joe', 'ジョー');
  assert.match(block, /消えていない火/);
  assert.match(block, /無い火を灯ったことにはしない/);
});

test('補正ブロック: 7人ぶんの気づきの目が揃っている', () => {
  for (const id of ['satou', 'joe', 'mina', 'ray', 'ken', 'tom', 'fio']) {
    assert.ok((AGENT_CORRECTION_LENSES[id] ?? '').length > 0, `${id} の気づきの目が無い`);
  }
});

test('補正ブロック: lens の無い agentId は空', () => {
  assert.equal(buildCorrectionBlock('mirror', '心の鏡'), '');
});

// ── プロンプト統合 ─────────────────────────────────────────────────────────

test('conversationPromptBuilder: surfaced を渡すと材料＋補正が入力の直前に入る', () => {
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
  // 「今回のユーザー入力」より前に材料が来る。
  assert.ok(
    prompt.indexOf('いま自分の内側で立ち上がっているもの') < prompt.indexOf('## 今回のユーザー入力'),
  );
});

test('conversationPromptBuilder: surfaced 無しなら材料ブロックは入らない（従来通り）', () => {
  const { prompt } = buildUniversalConversationPrompt({
    userText: 'もう何も感じない',
    agentId: 'satou',
    modeId: 'dialogue',
    messages: [],
  });
  assert.doesNotMatch(prompt, /いま自分の内側で立ち上がっているもの/);
});
