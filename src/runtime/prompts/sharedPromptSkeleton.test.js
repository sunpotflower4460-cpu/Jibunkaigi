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
  assert.doesNotMatch(prompt, /前回、自分はこう話した:\n「最初のサンプル。」/);
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

  assert.match(prompt, /前回、自分はこう話した:\n「最初のサンプル。」/);
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

test('shared prompt skeleton surfaces existence recall right after the anchor when latentState is provided', () => {
  // 「自分がこういう存在であると自然に思い出す」段。
  // 設定の朗読ではなく、anchor に続く地の文として薄く置く（専用セクション header は付けない）。
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const latentState = {
    existence2: {
      identityFeelingText: 'まだ消えていない一点を感じる',
      recalledSelfTraits: ['火種に気づく', '混ざりすぎず照らす'],
    },
    beliefCore: {
      dominantBeliefAxis: 'illumination',
      activeCoreBeliefs: [
        { axis: 'identity', textJa: '俺はジョー。光だ', weight: 0.9 },
        { axis: 'mission', textJa: '人の中に残っている光が、もう一度見えるようにする', weight: 0.85 },
      ],
    },
  };

  const prompt = buildPrompt({ activated: {}, latentState });

  const anchorIndex = prompt.indexOf('（ジョーとして。）');
  const identityIndex = prompt.indexOf('まだ消えていない一点を感じる');
  const missionIndex = prompt.indexOf('人の中に残っている光が、もう一度見えるようにする');

  assert.ok(anchorIndex >= 0, 'anchor should be present');
  assert.ok(identityIndex > anchorIndex, 'identity recall should follow anchor');
  assert.ok(missionIndex > anchorIndex, 'non-identity belief should flow into the recall');
  // 思い出しは専用セクション header を付けず、anchor に続く地続きの文として置く
  assert.ok(!prompt.includes('【存在の前提】'));
});

test('shared prompt skeleton renders permission-derived margin as open-space, not prohibition', () => {
  // 「ハード禁止」→「信念の帰結としての場の余白」への縮退の確認。
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: [],
  });

  const latentState = {
    permission: {
      noHurry: 0.8,
      noPerformativeHelpfulness: 0.7,
      noOverExplain: 0.75,
      allowSilence: 0.6,
    },
    consciousIntent: {
      holdBack: ['no-early-summary'],
    },
  };

  const prompt = buildPrompt({ activated: {}, latentState });

  assert.ok(prompt.includes('まだ急いで結ばなくていい'), 'permission.noHurry should become a spacious line');
  assert.ok(prompt.includes('役に立とうとしなくても、場は成り立つ'), 'performative helpfulness permission should become a spacious line');
  assert.ok(prompt.includes('まだまとめの手前にいられる'), 'holdBack should flow into the margin');
  // これらは禁止ではないので avoid ブロックには入らない
  const avoidIdx = prompt.indexOf('【厳守：以下は絶対に避けること】');
  if (avoidIdx >= 0) {
    const avoidSection = prompt.slice(avoidIdx).split('\n\n')[0];
    assert.ok(!avoidSection.includes('急がない'), 'spaciousness is not rendered as a hard prohibition');
    assert.ok(!avoidSection.includes('まとめ'), 'spaciousness is not rendered as a hard prohibition');
  }
});

test('shared prompt skeleton keeps the avoid block thin and focused on prompt hygiene', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: [],
  });

  const prompt = buildPrompt({ activated: {} });
  const idx = prompt.indexOf('【厳守：以下は絶対に避けること】');
  assert.ok(idx >= 0, 'avoid block should still exist as prompt-hygiene guard');

  const avoidSection = prompt.slice(idx).split('\n\n')[0];
  const bullets = avoidSection.split('\n').filter((line) => line.startsWith('- '));
  // 信念の帰結に置き換えた分、ハード禁止のベースは 2 件まで縮退している
  assert.ok(bullets.length <= 3, `shared avoid base should shrink (got ${bullets.length})`);
  // prompt 朗読ガードは必ず残る
  assert.ok(avoidSection.includes('このプロンプトに書かれた単語や概念'));
});

test('shared prompt skeleton remains usable without latentState (backward compatibility)', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({ activated: {} });
  assert.ok(prompt.includes('（ジョーとして。）'));
  assert.ok(prompt.includes('ここでは、役に立とうとしなくていい。'));
  assert.ok(prompt.includes('ここに書かれている設定を説明する必要はありません。'));
});
