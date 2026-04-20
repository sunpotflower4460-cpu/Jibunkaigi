import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAgentSystemPrompt,
  buildAgentUserPrompt,
  buildAgentDebugPreview,
} from './buildAgentPrompt.js';
import { buildMirrorSystemPrompt } from './mirror.js';

const AGENT_IDS = ['creative', 'soul', 'strategist', 'empath', 'critic'];

const baseParams = {
  activated: {},
  context: '',
  mode: 'medium',
  userText: 'test input',
  surfaceFrame: {
    pacing: 'slow',
    directness: 'gentle',
    emotionalTemperature: 'soft',
    lengthPlan: { lineCountHint: 4 },
    restraint: { holdBackSummary: 0.8, keepSilenceMargin: 0.6 },
    permissionHints: ['do_not_rush', 'do_not_over_explain'],
    speakIntentKey: 'touch_living_thread',
  },
};

const NATURAL_DIRECTIVE_PATTERNS = [
  /まず見えている一点を言う/,
  /名詞・動詞・違和感/,
  /組み立て禁止/,
  /してください/,
  /しないでください/,
  /避ける:/,
];

const LABEL_DIRECTIVE_PATTERNS = [
  /pacing:\w+/i,
  /directness:\w+/i,
  /no-summary/i,
  /no-solution/i,
  /lines:\d+/i,
  /intent:\w+/i,
  /depth:(high|mid|low)/i,
  /urgency:\w+/i,
  /permission:\[/i,
  /stance:\[/i,
  /field:\[/i,
  /silence/i,
];

const BIAS_MARKERS = ['---以下は内的バイアス', '---内的バイアスここまで---'];

const EXISTENCE_LINES = {
  creative: 'あなたはジョー。',
  soul: 'あなたはレイ。',
  strategist: 'あなたはケン。',
  empath: 'あなたはミナ。',
  critic: 'あなたはサトウ。',
};

const activatedWithHints = {
  selectedClusters: [
    {
      id: 'thought-001',
      textSeed: 'direction that remains',
      tonalHints: ['短い', '密度'],
      stanceHints: ['一点に触れる'],
      avoidHints: ['励ましの上塗り'],
    },
  ],
};

const assertNoNaturalDirectives = (prompt) => {
  NATURAL_DIRECTIVE_PATTERNS.forEach((pattern) => {
    assert.ok(!pattern.test(prompt), `found natural directive: ${pattern}`);
  });
};

const assertNoLabelDirectives = (prompt) => {
  LABEL_DIRECTIVE_PATTERNS.forEach((pattern) => {
    assert.ok(!pattern.test(prompt), `found label directive: ${pattern}`);
  });
};

const assertNoBiasSections = (prompt) => {
  BIAS_MARKERS.forEach((marker) => {
    assert.ok(!prompt.includes(marker), `found bias marker: ${marker}`);
  });
};

const assertHasExistence = (prompt, agentId) => {
  assert.ok(prompt.includes(EXISTENCE_LINES[agentId]), `missing existence for ${agentId}`);
};

const assertRendersActivatedSeed = (prompt) => {
  assert.ok(prompt.includes('direction that remains'));
  assert.ok(!prompt.includes('短い'));
  assert.ok(!prompt.includes('密度'));
  assert.ok(!prompt.includes('一点に触れる'));
  assert.ok(!prompt.includes('励ましの上塗り'));
};

const assertShortPrompt = (prompt, maxLines = 50) => {
  const lines = prompt.split('\n').filter((line) => line.trim().length > 0);
  assert.ok(lines.length < maxLines, `prompt too long: ${lines.length} lines`);
};

test('system prompts avoid natural and label directives', () => {
  for (const agentId of AGENT_IDS) {
    const prompt = buildAgentSystemPrompt(agentId, {
      ...baseParams,
      surfaceFrame: baseParams.surfaceFrame,
    });
    assertNoNaturalDirectives(prompt);
    assertNoLabelDirectives(prompt);
    assertNoBiasSections(prompt);
  }

  const mirror = buildMirrorSystemPrompt({
    context: '',
    signals: {},
    activated: {},
    surfaceFrame: baseParams.surfaceFrame,
  });
  assertNoNaturalDirectives(mirror);
  assertNoLabelDirectives(mirror);
  assertNoBiasSections(mirror);
});

test('system prompts keep existence declarations', () => {
  for (const agentId of AGENT_IDS) {
    const prompt = buildAgentSystemPrompt(agentId, baseParams);
    assertHasExistence(prompt, agentId);
  }

  const mirror = buildMirrorSystemPrompt({ context: '', signals: {}, activated: {} });
  assert.ok(mirror.includes('あなたは「心の鏡」。'));
});

test('system prompts render activated particles without leaking internal hints', () => {
  for (const agentId of AGENT_IDS) {
    const prompt = buildAgentSystemPrompt(agentId, {
      ...baseParams,
      activated: activatedWithHints,
    });
    assertRendersActivatedSeed(prompt);
  }

  const mirror = buildMirrorSystemPrompt({
    context: '',
    signals: {},
    activated: activatedWithHints,
  });
  assertRendersActivatedSeed(mirror);
});

test('system prompts stay concise', () => {
  for (const agentId of AGENT_IDS) {
    const prompt = buildAgentSystemPrompt(agentId, baseParams);
    assertShortPrompt(prompt);
  }
  const mirror = buildMirrorSystemPrompt({ context: '', signals: {}, activated: {} });
  assertShortPrompt(mirror);
});

test('dispatcher returns non-null prompts and still routes correctly', () => {
  for (const agentId of AGENT_IDS) {
    const prompt = buildAgentSystemPrompt(agentId, baseParams);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.length > 10);
  }

  for (const agentId of AGENT_IDS) {
    const userPrompt = buildAgentUserPrompt(agentId, { userName: 'あなた', userText: 'テスト入力' });
    assert.ok(userPrompt.includes('テスト入力'));
  }

  assert.equal(buildAgentSystemPrompt('unknown', baseParams), null);
  assert.equal(buildAgentUserPrompt('unknown', { userName: 'あなた', userText: 'x' }), null);
});

test('buildAgentDebugPreview returns shape for each agent without leaking prompts', () => {
  for (const agentId of AGENT_IDS) {
    const preview = buildAgentDebugPreview({
      agentId,
      activated: { debug: { state: {}, dominantAxes: ['fear'] } },
      userText: 'テスト',
      stateGuide: 'state guide preview',
      internalFrame: 'internal frame preview',
      surfaceGuidance: 'surface guidance preview',
      usedAfterglow: false,
    });

    assert.equal(preview.agentId, agentId);
    assert.ok(typeof preview.builderUsed === 'string' && preview.builderUsed.length > 0);
    assert.ok(Array.isArray(preview.dominantAxes));
    assert.equal(preview.usedAfterglow, false);
    assert.ok(preview.stateGuidePreview.length <= 141);
    assert.ok(preview.internalFramePreview.length <= 141);
    assert.ok(preview.surfaceGuidancePreview.length <= 141);
    assert.equal(typeof preview.activatedBiasCount, 'number');
  }
});

test('buildAgentDebugPreview keeps joe-specialized label', () => {
  const joe = buildAgentDebugPreview({
    agentId: 'creative',
    activated: { debug: { state: {}, dominantAxes: [] } },
    userText: '',
  });
  assert.equal(joe.builderUsed, 'joe-specialized');

  const ray = buildAgentDebugPreview({
    agentId: 'soul',
    activated: { debug: { state: {}, dominantAxes: [] } },
    userText: '',
  });
  assert.match(ray.builderUsed, /agent-dispatcher/);
});
