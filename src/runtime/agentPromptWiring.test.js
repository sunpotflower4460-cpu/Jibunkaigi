// src/runtime/agentPromptWiring.test.js
// 修正指示書 v3 Phase 6: 配線修正の結合テスト
//
// - UI agent id で activate 系が空でないこと（reservoir access）
// - 5 人の prompt が（anchor / tonal / avoid / 末尾文）の点で差を持つこと
// - runInternalOS の debugInfo に agentId の ui/canonical 両方と material counts が載ること

import test from 'node:test';
import assert from 'node:assert/strict';

import { runInternalOS } from './runInternalOS.js';
import { buildAgentSystemPrompt } from './buildAgentPrompt.js';

const UI_AGENT_IDS = ['creative', 'soul', 'strategist', 'empath', 'critic'];

const SAMPLE_INPUT =
  '同じ部署の同僚とのコミュニケーションに悩んでいます。相手は年上のベテラン社員で、' +
  '仕事のミスを指摘されることは理解しているのですが、何かと細かい言葉遣いや報告の' +
  'タイミングまで厳しく注意されます。注意自体はありがたいものの、他の人にはそこまで' +
  '言わないため、自分だけ標的にされているように感じてしまい、最近は出社するのが少し憂鬱です。';

// ─────────────────────────────────────────────────────────────
// reservoir access: 5 UI id 全てで thought / feeling / move が空でない
// ─────────────────────────────────────────────────────────────

test('5 人全員で activatedThoughts.items.length > 0 になる (UI id 経由)', () => {
  for (const id of UI_AGENT_IDS) {
    const result = runInternalOS(SAMPLE_INPUT, { agentId: id });
    const items = result.latentState.activatedThoughts?.items ?? [];
    assert.ok(items.length > 0, `${id} should activate at least one thought`);
  }
});

test('5 人全員で activatedFeelings / activatedMoves が空でない (UI id 経由)', () => {
  for (const id of UI_AGENT_IDS) {
    const result = runInternalOS(SAMPLE_INPUT, { agentId: id });
    const feelings = result.latentState.activatedFeelings?.items ?? [];
    const moves = result.latentState.activatedMoves?.items ?? [];
    assert.ok(feelings.length > 0, `${id} should activate at least one feeling`);
    assert.ok(moves.length > 0, `${id} should activate at least one move`);
  }
});

test('5 人全員で finalDecisionSubstrate.foreground に何かしら seed が載る', () => {
  for (const id of UI_AGENT_IDS) {
    const result = runInternalOS(SAMPLE_INPUT, { agentId: id });
    const fg = result.latentState.finalDecisionSubstrate?.foreground;
    assert.ok(fg, `${id} should have foreground`);
    const total =
      (fg.thoughtSeeds?.length ?? 0) +
      (fg.feelingSeeds?.length ?? 0) +
      (fg.moveSeeds?.length ?? 0) +
      (fg.tensionSeeds?.length ?? 0);
    assert.ok(total > 0, `${id} should have at least one foreground seed`);
  }
});

// ─────────────────────────────────────────────────────────────
// Phase 2: debugInfo に agentId 両方 + material counts
// ─────────────────────────────────────────────────────────────

test('debugInfo に agentId.ui / agentId.canonical と materialCounts が含まれる', () => {
  const result = runInternalOS(SAMPLE_INPUT, { agentId: 'empath' });
  assert.equal(result.debugInfo.agentId.ui, 'empath');
  assert.equal(result.debugInfo.agentId.canonical, 'mina');

  const counts = result.debugInfo.materialCounts;
  assert.ok(counts);
  for (const key of [
    'activatedThoughtCount',
    'activatedFeelingCount',
    'activatedMoveCount',
    'boundThoughtClusterCount',
    'boundMixedClusterCount',
    'selectedThoughtCount',
    'selectedMixedClusterCount',
    'finalForegroundThoughtSeedCount',
    'finalForegroundFeelingSeedCount',
    'finalForegroundMoveSeedCount',
    'finalForegroundTensionSeedCount',
  ]) {
    assert.equal(typeof counts[key], 'number', `materialCounts.${key} should be a number`);
  }
});

// ─────────────────────────────────────────────────────────────
// Phase 4: prompt 構造 — anchor 差、tonal line、avoid block、末尾文
// ─────────────────────────────────────────────────────────────

const buildPromptForAgent = (agentId) => {
  const result = runInternalOS(SAMPLE_INPUT, { agentId });
  return buildAgentSystemPrompt(agentId, {
    activated: result.latentState,
    latentState: result.latentState,
    context: '',
    mode: 'medium',
    userText: SAMPLE_INPUT,
  });
};

test('5 人の anchor 行が互いに異なる', () => {
  const anchors = UI_AGENT_IDS.map((id) => {
    const prompt = buildPromptForAgent(id);
    const firstAnchorLine = prompt
      .split('\n')
      .find((line) => line.startsWith('（') && line.includes('として。'));
    return firstAnchorLine ?? '';
  });
  const unique = new Set(anchors);
  assert.equal(unique.size, UI_AGENT_IDS.length, 'all anchors should be unique');
});

test('prompt の末尾に Phase 1 の非音読ガードが入る', () => {
  for (const id of UI_AGENT_IDS) {
    const prompt = buildPromptForAgent(id);
    assert.ok(
      prompt.includes('ここに書かれている設定や言い回しを説明・朗読する必要はありません。'),
      `${id} prompt should block prompt readout`
    );
    assert.ok(
      prompt.includes('自分の言葉で話してください。'),
      `${id} prompt should end with present-user guidance`
    );
  }
});

test('共通 avoid に prompt 音読ガードが入る', () => {
  for (const id of UI_AGENT_IDS) {
    const prompt = buildPromptForAgent(id);
    assert.ok(
      prompt.includes('このプロンプトに書かれた単語や概念を、そのまま自分のセリフに混ぜること'),
      `${id} prompt should include the shared anti-readout avoid hint`
    );
  }
});

test('「【厳守：以下は絶対に避けること】」が prompt に入る', () => {
  let matched = 0;
  for (const id of UI_AGENT_IDS) {
    const prompt = buildPromptForAgent(id);
    if (prompt.includes('【厳守：以下は絶対に避けること】')) matched += 1;
  }
  assert.ok(
    matched === UI_AGENT_IDS.length,
    `all prompts should carry avoid block (got ${matched})`
  );
});

test('avoid block は高々 6 件までに収まる', () => {
  for (const id of UI_AGENT_IDS) {
    const prompt = buildPromptForAgent(id);
    const idx = prompt.indexOf('【厳守：以下は絶対に避けること】');
    if (idx < 0) continue;
    // 直後の空行までの bullet を数える
    const tail = prompt.slice(idx).split('\n\n')[0];
    const bullets = tail.split('\n').filter((line) => line.startsWith('- '));
    assert.ok(bullets.length <= 6, `${id}: avoid block bullets must be <= 6 (got ${bullets.length})`);
  }
});

test('5 人の system prompt 冒頭が同一ではない (anchor / existence 両方で差が出ている)', () => {
  const heads = UI_AGENT_IDS.map((id) => buildPromptForAgent(id).slice(0, 200));
  const unique = new Set(heads);
  assert.equal(unique.size, UI_AGENT_IDS.length, 'all 5 prompt heads should differ');
});
