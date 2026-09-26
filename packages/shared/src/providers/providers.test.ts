import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_TABLE, PROVIDER_DEFINITIONS } from './routeTable.ts';
import { planRoute, resolveSwitched } from './planRoute.ts';
import { applyRouteResult, initialRouteState } from './routeState.ts';

test('ROUTE_TABLE が指示書 第1-1節の表どおり', () => {
  assert.deepEqual(ROUTE_TABLE, {
    free: { reply: ['groq', 'sakura', 'luna', 'deepseek'], others: ['luna', 'deepseek'], reflection: ['luna'] },
    light: { reply: ['luna', 'deepseek'], others: ['luna', 'deepseek'], reflection: ['luna'] },
    standard: { reply: ['luna', 'deepseek'], others: ['luna', 'deepseek'], reflection: ['luna'] },
    premium: { reply: ['sol', 'luna', 'deepseek'], others: ['luna', 'deepseek'], reflection: ['luna'] },
  });
});

test('OTHERS と reflection は無料プランでも無料枠（groq / sakura）を使わない', () => {
  for (const tier of Object.keys(ROUTE_TABLE) as Array<keyof typeof ROUTE_TABLE>) {
    for (const purpose of ['others', 'reflection'] as const) {
      const route = ROUTE_TABLE[tier][purpose];
      assert.ok(!route.includes('groq') && !route.includes('sakura'), `${tier}/${purpose}`);
    }
  }
});

test('DeepSeek は reply / others で全プラン共通の最後のフォールバック', () => {
  for (const tier of Object.keys(ROUTE_TABLE) as Array<keyof typeof ROUTE_TABLE>) {
    for (const purpose of ['reply', 'others'] as const) {
      const route = ROUTE_TABLE[tier][purpose];
      assert.equal(route[route.length - 1], 'deepseek', `${tier}/${purpose}`);
    }
  }
});

test('ENABLE_SAKURA=false で sakura が候補から消える', () => {
  assert.deepEqual(planRoute({ tier: 'free', purpose: 'reply', enableSakura: false }).candidates, [
    'groq',
    'luna',
    'deepseek',
  ]);
  assert.deepEqual(planRoute({ tier: 'free', purpose: 'reply', enableSakura: true }).candidates, [
    'groq',
    'sakura',
    'luna',
    'deepseek',
  ]);
});

test('forcedProvider（開発用）は候補を1つに固定し、無効な sakura は空になる', () => {
  assert.deepEqual(
    planRoute({ tier: 'free', purpose: 'reply', enableSakura: false, forcedProvider: 'sol' }).candidates,
    ['sol'],
  );
  assert.deepEqual(
    planRoute({ tier: 'free', purpose: 'reply', enableSakura: false, forcedProvider: 'sakura' }).candidates,
    [],
  );
});

test('split を使うのは GPT 系（luna / sol）だけで、厳密 JSON も GPT 系だけ', () => {
  for (const def of Object.values(PROVIDER_DEFINITIONS)) {
    const isGpt = def.id === 'luna' || def.id === 'sol';
    assert.equal(def.roleStyle, isGpt ? 'split' : 'folded', def.id);
    assert.equal(def.strictJson, isGpt, def.id);
    assert.equal(def.supportsReasoningEffort, isGpt, def.id);
  }
});

// ── 第12部 ──────────────────────────────────────────────────────────────

test('planRoute：lock が2番目なら、1番目は試さない', () => {
  const route = planRoute({ tier: 'free', purpose: 'reply', enableSakura: true, routeLock: 'sakura' });
  assert.deepEqual(route.candidates, ['sakura', 'luna', 'deepseek']);
  assert.equal(route.routeLock, 'sakura');
});

test('planRoute：lock が最後尾なら、それだけを試す（前には戻らない）', () => {
  const route = planRoute({ tier: 'free', purpose: 'reply', enableSakura: false, routeLock: 'deepseek' });
  assert.deepEqual(route.candidates, ['deepseek']);
});

test('planRoute：不正な lock は無視して先頭から', () => {
  for (const routeLock of ['gemini', '', null, undefined, 42, { id: 'luna' }, 'sol']) {
    const route = planRoute({ tier: 'free', purpose: 'reply', enableSakura: false, routeLock });
    assert.deepEqual(route.candidates, ['groq', 'luna', 'deepseek'], String(routeLock));
    assert.equal(route.routeLock, null);
  }
});

test('planRoute：無効化された sakura の lock も不正として扱う', () => {
  const route = planRoute({ tier: 'free', purpose: 'reply', enableSakura: false, routeLock: 'sakura' });
  assert.deepEqual(route.candidates, ['groq', 'luna', 'deepseek']);
  assert.equal(route.routeLock, null);
});

test('planRoute：プレミアムでも同じ仕組み（Sol → Luna のロック）', () => {
  const route = planRoute({ tier: 'premium', purpose: 'reply', enableSakura: false, routeLock: 'luna' });
  assert.deepEqual(route.candidates, ['luna', 'deepseek']);
});

test('切り替わったとき switched: true（同じなら false、lock 無しなら false）', () => {
  assert.equal(resolveSwitched('groq', 'luna'), true);
  assert.equal(resolveSwitched('sol', 'luna'), true);
  assert.equal(resolveSwitched('groq', 'groq'), false);
  assert.equal(resolveSwitched(null, 'luna'), false);
});

test('クライアント状態：provider を lock に保存し、switched で voiceCarryover が立つ', () => {
  let state = initialRouteState();
  state = applyRouteResult(state, { provider: 'groq', switched: false });
  assert.deepEqual(state, { routeLock: 'groq', voiceCarryover: false });
  state = applyRouteResult(state, { provider: 'luna', switched: true });
  assert.deepEqual(state, { routeLock: 'luna', voiceCarryover: true });
  // 一度立った voiceCarryover はチャットの中では下がらない。
  state = applyRouteResult(state, { provider: 'luna', switched: false });
  assert.deepEqual(state, { routeLock: 'luna', voiceCarryover: true });
  // 不正な provider は無視する。
  state = applyRouteResult(state, { provider: 'gemini' });
  assert.equal(state.routeLock, 'luna');
});

test('クライアント状態：新規チャット時（initialRouteState）に routeLock と voiceCarryover がリセットされる', () => {
  const used = applyRouteResult(initialRouteState(), { provider: 'luna', switched: true });
  assert.notDeepEqual(used, initialRouteState());
  assert.deepEqual(initialRouteState(), { routeLock: null, voiceCarryover: false });
  // 毎回新しいオブジェクト（共有して汚染されない）。
  assert.notEqual(initialRouteState(), initialRouteState());
});
