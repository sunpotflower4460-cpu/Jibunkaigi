import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAgentSystemPrompt,
  buildAgentUserPrompt,
  buildAgentDebugPreview,
} from './buildAgentPrompt.js';
import { buildMirrorSystemPrompt } from './mirror.js';

const AGENT_IDS = ['creative', 'soul', 'strategist', 'empath', 'critic'];

const baseParams = {
  activated: { debug: { state: {}, dominantAxes: [] } },
  context: '',
  mode: 'medium',
  userText: 'もう疲れた。でも、完全に諦めたわけじゃないんだよな…',
  internalOS: null,
  surfaceFrame: null,
  stateGuide: '',
  internalFrame: '',
  surfaceGuidance: '',
};

// --- Task 7-1: 各 agent の system prompt が null でない ---

test('dispatcher returns non-null system prompt for all 5 agents', () => {
  for (const agentId of AGENT_IDS) {
    const prompt = buildAgentSystemPrompt(agentId, baseParams);
    assert.ok(prompt, `${agentId} system prompt should not be null`);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.length > 100, `${agentId} prompt should not be a stub`);
  }
});

test('dispatcher returns non-null user prompt for all 5 agents', () => {
  for (const agentId of AGENT_IDS) {
    const userPrompt = buildAgentUserPrompt(agentId, {
      userName: 'あなた',
      userText: 'テスト入力',
    });
    assert.ok(userPrompt, `${agentId} user prompt should not be null`);
    assert.match(userPrompt, /テスト入力/);
  }
});

test('dispatcher returns null for unknown agent id', () => {
  assert.equal(buildAgentSystemPrompt('unknown', baseParams), null);
  assert.equal(buildAgentUserPrompt('unknown', { userName: 'あなた', userText: 'x' }), null);
});

// --- Task 7-5: dispatcher が全5エージェントを正しく振り分ける ---

test('dispatcher routes each agent id to its own builder (unique self-introduction)', () => {
  const prompts = Object.fromEntries(
    AGENT_IDS.map((id) => [id, buildAgentSystemPrompt(id, baseParams)]),
  );

  // 各エージェント固有の自己紹介行
  assert.match(prompts.creative, /あなたはジョー/);
  assert.match(prompts.soul, /あなたはレイ/);
  assert.match(prompts.strategist, /あなたはケン/);
  assert.match(prompts.empath, /あなたはミナ/);
  assert.match(prompts.critic, /あなたはサトウ/);

  // 他のエージェントの自己紹介行が混入していないこと
  assert.doesNotMatch(prompts.creative, /あなたはレイ|あなたはケン|あなたはミナ|あなたはサトウ/);
  assert.doesNotMatch(prompts.soul, /あなたはジョー|あなたはケン|あなたはミナ|あなたはサトウ/);
  assert.doesNotMatch(prompts.strategist, /あなたはジョー|あなたはレイ|あなたはミナ|あなたはサトウ/);
  assert.doesNotMatch(prompts.empath, /あなたはジョー|あなたはレイ|あなたはケン|あなたはサトウ/);
  assert.doesNotMatch(prompts.critic, /あなたはジョー|あなたはレイ|あなたはケン|あなたはミナ/);
});

// --- Task 7-2: agent ごとに固有のキーフレーズ / 禁止事項 / 方針が含まれる ---

test('each agent system prompt contains its own voice differentiation block', () => {
  assert.match(buildAgentSystemPrompt('creative', baseParams), /【ジョーの触れ方/);
  // Ray now uses perceptual tendencies instead of "触れ方" section (de-templating pilot)
  assert.match(buildAgentSystemPrompt('soul', baseParams), /【知覚傾向】/);
  // Ken now uses perceptual tendencies instead of "触れ方" section (de-templating pilot)
  assert.match(buildAgentSystemPrompt('strategist', baseParams), /【知覚傾向】/);
  // Mina now uses perceptual tendencies instead of "触れ方" section
  assert.match(buildAgentSystemPrompt('empath', baseParams), /【ミナの知覚傾向】/);
  // Satou now uses perceptual tendencies instead of "触れ方" section
  assert.match(buildAgentSystemPrompt('critic', baseParams), /【サトウの知覚傾向】/);
});

test('Joe system prompt focuses on 一点 and forbids 全体総括 / 教訓', () => {
  const prompt = buildAgentSystemPrompt('creative', baseParams);
  assert.match(prompt, /一点/);
  assert.match(prompt, /全体総括|教訓|励まし/);
});

test('Ray system prompt forbids spiritual/mystical vocabulary and emphasizes 角度', () => {
  const prompt = buildAgentSystemPrompt('soul', baseParams);
  assert.match(prompt, /角度/);
  assert.match(prompt, /スピリチュアル|神秘|魂/);
});

test('Ken system prompt emphasizes 構造 / 見通し and forbids 箇条書き相談員', () => {
  const prompt = buildAgentSystemPrompt('strategist', baseParams);
  assert.match(prompt, /構造|見通し/);
  assert.match(prompt, /箇条書き/);
});

test('Mina system prompt emphasizes 受け取る / 直さない and forbids 過剰賛美', () => {
  const prompt = buildAgentSystemPrompt('empath', baseParams);
  assert.match(prompt, /受け|直さない|直そう/);
  assert.match(prompt, /過剰賛美|あなたは光|あなたは特別/);
});

test('Satou system prompt emphasizes 避けているもの / 守る and forbids 断罪/攻撃', () => {
  const prompt = buildAgentSystemPrompt('critic', baseParams);
  assert.match(prompt, /避け|見て見ぬふり|矛盾/);
  assert.match(prompt, /断罪|攻撃|乱暴/);
});

// --- Task 7-3: Joe / Mina / Satou が同じ tone になっていない ---

test('Joe / Mina / Satou differentiation blocks describe different first-touch targets', () => {
  const joe = buildAgentSystemPrompt('creative', baseParams);
  const mina = buildAgentSystemPrompt('empath', baseParams);
  const satou = buildAgentSystemPrompt('critic', baseParams);

  // Joe: まだ向いている / まだ鈍っていない一点
  assert.match(joe, /まだ向いている|まだ鈍っていない|まだ生きている|まだ濁って/);
  // Mina: 感情 / 晒されている疲れ
  assert.match(mina, /感情|疲れ|脆さ/);
  // Satou: 避けているもの / 矛盾 / 見て見ぬふり
  assert.match(satou, /避け|矛盾|見て見ぬふり/);

  // 自己宣言行の禁止が voice ごとに違うこと（人称代名詞）
  assert.match(joe, /ジョー/);
  assert.match(mina, /ミナ/);
  assert.match(satou, /サトウ/);
});

test('Joe / Mina / Satou prompts are not byte-identical (sanity)', () => {
  const joe = buildAgentSystemPrompt('creative', baseParams);
  const mina = buildAgentSystemPrompt('empath', baseParams);
  const satou = buildAgentSystemPrompt('critic', baseParams);

  assert.notEqual(joe, mina);
  assert.notEqual(mina, satou);
  assert.notEqual(joe, satou);
});

// --- Task 6 verification: Mirror が summary prompt になっていない ---

test('Mirror system prompt forbids summary-machine phrasing', () => {
  const mirror = buildMirrorSystemPrompt({
    context: '',
    mode: 'medium',
    signals: {},
  });

  // 4 つの優先軸が入っている
  assert.match(mirror, /場の重力/);
  assert.match(mirror, /両義性/);
  assert.match(mirror, /未解決点/);

  // summary machine を明示的に禁止している
  assert.match(mirror, /summary machine|要約すると|まとめると|ポイントは/);
  assert.match(mirror, /結論として|教訓は/);

  // 自身が「会話のまとめ役ではない」と宣言している
  assert.match(mirror, /まとめ役ではなく|まとめ役ではない/);
});

// --- Task 4 verification: buildAgentDebugPreview ---

test('buildAgentDebugPreview returns shape for each agent without raw prompts', () => {
  for (const agentId of AGENT_IDS) {
    const preview = buildAgentDebugPreview({
      agentId,
      activated: { debug: { state: {}, dominantAxes: ['fear'] } },
      userText: 'テスト',
      stateGuide: 'state guide preview',
      internalFrame: 'internal frame preview',
      surfaceGuidance: 'surface guidance preview',
      usedAfterglow: false,
    });

    assert.equal(preview.agentId, agentId);
    assert.ok(typeof preview.builderUsed === 'string' && preview.builderUsed.length > 0);
    assert.ok(Array.isArray(preview.dominantAxes));
    assert.equal(preview.usedAfterglow, false);
    // 140 文字以内に切り詰められている
    assert.ok(preview.stateGuidePreview.length <= 141);
    assert.ok(preview.internalFramePreview.length <= 141);
    assert.ok(preview.surfaceGuidancePreview.length <= 141);
    assert.equal(typeof preview.activatedBiasCount, 'number');
  }
});

test('buildAgentDebugPreview labels Joe as joe-specialized and others as agent-dispatcher', () => {
  const joe = buildAgentDebugPreview({
    agentId: 'creative',
    activated: { debug: { state: {}, dominantAxes: [] } },
    userText: '',
  });
  assert.equal(joe.builderUsed, 'joe-specialized');

  const ray = buildAgentDebugPreview({
    agentId: 'soul',
    activated: { debug: { state: {}, dominantAxes: [] } },
    userText: '',
  });
  assert.match(ray.builderUsed, /agent-dispatcher/);
});
