import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isCompareModeEnabled,
  buildCompareEntry,
  COMPARE_MAX_ENTRIES,
} from './compareMode.js';
import { buildAgentSystemPrompt } from './buildAgentPrompt.js';
import { buildMirrorSystemPrompt } from './mirror.js';

// --- isCompareModeEnabled は window 未定義環境でも throw しない ---

test('isCompareModeEnabled does not throw in node environment', () => {
  // node test 環境では window が undefined なので false を返す想定
  assert.doesNotThrow(() => isCompareModeEnabled());
  assert.equal(isCompareModeEnabled(), false);
});

// --- buildCompareEntry は要求 shape を返す ---

test('buildCompareEntry returns the expected shape with all fields', () => {
  const entry = buildCompareEntry({
    agentId: 'creative',
    isMirror: false,
    mode: 'medium',
    userText: 'もう疲れた',
    baselineReply: 'baseline text',
    currentReply: 'current text',
    stateGuide: 'state guide',
    internalFrame: 'internal frame',
    surfaceGuidance: 'surface guidance',
    timestamp: 1700000000000,
  });

  assert.equal(entry.id, 'creative:1700000000000');
  assert.equal(entry.agentId, 'creative');
  assert.equal(entry.isMirror, false);
  assert.equal(entry.mode, 'medium');
  assert.equal(entry.userText, 'もう疲れた');
  assert.equal(entry.baselineReply, 'baseline text');
  assert.equal(entry.currentReply, 'current text');
  assert.equal(entry.outerGuide.stateGuide, 'state guide');
  assert.equal(entry.outerGuide.internalFrame, 'internal frame');
  assert.equal(entry.outerGuide.surfaceGuidance, 'surface guidance');
  assert.equal(entry.baselineError, null);
  assert.equal(entry.currentError, null);
  assert.equal(entry.timestamp, 1700000000000);
});

test('buildCompareEntry normalizes Error instances to string messages', () => {
  const entry = buildCompareEntry({
    agentId: 'soul',
    baselineError: new Error('baseline boom'),
    currentError: new Error('current boom'),
  });

  assert.equal(entry.baselineError, 'baseline boom');
  assert.equal(entry.currentError, 'current boom');
});

test('buildCompareEntry truncates very long userText', () => {
  const long = 'あ'.repeat(400);
  const entry = buildCompareEntry({
    agentId: 'creative',
    userText: long,
  });

  assert.ok(entry.userText.length <= 201, 'userText should be truncated');
  assert.ok(entry.userText.endsWith('…'));
});

test('buildCompareEntry marks isMirror correctly', () => {
  const entry = buildCompareEntry({
    agentId: 'master',
    isMirror: true,
  });

  assert.equal(entry.isMirror, true);
});

test('COMPARE_MAX_ENTRIES is a reasonable small number', () => {
  assert.ok(typeof COMPARE_MAX_ENTRIES === 'number');
  assert.ok(COMPARE_MAX_ENTRIES >= 1 && COMPARE_MAX_ENTRIES <= 50);
});

// --- Baseline 生成経路: builder に空の Outer Guide を渡しても壊れない ---

test('buildAgentSystemPrompt accepts empty outer guides (baseline path) for all 5 agents', () => {
  const agents = ['creative', 'soul', 'strategist', 'empath', 'critic'];
  for (const agentId of agents) {
    const prompt = buildAgentSystemPrompt(agentId, {
      activated: { debug: { state: {}, dominantAxes: [] } },
      context: '',
      mode: 'medium',
      userText: 'テスト',
      internalOS: null,
      surfaceFrame: null,
      stateGuide: '',
      internalFrame: '',
      surfaceGuidance: '',
    });
    assert.ok(prompt, `${agentId} baseline prompt should not be null`);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.length > 100, `${agentId} baseline prompt should still be a full prompt`);
  }
});

test('buildMirrorSystemPrompt accepts empty outer guides (baseline path)', () => {
  const prompt = buildMirrorSystemPrompt({
    context: '',
    mode: 'medium',
    signals: {},
    surfaceFrame: null,
    stateGuide: '',
    internalFrame: '',
    surfaceGuidance: '',
  });
  assert.ok(prompt);
  assert.equal(typeof prompt, 'string');
  // Mirror の骨格（まとめ役ではなく云々）は残っているはず
  assert.match(prompt, /まとめ役ではなく/);
});

// --- Baseline と Current は同一 builder から同じプロンプト基盤を持つ ---

test('baseline and current prompts for same agent share voice differentiation block', () => {
  const params = {
    activated: { debug: { state: {}, dominantAxes: [] } },
    context: '',
    mode: 'medium',
    userText: 'テスト',
    internalOS: null,
    surfaceFrame: null,
  };

  const baseline = buildAgentSystemPrompt('creative', {
    ...params,
    stateGuide: '',
    internalFrame: '',
    surfaceGuidance: '',
  });
  const current = buildAgentSystemPrompt('creative', {
    ...params,
    stateGuide: 'この場では一点だけ照らす',
    internalFrame: 'internal frame text',
    surfaceGuidance: '【表層傾向】ゆっくり入る',
  });

  // 両方に voice differentiation block が残っている
  assert.match(baseline, /【ジョーの触れ方/);
  assert.match(current, /【ジョーの触れ方/);
  // Current にだけ surfaceGuidance 由来の文字列が含まれる
  assert.doesNotMatch(baseline, /【表層傾向】ゆっくり入る/);
  assert.match(current, /【表層傾向】ゆっくり入る/);
});
