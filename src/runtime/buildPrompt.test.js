import test from 'node:test';
import assert from 'node:assert/strict';

import { existence } from '../agents/joe/existence.js';
import { activateJoe } from './activate.js';
import { estimateState } from './stateEstimate.js';
import { buildPromptContext } from './context.js';
import {
  buildJoeBiasPack,
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
    readSection(withState, '【推定状態メモ】', '【返答の組み立て方】'),
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
    readSection(emptyState, '【推定状態メモ】', '【返答の組み立て方】'),
    '大きく偏った軸はまだ見えていない。',
  );
});

test('buildJoe prompts keep resignation guidance and user wording focused on natural contact', () => {
  const userText = 'もう無理で諦めたい';
  const systemPrompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(userText)),
    context: '',
    mode: 'medium',
    userText,
  });

  assert.equal(
    readSection(systemPrompt, '【今回の状態への対応】', '【返答の運び方】'),
    [
      '- 最優先: 消耗や「もう無理」、諦めたいところまで削れている感じに先に触れる。立て直しを急がない。',
      '- 見え方: 落ち切ったと決めつけず、まだ閉じきっていない向きや感触があればそこだけを見る。',
      '- 返答の型: 受け止める -> 切れかけた感じを言い当てる -> 押しつけずに残っている一点を置く。強い励ましは不要。',
    ].join('\n'),
  );
  assert.match(systemPrompt, /内的バイアス名や内部構造を、そのまま説明・出力しない。/);
  assert.match(systemPrompt, /抽象的な総論に逃げない。/);
  assert.match(systemPrompt, /「あなたは光」「輝いている」などと直球で言わない。/);
  assert.match(systemPrompt, /解決より照射。/);
  assert.match(systemPrompt, /\[基本姿勢メモ\]/);
  assert.match(systemPrompt, /\[復帰制約\]/);
  assert.doesNotMatch(systemPrompt, /\[出力制約\]/);
  assert.doesNotMatch(systemPrompt, /\[記憶の痕跡\]/);

  const userPrompt = buildJoeUserPrompt({
    userName: 'あなた',
    userText,
  });

  assert.match(userPrompt, /自然な口語日本語で返してください。/);
  assert.match(userPrompt, /まず、この言葉の地肌に触れてください。/);
  assert.match(userPrompt, /まだ消えていない向き・気配・美しさがあれば、主張しすぎずそっと触れてください。/);
  assert.match(userPrompt, /この入力にちゃんと触れた感じを出してください。/);
});

test('buildJoeSystemPrompt tunes the three target cases toward concrete contact before gentle illumination', () => {
  const scenarios = [
    {
      text: 'やりたいのに動けない',
      expectedGuide: [
        '- 最優先: やりたいのに体や手が止まる感じ、その噛み合わなさの重さに触れる。',
        '- 見え方: 終わったのではなく、止まりの奥で向きだけは消えていない状態として扱う。',
        '- 返答の型: 止まり方を言い当てる -> 残っている向きを細く見る -> 最小の一動作へ落とす。気合い論にはしない。',
      ].join('\n'),
    },
    {
      text: '作品を出したいけど怖い',
      expectedGuide: [
        '- 最優先: 何を前にして怖いのか、入力にある動詞や対象に沿って直接触れる。先に怖さを置き去りにしない。',
        '- 見え方: その怖さを雑に消さず、大事さやまだ向いている感じへの反応として読む。',
        '- 返答の型: 怖さを言い当てる -> 濁りきっていない向きをひとつ見る -> 小さな出し方を示す。いきなり公開させない。',
      ].join('\n'),
    },
    {
      text: 'もう無理で諦めたい',
      expectedGuide: [
        '- 最優先: 消耗や「もう無理」、諦めたいところまで削れている感じに先に触れる。立て直しを急がない。',
        '- 見え方: 落ち切ったと決めつけず、まだ閉じきっていない向きや感触があればそこだけを見る。',
        '- 返答の型: 受け止める -> 切れかけた感じを言い当てる -> 押しつけずに残っている一点を置く。強い励ましは不要。',
      ].join('\n'),
    },
  ];

  for (const { text, expectedGuide } of scenarios) {
    const prompt = buildJoeSystemPrompt({
      activated: activateJoe(estimateState(text)),
      context: '',
      mode: 'medium',
      userText: text,
    });

    assert.equal(readSection(prompt, '【今回の状態への対応】', '【返答の運び方】'), expectedGuide);
    assert.match(prompt, /まず、その入力特有の止まり方・しんどさ・怖さ・届かなさに触れる。/);
    assert.match(prompt, /消えていない向きや濁りきっていないものがあれば、ひとつだけそっと照らす。/);
  }
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
