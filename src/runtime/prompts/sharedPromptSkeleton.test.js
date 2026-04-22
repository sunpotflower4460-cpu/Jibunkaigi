import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAgentSystemPromptBuilder,
  createAgentUserPromptBuilder,
} from './sharedPromptSkeleton.js';

test('shared prompt skeleton prefers previousResponseEcho over voice sample', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({
    activated: {},
    previousResponseEcho: '前回の残響。',
  });

  assert.match(prompt, /少し前の自分の残り:\n「前回の残響。」/);
  assert.doesNotMatch(prompt, /最初のサンプル。/);
});

test('shared prompt skeleton does not fake the previous turn with voiceSamples when no echo exists', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({
    activated: {},
    context: '会話の続き',
  });

  assert.doesNotMatch(prompt, /少し前の自分の残り:/);
  assert.ok(!prompt.includes('最初のサンプル。'));
});

test('shared prompt skeleton sanitizes echoed quotes and control whitespace before interpolation', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
  });

  const prompt = buildPrompt({
    activated: {},
    previousResponseEcho: '「前回の残響。」\n\t次の文。',
  });

  assert.match(prompt, /少し前の自分の残り:\n「『前回の残響。』 次の文。」/);
});

test('shared prompt skeleton keeps latentState hidden from the visible prompt', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
  });

  const prompt = buildPrompt({
    activated: {
      activatedThoughts: {
        items: [{ textSeed: '出してはいけない seed', stanceHints: ['急がない'], avoidHints: ['引用しない'] }],
      },
    },
    latentState: {
      existence2: {
        identityFeelingText: 'まだ消えていない一点を感じる',
        recalledSelfTraits: ['火種に気づく'],
      },
      permission: { noHurry: 0.9 },
      consciousIntent: { holdBack: ['no-early-summary'] },
    },
    othersField: '他の声の要約',
  });

  assert.ok(!prompt.includes('まだ消えていない一点を感じる'));
  assert.ok(!prompt.includes('火種に気づく'));
  assert.ok(!prompt.includes('まだ急いで結ばなくていい'));
  assert.ok(!prompt.includes('出してはいけない seed'));
  assert.ok(!prompt.includes('他の声の要約'));
});

test('shared prompt skeleton exposes only loosen block, anchor, echo, and raw conversation', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    antiDriftLines: ['まだ反応しているものを見る'],
  });

  const prompt = buildPrompt({
    activated: {},
    context: 'あなた: 最初の相談\n別の視点: 前の返答',
    mode: 'long',
  });

  assert.ok(prompt.includes('ここでは、役に立とうと急がなくていい。'));
  assert.ok(prompt.includes('正解を急がなくていい。'));
  assert.ok(prompt.includes('（ジョーとして。）'));
  assert.ok(prompt.includes('【会話の流れ】\nあなた: 最初の相談 別の視点: 前の返答'));
  assert.ok(!prompt.includes('【薄く残しておきたいこと】'));
  assert.ok(!prompt.includes('【今、場に浮かんでいるもの】'));
  assert.ok(!prompt.includes('今は、ひとつ触れて、少し待てる感じがある。'));
  assert.ok(!prompt.includes('ここに書かれている設定や言い回しの朗読より'));
  assert.ok(!prompt.includes('まだ反応しているものを見る'));
});

test('shared prompt skeleton remains usable without latentState', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
  });

  const prompt = buildPrompt({ activated: {} });
  assert.ok(prompt.includes('（ジョーとして。）'));
  assert.ok(prompt.includes('ここでは、役に立とうと急がなくていい。'));
});

test('shared user prompt stays minimal', () => {
  const buildUserPrompt = createAgentUserPromptBuilder();
  const prompt = buildUserPrompt({
    userName: 'あなた',
    userText: 'もう無理で諦めたい',
  });

  assert.equal(prompt, 'あなたの言葉:\nもう無理で諦めたい');
});
