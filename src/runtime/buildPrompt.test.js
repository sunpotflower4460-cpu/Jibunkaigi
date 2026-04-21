import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPromptContext } from './context.js';
import { activateJoe } from './activate.js';
import { estimateState } from './stateEstimate.js';
import {
  buildJoeBiasPack,
  buildJoeSystemPrompt,
  buildJoeUserPrompt,
  scoreJoeMaterials,
  buildJoeDebugPreview,
} from './buildPrompt.js';

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
];

const BIAS_MARKERS = ['---以下は内的バイアス', '---内的バイアスここまで---'];

const activatedWithHints = {
  selectedClusters: [
    {
      id: 'joe-thought-001',
      textSeed: 'direction that remains',
      tonalHints: ['legacy-tonal-xyz-短い', 'legacy-tonal-xyz-密度'],
      stanceHints: ['legacy-stance-xyz-一点'],
      avoidHints: ['legacy-avoid-xyz-励まし'],
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

test('buildPromptContext keeps only recent messages and truncates long content', () => {
  const longText = 'あ'.repeat(220);
  const context = buildPromptContext({
    messages: [
      { role: 'user', content: 'old-1' },
      { role: 'ai', agentId: 'creative', content: 'old-2' },
      { role: 'user', content: 'keep-1' },
      { role: 'ai', agentId: 'creative', content: 'keep-2' },
      { role: 'user', content: 'keep-3' },
      { role: 'ai', agentId: 'strategist', content: longText },
      { role: 'user', content: 'keep-5' },
      { role: 'ai', agentId: 'master', content: 'keep-6' },
    ],
    userName: 'あなた',
    agents: [
      { id: 'creative', name: 'ジョー' },
      { id: 'strategist', name: 'ケン' },
    ],
  });

  assert.doesNotMatch(context, /old-1/);
  assert.doesNotMatch(context, /old-2/);
  assert.match(context, /^あなた: keep-1/m);
  assert.match(context, /^心の鏡: keep-6/m);
  assert.match(context, /ケン: あ{179}…/);
  assert.equal(context.split('\n').length, 6);
});

test('buildJoeSystemPrompt drops directives and bias sections', () => {
  const prompt = buildJoeSystemPrompt({
    activated: {},
    context: '',
    mode: 'medium',
    userText: 'test',
    surfaceFrame: {
      pacing: 'slow',
      directness: 'gentle',
      emotionalTemperature: 'soft',
      lengthPlan: { lineCountHint: 4 },
      restraint: { holdBackSummary: 0.8 },
      speakIntentKey: 'touch_living_thread',
    },
  });

  assert.ok(prompt.includes('（ジョーとして。'));
  assertNoNaturalDirectives(prompt);
  assertNoLabelDirectives(prompt);
  assertNoBiasSections(prompt);
});

test('buildJoeSystemPrompt renders activated particles without leaking internal hints', () => {
  const prompt = buildJoeSystemPrompt({
    activated: activatedWithHints,
    context: '',
    mode: 'medium',
    userText: 'test',
  });

  assert.ok(prompt.includes('direction that remains'));
  assert.ok(!prompt.includes('legacy-tonal-xyz-短い'));
  assert.ok(!prompt.includes('legacy-tonal-xyz-密度'));
  assert.ok(!prompt.includes('legacy-stance-xyz-一点'));
  assert.ok(!prompt.includes('legacy-avoid-xyz-励まし'));
});

test('buildJoeUserPrompt stays neutral', () => {
  const userPrompt = buildJoeUserPrompt({
    userName: 'あなた',
    userText: 'もう無理で諦めたい',
  });

  assert.match(userPrompt, /あなたの今の言葉:/);
  assert.match(userPrompt, /もう無理で諦めたい/);
  assert.doesNotMatch(userPrompt, /してください/);
});

test('buildJoeBiasPack stays focused on top materials', () => {
  const text = 'やりたいのに動けない';
  const activated = activateJoe(estimateState(text));
  const pack = buildJoeBiasPack({ activated, userText: text });

  assert.ok(pack.length >= 1 && pack.length <= 3);
  assert.ok(pack.every((item) => item.id && item.title && item.content));
});

test('scoreJoeMaterials clamps scores to 0..1', () => {
  const scores = scoreJoeMaterials({
    activated: activateJoe(estimateState('もう無理で諦めたい')),
    userText: 'もう無理で諦めたい',
  });

  scores.forEach(({ score }) => {
    assert.ok(score >= 0);
    assert.ok(score <= 1);
  });
});

test('buildJoeDebugPreview returns shape without leaking prompts', () => {
  const activated = activateJoe(estimateState('もう無理で諦めたい'));
  const preview = buildJoeDebugPreview({ activated, userText: 'もう無理で諦めたい' });

  assert.equal(preview.joeBuilderUsed, 'joe-specialized');
  assert.ok(Array.isArray(preview.joeDominantAxes));
  assert.equal(typeof preview.joeActivatedBiasCount, 'number');
  assert.ok(preview.joeStateGuidePreview.length <= 141);
  assert.ok(preview.joeInternalFramePreview === null || preview.joeInternalFramePreview.length <= 141);
  assert.ok(preview.joeSurfaceGuidancePreview === null || preview.joeSurfaceGuidancePreview.length <= 141);
});
