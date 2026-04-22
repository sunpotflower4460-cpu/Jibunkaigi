import test from 'node:test';
import assert from 'node:assert/strict';

import { createAgentSystemPromptBuilder } from './sharedPromptSkeleton.js';

test('shared prompt skeleton prefers previousResponseEcho over voice sample', () => {
  // 方針（2026-04 更新）: voiceSamples は「前回の自分のふり」として差し込まない。
  // 実在する previousResponseEcho のみが "前回の自分" として登板する。
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

test('shared prompt skeleton does not fake the previous turn with voiceSamples when no echo exists', () => {
  // 方針（2026-04 更新）: 初回ターンで固定サンプルを「自分の前回発話」として
  // 提示するのは "自分の言葉" ではなく "台本" になるのでやめる。
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({
    activated: {},
    context: '会話の続き',
  });

  assert.doesNotMatch(prompt, /前回、自分はこう話した:/);
  assert.ok(!prompt.includes('最初のサンプル。'));
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
  const avoidIdx = prompt.indexOf('【薄く残しておきたいこと】');
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
  const idx = prompt.indexOf('【薄く残しておきたいこと】');
  assert.ok(idx >= 0, 'soft memo block should still exist as prompt-hygiene guard');

  const avoidSection = prompt.slice(idx).split('\n\n')[0];
  const bullets = avoidSection.split('\n').filter((line) => line.startsWith('- '));
  // 信念の帰結に置き換えた分、ハード禁止のベースは 2 件まで縮退している。
  // dynamic hints が無い（activated が空）状態では丁度 2 件。
  assert.equal(bullets.length, 2, `shared avoid base should shrink to exactly 2 with no dynamic hints (got ${bullets.length})`);
  // prompt 朗読ガードは必ず残る
  assert.ok(avoidSection.includes('ここにある語や設定をそのまま自分の台詞へ移すと'));
});

test('shared prompt skeleton remains usable without latentState (backward compatibility)', () => {
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: ['最初のサンプル。'],
  });

  const prompt = buildPrompt({ activated: {} });
  assert.ok(prompt.includes('（ジョーとして。）'));
  assert.ok(prompt.includes('ここでは、役に立たなければならない感じが少しほどけている。'));
  assert.ok(prompt.includes('ここに書かれている設定や言い回しの朗読より、目の前の相手へ向いた生の言葉のほうが自然に届く。'));
});

test('shared prompt skeleton adds permission framing and omits prescriptive reply template / antiDrift stylesheet', () => {
  // 方針（2026-04 更新）:
  // - 末尾の「返答ではまず〜/問いだけで終わらない」という固定テンプレは置かない
  // - antiDriftLines を prompt 本体に書き出さない（声ごとのスタイルシート化を避ける）
  // - 許可ブロックは純粋な "ほどき" + "自分の言葉で話していい" に寄せる
  const buildPrompt = createAgentSystemPromptBuilder({
    anchorLabel: '（ジョーとして。）',
    voiceSamples: [],
    antiDriftLines: ['まだ反応しているものを見る'],
  });

  const prompt = buildPrompt({ activated: {} });

  // 許可ブロック：純粋な "ほどき" と "自分の言葉" への招待が入る
  assert.ok(prompt.includes('ここでは、役に立たなければならない感じが少しほどけている。'));
  assert.ok(prompt.includes('うまく整った返答より、まだ揺れているままの手ざわりのほうが信じられている'));
  assert.ok(prompt.includes('無難な言い回しに戻らなくても、この場は崩れない'));
  assert.ok(prompt.includes('借りた言い回しをなぞるより、その場で自分から出てきた言葉のほうが近い'));

  // 外した counter-directive は入らない
  assert.ok(!prompt.includes('短すぎず、相手が受け取れる分量で話す'));
  assert.ok(!prompt.includes('ちゃんと向き合って応える'));

  // 固定の返答テンプレは出ない
  assert.ok(!prompt.includes('返答では、まず今この人に見えているものを一つ言う'));
  assert.ok(!prompt.includes('問いだけで終わらない'));

  // antiDriftLines は本体に書き出されない
  assert.ok(!prompt.includes('この声が戻る先'));
  assert.ok(!prompt.includes('まだ反応しているものを見る'));

  // 末尾ガードは残る（設定朗読の禁止 + 自分の言葉で話す）
  assert.ok(prompt.includes('ここに書かれている設定や言い回しの朗読より、目の前の相手へ向いた生の言葉のほうが自然に届く。'));
  assert.ok(prompt.includes('借りた言い回しをなぞるより、その場で自分から出てきた言葉のほうが近い'));
});
