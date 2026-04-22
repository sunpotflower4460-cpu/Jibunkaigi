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
// Phase 4: prompt 構造 — anchor 差と最小骨格
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

test('prompt から Phase 1 の visible guidance が外れている', () => {
  for (const id of UI_AGENT_IDS) {
    const prompt = buildPromptForAgent(id);
    assert.ok(
      !prompt.includes('ここに書かれている設定や言い回しの朗読より'),
      `${id} prompt should omit tail guidance`
    );
    assert.ok(
      !prompt.includes('【薄く残しておきたいこと】'),
      `${id} prompt should omit avoid block`
    );
  }
});

test('prompt から activated 粒子や mode guide も visible には出ない', () => {
  for (const id of UI_AGENT_IDS) {
    const prompt = buildPromptForAgent(id);
    assert.ok(
      !prompt.includes('【今、場に浮かんでいるもの】'),
      `${id} prompt should omit activated particles`
    );
    assert.ok(
      !prompt.includes('今は、ひとつ触れて、少し待てる感じがある。'),
      `${id} prompt should omit mode guide`
    );
  }
});

test('5 人の system prompt 冒頭が同一ではない (anchor で差が出ている)', () => {
  const heads = UI_AGENT_IDS.map((id) => buildPromptForAgent(id).slice(0, 200));
  const unique = new Set(heads);
  assert.equal(unique.size, UI_AGENT_IDS.length, 'all 5 prompt heads should differ');
});
