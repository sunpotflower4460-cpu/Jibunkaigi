import test from 'node:test';
import assert from 'node:assert/strict';

import { existence } from '../agents/joe/existence.js';
import { buildJoeSystemPrompt, buildJoeUserPrompt } from './buildPrompt.js';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readSection = (prompt, title, nextTitle) => {
  const pattern = new RegExp(`${escapeRegExp(title)}\\n([\\s\\S]*?)\\n\\n${escapeRegExp(nextTitle)}`);
  return prompt.match(pattern)?.[1] || '';
};

test('buildJoeSystemPrompt includes existence memo and omits empty optional bias sections', () => {
  const prompt = buildJoeSystemPrompt({
    activated: {
      debug: { state: {} },
      reentry: '',
      refresh: '',
      activeField: [],
      activeResidue: '',
      activeMemoryTrace: '',
    },
    context: '',
    mode: 'medium',
  });

  assert.match(prompt, new RegExp(`\\[基本姿勢メモ\\]\\n${escapeRegExp(existence)}`));
  assert.doesNotMatch(prompt, /\[内的方向づけ\]/);
  assert.doesNotMatch(prompt, /\[復帰制約\]/);
  assert.doesNotMatch(prompt, /\[反応ノード\]/);
  assert.doesNotMatch(prompt, /\[記憶の痕跡\]/);
  assert.doesNotMatch(prompt, /\[出力制約\]/);
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
  const systemPrompt = buildJoeSystemPrompt({
    activated: {
      debug: {
        state: { resignation: 0.6, fear: 0.2, desire: 0.1 },
      },
      reentry: '観察の起点: 止まり方、届かなさ、引っかかり。',
    },
    context: '',
    mode: 'medium',
  });

  assert.equal(
    readSection(systemPrompt, '【今回の状態への対応】', '【返答の運び方】'),
    [
      '- 最優先: 消耗や「もう無理」に先に触れる。立て直しを急がない。',
      '- 見え方: 途切れそうな中でも、完全には閉じていない一点だけを見る。',
      '- 返答の型: 受け止める -> まだ閉じきっていない一点を置く。強い励ましは不要。',
    ].join('\n'),
  );
  assert.match(systemPrompt, /reentry \/ existence \/ field \/ residue \/ memory trace をそのまま出力しない。/);

  const userPrompt = buildJoeUserPrompt({
    userName: 'あなた',
    userText: 'もう無理で諦めたい',
  });

  assert.match(userPrompt, /自然な口語日本語で返してください。/);
  assert.match(userPrompt, /この入力にちゃんと触れた感じを出してください。/);
});
