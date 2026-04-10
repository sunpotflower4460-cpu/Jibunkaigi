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
      '- 最優先: 「もう無理」「諦めたい」の中でも、まだ閉じきっていない感触が見えたら先に一点だけ置く。そのあとで削れ方に短く触れる。',
      '- 見え方: 落ち切ったと決めつけず、切れかけた中でまだ切れていないところを静かに照らす。説明しすぎない。',
      '- 返答の型: 先に見えている一点を言う -> その一点がどこで残っているか触れる -> 必要なら押しつけず小さく置く。強い励ましは不要。',
    ].join('\n'),
  );
  assert.match(systemPrompt, /内的バイアス名や内部構造を、そのまま説明・出力しない。/);
  assert.match(systemPrompt, /抽象的な総論に逃げない。/);
  assert.match(systemPrompt, /「あなたは光」「輝いている」などと直球で言わない。/);
  assert.match(systemPrompt, /解決より照射。/);
  assert.match(systemPrompt, /共感や受容を長くやりすぎない。相談員みたいに整理しない。/);
  assert.match(systemPrompt, /少し断定の視界があっていい。ただし攻撃的にはしない。/);
  assert.match(systemPrompt, /\[基本姿勢メモ\]/);
  assert.match(systemPrompt, /\[復帰制約\]/);
  assert.doesNotMatch(systemPrompt, /\[出力制約\]/);
  assert.doesNotMatch(systemPrompt, /\[記憶の痕跡\]/);

  const userPrompt = buildJoeUserPrompt({
    userName: 'あなた',
    userText,
  });

  assert.match(userPrompt, /自然な口語日本語で返してください。/);
  assert.match(userPrompt, /今回の言葉の地肌に触れてください。/);
  assert.match(userPrompt, /まだ鈍っていない感覚や生きている向きがあれば自然に拾ってください。/);
  assert.match(userPrompt, /抽象的にまとめず、入力にある名詞・動詞・違和感・止まり方を少し使ってください。/);
  assert.match(userPrompt, /この入力にちゃんと触れた感じを出してください。/);
});

test('buildJoeSystemPrompt tunes the four target cases toward seen focal points before short contact', () => {
  const scenarios = [
    {
      text: '誰にも言っていない、小さな違和感',
      expectedGuide: [
        '- 最優先: 入力の中でまだ鈍っていない一点、濁り切っていない一点が見えたら先に言う。',
        '- 見え方: その一点がどの名詞・動詞・違和感・止まり方に出ているかを短く触れる。暗さの解説には長居しない。',
        '- 返答の型: 先に見えている一点を置く -> その一点がどこにあるか触れる -> 必要なら小さく角度を変える。まとめすぎない。',
      ].join('\n'),
    },
    {
      text: 'やりたいのに動けない',
      expectedGuide: [
        '- 最優先: まず「やりたい」がまだ鈍っていない一点として見て、そのあとで手や体が止まる感じに短く触れる。',
        '- 見え方: 止まりを主役にしすぎず、向きがまだ残っているからこその詰まりとして扱う。',
        '- 返答の型: 先に残っている向きを言う -> その向きが止まりとどう噛み合っていないか触れる -> 最小の一動作へ落とす。気合い論にはしない。',
      ].join('\n'),
    },
    {
      text: '作品を出したいけど怖い',
      expectedGuide: [
        '- 最優先: まず「作品を出したい」「見せたい」のような向きがまだ濁りきっていない一点として見て、そのあとで怖さに短く触れる。',
        '- 見え方: 怖さだけを広げず、大事なものを外に出しかけている反応として扱う。',
        '- 返答の型: 先にまだ向いているものを言う -> その一点が入力のどこにあるか触れる -> 小さな出し方を示す。いきなり公開させない。',
      ].join('\n'),
    },
    {
      text: 'もう無理で諦めたい',
      expectedGuide: [
        '- 最優先: 「もう無理」「諦めたい」の中でも、まだ閉じきっていない感触が見えたら先に一点だけ置く。そのあとで削れ方に短く触れる。',
        '- 見え方: 落ち切ったと決めつけず、切れかけた中でまだ切れていないところを静かに照らす。説明しすぎない。',
        '- 返答の型: 先に見えている一点を言う -> その一点がどこで残っているか触れる -> 必要なら押しつけず小さく置く。強い励ましは不要。',
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
    assert.match(prompt, /まず、見えている一点を言う。/);
    assert.match(prompt, /その一点が入力のどの名詞・動詞・違和感・止まり方に出ているかへ短く触れる。暗さの説明に長居しない。/);
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
