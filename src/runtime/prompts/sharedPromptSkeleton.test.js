import test from 'node:test';
import assert from 'node:assert/strict';

import { createAgentSystemPromptBuilder } from './sharedPromptSkeleton.js';

test('shared prompt skeleton prefers previousResponseEcho over voice sample', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({
    activated: {},
    previousResponseEcho: '前回の残響。',
  });

  assert.match(prompt, /前回、自分はこう話した:\n「前回の残響。」/);
  assert.doesNotMatch(prompt, /自分はこういう入り方をする:/);
});

test('shared prompt skeleton falls back to the first voice sample when no echo exists', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({
    activated: {},
    context: '会話の続き',
  });

  assert.match(prompt, /自分はこういう入り方をする:\n「最初のサンプル。」/);
});

test('shared prompt skeleton sanitizes echoed quotes and control whitespace before interpolation', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({
    activated: {},
    previousResponseEcho: '「前回の残響。」\n\t次の文。',
  });

  assert.match(prompt, /前回、自分はこう話した:\n「『前回の残響。』 次の文。」/);
});
