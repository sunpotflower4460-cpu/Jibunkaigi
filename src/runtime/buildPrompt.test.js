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
  assert.match(systemPrompt, /言い切りはしていいが、乱暴な言い方・突き放す言い方・荒い口調にはしない。/);
  assert.match(systemPrompt, /少し断定の視界があっていい。ただし攻撃的にはしない。/);
  assert.match(systemPrompt, /「まだ残っている」「鈍っていない」「濁り切っていない」/);
  assert.doesNotMatch(systemPrompt, /兄貴っぽさ/);
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

test('buildJoeSystemPrompt accepts internalOS and keeps the shared OS frame thin', () => {
  const text = '作品を出したいけど怖い';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
    internalOS: runInternalOS(text, { agentId: 'creative', mode: 'medium' }),
  });

  const internalFrame = readSection(prompt, '【共通OSの薄い内部フレーム】', '【返答の運び方】');
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

test('buildJoeSystemPrompt contains sharpened Joe-specific forbidden behaviors', () => {
  const text = 'もう無理で諦めたい';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
  });

  // ジョー固有の禁止事項が明示されている
  assert.match(prompt, /前向きさを足さない/);
  assert.match(prompt, /相手を元気づけにいかない/);
  assert.match(prompt, /問題解決モードに流れすぎない/);
  assert.match(prompt, /見えていないのに見えたふりをしない/);
  assert.match(prompt, /過去の説明の要約屋にならない/);
  // 組み立て禁止が返答の組み立て方セクションに含まれている
  assert.match(prompt, /そこで止まる。明るい結論で締めない/);
  assert.match(prompt, /組み立て禁止/);
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

  // stateGuide はバイアスタイトル形式 [X] を含まない（biasSections と混在していない）
  const stateGuide = readSection(prompt, '【今回の状態への対応】', '【返答の運び方】');
  assert.ok(stateGuide.length > 0);
  assert.doesNotMatch(stateGuide, /\[.*\]/);

  // 返答の組み立て方が 5 ステップに拡張されている
  assert.match(prompt, /3\. まだ消えていない向きや火種があるなら、照らす/);
  assert.match(prompt, /5\. そこで止まる/);
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
  assert.ok(preview.joeStateGuidePreview.length > 0);
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

test('buildJoeSystemPrompt single-point focus is sharpened with find-not-add principle', () => {
  const text = 'もう無理で諦めたい';
  const prompt = buildJoeSystemPrompt({
    activated: activateJoe(estimateState(text)),
    context: '',
    mode: 'medium',
    userText: text,
  });

  // 一点性: 一点を見つけたらそこを掘る、横に広げない
  assert.match(prompt, /一点を見つけたらそこを掘れ/);
  // 焦点の方向: 外から希望を足すのではなく、もともとあるものを見つける
  assert.match(prompt, /もともとそこにあるものを見つけて照らす/);
  // 着地: ステップ4は省略可能
  assert.match(prompt, /なければ省く/);
  // 着地: 止まれる場面で急がない
  assert.match(prompt, /止まれる場面でステップ4を急がない/);
});
