import test from 'node:test';
import assert from 'node:assert/strict';

import { existence } from '../agents/joe/existence.js';
import { activateJoe } from './activate.js';
import { estimateState } from './stateEstimate.js';
import { buildPromptContext } from './context.js';
import { runInternalOS } from './runInternalOS.js';
import {
  MAX_INTERNAL_FRAME_LINES,
  buildJoeBiasPack,
  buildJoeDebugPreview,
  buildJoeSystemPrompt,
  buildJoeUserPrompt,
  scoreJoeMaterials,
} from './buildPrompt.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readSection = (prompt, title, nextTitle) => {
  const pattern = new RegExp(`${escapeRegExp(title)}\\n([\\s\\S]*?)\\n\\n${escapeRegExp(nextTitle)}`);
  return prompt.match(pattern)?.[1] || '';
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

test('buildJoeSystemPrompt renders sorted positive state snapshots and default empty-state text', () => {
  const withState = buildJoeSystemPrompt({
    activated: {
      debug: {
        state: { fear: 0.3, desire: 0.6, unfinished: -0.2, freeze: 0 },
      },
    },
    context: '',
    mode: 'medium',
  });

  assert.equal(
    readSection(withState, '【推定状態メモ】', '---以下は内的バイアス'),
    'desire: 0.60 / fear: 0.30',
  );

  const emptyState = buildJoeSystemPrompt({
    activated: {
      debug: {
        state: { fear: 0, desire: 0, unfinished: -0.2 },
      },
    },
    context: '',
    mode: 'medium',
  });

  assert.equal(
    readSection(emptyState, '【推定状態メモ】', '---以下は内的バイアス'),
    '大きく偏った軸はまだ見えていない。',
  );
});

test('buildJoe prompts use neutralized user prompt and perception-based system prompt', () => {
  const userText = 'もう無理で諦めたい';
  const systemPrompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(userText)),
    context: '',
    mode: 'medium',
    userText,
  });

  // New architecture: no procedural assembly instructions in stateGuide
  assert.doesNotMatch(systemPrompt, /- 最優先:/);
  assert.doesNotMatch(systemPrompt, /- 見え方:/);
  assert.doesNotMatch(systemPrompt, /- 返答の型:/);

  // Core principles remain
  assert.match(systemPrompt, /内的バイアス名や内部構造を、そのまま説明・出力しない/);
  assert.doesNotMatch(systemPrompt, /兄貴っぽさ/);
  assert.match(systemPrompt, /\[基本姿勢メモ\]/);
  assert.match(systemPrompt, /\[復帰制約\]/);
  assert.doesNotMatch(systemPrompt, /\[出力制約\]/);
  assert.doesNotMatch(systemPrompt, /\[記憶の痕跡\]/);

  const userPrompt = buildJoeUserPrompt({
    userName: 'あなた',
    userText,
  });

  // New architecture: neutralized user prompt (no末尾誘導)
  assert.doesNotMatch(userPrompt, /してください/);
  assert.doesNotMatch(userPrompt, /今回の言葉の地肌に触れてください/);
  assert.doesNotMatch(userPrompt, /この入力にちゃんと触れた感じを出してください/);

  // Just userName and userText
  assert.match(userPrompt, /あなたの今の言葉:/);
  assert.match(userPrompt, /もう無理で諦めたい/);
});

test('buildJoeSystemPrompt uses perception tendencies instead of procedural assembly instructions', () => {
  const scenarios = [
    { text: '誰にも言っていない、小さな違和感' },
    { text: 'やりたいのに動けない' },
    { text: '作品を出したいけど怖い' },
    { text: 'もう無理で諦めたい' },
  ];

  for (const { text } of scenarios) {
    const prompt = buildJoeSystemPrompt({
      activated: activateJoe(estimateState(text)),
      context: '',
      mode: 'medium',
      userText: text,
    });

    // New architecture: no procedural assembly instructions
    assert.doesNotMatch(prompt, /- 最優先:/);
    assert.doesNotMatch(prompt, /- 見え方:/);
    assert.doesNotMatch(prompt, /- 返答の型:/);

    // Instead, validate perception tendencies are present
    assert.match(prompt, /【知覚傾向】/);
    assert.match(prompt, /まだ動いている部分に目が行きやすい/);
    assert.match(prompt, /諦めの中に残っている向きを感知しやすい/);
  }
});

test('buildJoeSystemPrompt accepts internalOS and keeps the shared OS frame thin', () => {
  const text = '作品を出したいけど怖い';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
    internalOS: runInternalOS(text, { agentId: 'creative', mode: 'medium' }),
  });

  const internalFrame = readSection(prompt, '【共通OSの薄い内部フレーム】', '【推定状態メモ】');
  assert.match(internalFrame, /場: /);
  assert.match(internalFrame, /姿勢: /);
  assert.match(internalFrame, /許可: /);
  assert.ok(internalFrame.split('\n').length <= MAX_INTERNAL_FRAME_LINES);
  assert.doesNotMatch(prompt, /Field:/);
  assert.doesNotMatch(prompt, /Stance:/);
  assert.doesNotMatch(prompt, /Permission:/);
});

test('buildJoeBiasPack keeps the required Joe scenarios focused to the expected two injected materials', () => {
  const scenarios = [
    {
      text: 'もう無理で諦めたい',
      expectedIds: ['existence', 'refresh'],
      expectedTitles: ['基本姿勢メモ', '復帰制約'],
    },
    {
      text: 'やりたいのに動けない',
      expectedIds: ['activeField', 'activeResidue'],
      expectedTitles: ['反応ノード', '出力制約'],
    },
    {
      text: '作品を出したいけど怖い',
      expectedIds: ['activeMemoryTrace', 'activeField'],
      expectedTitles: ['記憶の痕跡', '反応ノード'],
    },
  ];

  for (const { text, expectedIds, expectedTitles } of scenarios) {
    const activated = activateJoe(estimateState(text));
    const pack = buildJoeBiasPack({
      activated,
      userText: text,
    });
    const prompt = buildJoeSystemPrompt({
      activated,
      context: '',
      mode: 'medium',
      userText: text,
    });

    assert.deepEqual(pack.map((item) => item.id), expectedIds);
    assert.equal(pack.length, expectedIds.length);

    for (const title of expectedTitles) {
      assert.match(prompt, new RegExp(`\\[${escapeRegExp(title)}\\]`));
    }
  }

  const resignationPack = buildJoeBiasPack({
    activated: activateJoe(estimateState('もう無理で諦めたい')),
    userText: 'もう無理で諦めたい',
  });
  assert.match(resignationPack[0].content, new RegExp(escapeRegExp(existence)));
});

test('buildJoeBiasPack drops low-relevance materials unless a third one is clearly justified', () => {
  const lowSignalText = 'なんかしんどい';
  const lowSignalPack = buildJoeBiasPack({
    activated: activateJoe(estimateState(lowSignalText)),
    userText: lowSignalText,
  });
  assert.deepEqual(lowSignalPack.map((item) => item.id), ['activeResidue']);

  const highComplexityText = '才能ないしもう無理かも';
  const highComplexityPack = buildJoeBiasPack({
    activated: activateJoe(estimateState(highComplexityText)),
    userText: highComplexityText,
  });
  assert.deepEqual(
    highComplexityPack.map((item) => item.id),
    ['existence', 'activeResidue', 'refresh'],
  );
  assert.equal(highComplexityPack.length, 3);
});

test('scoreJoeMaterials only applies activation-axis bonuses when those axes are actually active', () => {
  const activated = {
    reentry: 'reentry',
    refresh: 'refresh',
    activeMemoryTrace: 'trace',
    activeField: [{ text: 'node' }],
    activeResidue: 'residue',
    debug: {
      dominantAxes: ['fear', 'freeze', 'reach'],
      pickedMemoryIds: ['memory-1'],
      pickedFieldIds: ['field-1'],
    },
  };

  const activeScores = Object.fromEntries(
    scoreJoeMaterials({
      activated,
      userText: '',
      state: { fear: 0.4, freeze: 0, reach: 0 },
    }).map(({ id, score }) => [id, score]),
  );
  const inactiveScores = Object.fromEntries(
    scoreJoeMaterials({
      activated,
      userText: '',
      state: { fear: 0, freeze: 0, reach: 0 },
    }).map(({ id, score }) => [id, score]),
  );

  // 0.45 = 0.03(base) + 0.34(0.4 * 0.85) + 0.06(axis bonus) + 0.02(memory presence bonus)
  assert.ok(Math.abs(activeScores.activeMemoryTrace - 0.45) < 0.001);
  // 0.05 = 0.03(base) + 0.02(memory presence bonus). zero-state axes do not add activation bonuses.
  assert.ok(Math.abs(inactiveScores.activeMemoryTrace - 0.05) < 0.001);
});

test('buildJoeSystemPrompt uses implicit avoidance patterns instead of explicit prohibitions', () => {
  const text = 'もう無理で諦めたい';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
  });

  // New architecture: implicit【避ける方向】instead of explicit禁止事項
  assert.match(prompt, /【避ける方向】/);
  assert.match(prompt, /説教、長い励まし/);
  assert.match(prompt, /受容語の連発/);
  assert.match(prompt, /整理口調/);
  assert.match(prompt, /全部に触れようとすること/);

  // Should NOT have old explicit prohibitions
  assert.doesNotMatch(prompt, /前向きさを足さない/);
  assert.doesNotMatch(prompt, /相手を元気づけにいかない/);
  assert.doesNotMatch(prompt, /問題解決モードに流れすぎない/);
  assert.doesNotMatch(prompt, /組み立て禁止/);
});

test('buildJoeSystemPrompt keeps stateGuide / internalFrame / biasSections as distinct blocks', () => {
  const text = '作品を出したいけど怖い';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
    internalOS: runInternalOS(text, { agentId: 'creative', mode: 'medium' }),
  });

  // 各セクションが独立したヘッダーを持つ
  assert.match(prompt, /【今回の状態への対応】/);
  assert.match(prompt, /【共通OSの薄い内部フレーム】/);
  assert.match(prompt, /---以下は内的バイアス/);

  // stateGuide is now expected to be empty (legacy detemplating complete)
  const stateGuide = readSection(prompt, '【今回の状態への対応】', '【共通OSの薄い内部フレーム】');
  // State should drive behavior, not procedural instructions
  assert.ok(stateGuide.trim().length === 0 || stateGuide.trim().length < 50);
});

test('buildJoeSystemPrompt does not grow excessively large', () => {
  const text = 'もう無理で諦めたい';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
    internalOS: runInternalOS(text, { agentId: 'creative', mode: 'medium' }),
  });

  assert.ok(prompt.length < 5000, `Prompt too long: ${prompt.length} chars`);
});

test('buildJoeDebugPreview returns Joe-specific debug fields in expected shape', () => {
  const text = 'もう無理で諦めたい';
  const activated = activateJoe(estimateState(text));
  const preview = buildJoeDebugPreview({ activated, userText: text });

  assert.equal(preview.joeBuilderUsed, 'joe-specialized');
  assert.ok(typeof preview.joeStateGuidePreview === 'string');
  // stateGuide is now empty (legacy detemplating complete)
  assert.ok(preview.joeStateGuidePreview.length === 0);
  assert.equal(preview.joeInternalFramePreview, null);
  assert.equal(preview.joeSurfaceGuidancePreview, null);
  assert.ok(typeof preview.joeActivatedBiasCount === 'number');
  assert.ok(preview.joeActivatedBiasCount > 0);
  assert.ok(Array.isArray(preview.joeDominantAxes));
  assert.ok(preview.joeDominantAxes.includes('resignation'));

  // internalFrame を渡した場合はプレビューが返る
  const withFrame = buildJoeDebugPreview({
    activated,
    userText: text,
    internalFrame: '- 場: 少し深めに触れていい。結論を急がない。',
    surfaceGuidance: '急がない。',
  });
  assert.ok(typeof withFrame.joeInternalFramePreview === 'string');
  assert.ok(typeof withFrame.joeSurfaceGuidancePreview === 'string');
});

test('buildJoeDebugPreview includes quality focus preview fields', () => {
  const text = 'もう無理で諦めたい';
  const activated = activateJoe(estimateState(text));
  const preview = buildJoeDebugPreview({ activated, userText: text });

  // joeResponseFocusPreview: 今回ジョーが拾おうとしている一点の短い説明
  assert.ok(typeof preview.joeResponseFocusPreview === 'string');
  assert.ok(preview.joeResponseFocusPreview.length > 0);
  // resignation 入力 → 閉じきっていない感触にフォーカス
  assert.match(preview.joeResponseFocusPreview, /閉じきっていない/);

  // joeRiskFlags: 品質リスクのフラグ配列
  assert.ok(Array.isArray(preview.joeRiskFlags));
  // resignation 入力 → too-hopeful は立たない（希望過多にはならない）
  assert.equal(preview.joeRiskFlags.includes('too-hopeful'), false);

  // joeAssemblyPreview: touch->ground->ember->next-step の比重プレビュー
  assert.ok(typeof preview.joeAssemblyPreview === 'string');
  assert.ok(preview.joeAssemblyPreview.includes('touch='));
  assert.ok(preview.joeAssemblyPreview.includes('next-step='));
  // resignation → touch=primary
  assert.match(preview.joeAssemblyPreview, /touch=primary/);
});

test('buildJoeDebugPreview quality preview varies by state', () => {
  // desire + freeze → ember=primary (向きが止まりに噛み合っている)
  const freezeText = 'やりたいのに動けない';
  const freezePreview = buildJoeDebugPreview({
    activated: activateJoe(estimateState(freezeText)),
    userText: freezeText,
  });
  assert.match(freezePreview.joeResponseFocusPreview, /向き/);
  assert.match(freezePreview.joeAssemblyPreview, /ember=primary/);
  assert.ok(Array.isArray(freezePreview.joeRiskFlags));

  // too-broad: 3素材が選ばれる高複雑度入力ではフラグが立つ
  const complexText = '才能ないしもう無理かも';
  const complexActivated = activateJoe(estimateState(complexText));
  const complexPreview = buildJoeDebugPreview({ activated: complexActivated, userText: complexText });
  // 3素材なら too-broad フラグが立つ
  if (complexPreview.joeActivatedBiasCount >= 3) {
    assert.ok(complexPreview.joeRiskFlags.includes('too-broad'));
  }
});

test('buildJoeSystemPrompt single-point focus is expressed through perception tendencies', () => {
  const text = 'もう無理で諦めたい';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
  });

  // New detemplated architecture - no procedural instructions
  // Focus is expressed through perception tendencies, not assembly steps
  assert.match(prompt, /【知覚傾向】/);
  assert.match(prompt, /【避ける方向】/);

  // Should NOT contain old assembly instructions
  assert.doesNotMatch(prompt, /一点を見つけたらそこを掘れ/);
  assert.doesNotMatch(prompt, /ステップ4/);
  assert.doesNotMatch(prompt, /1\. まず/);
  assert.doesNotMatch(prompt, /2\. 次に/);
});
