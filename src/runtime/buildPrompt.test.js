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
      '- 最優先: 消耗や「もう無理」に先に触れる。立て直しを急がない。',
      '- 見え方: 途切れそうな中でも、完全には閉じていない一点だけを見る。',
      '- 返答の型: 受け止める -> まだ閉じきっていない一点を置く。強い励ましは不要。',
    ].join('\n'),
  );
  assert.match(systemPrompt, /内的バイアス名や内部構造を、そのまま説明・出力しない。/);
  assert.match(systemPrompt, /\[基本姿勢メモ\]/);
  assert.match(systemPrompt, /\[復帰制約\]/);
  assert.doesNotMatch(systemPrompt, /\[出力制約\]/);
  assert.doesNotMatch(systemPrompt, /\[記憶の痕跡\]/);

  const userPrompt = buildJoeUserPrompt({
    userName: 'あなた',
    userText,
  });

  assert.match(userPrompt, /自然な口語日本語で返してください。/);
  assert.match(userPrompt, /この入力にちゃんと触れた感じを出してください。/);
});

test('buildJoeBiasPack keeps the required Joe scenarios focused to two injected materials', () => {
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
    assert.ok(pack.length >= 2 && pack.length <= 3);

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
