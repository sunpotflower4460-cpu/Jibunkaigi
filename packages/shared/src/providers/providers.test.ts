import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_TABLE, PROVIDER_DEFINITIONS } from './routeTable.ts';
import { planRoute } from './planRoute.ts';

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
  assert.deepEqual(planRoute({ tier: 'free', purpose: 'reply', enableSakura: false }), [
    'groq',
    'luna',
    'deepseek',
  ]);
  assert.deepEqual(planRoute({ tier: 'free', purpose: 'reply', enableSakura: true }), [
    'groq',
    'sakura',
    'luna',
    'deepseek',
  ]);
});

test('forcedProvider（開発用）は候補を1つに固定し、無効な sakura は空になる', () => {
  assert.deepEqual(
    planRoute({ tier: 'free', purpose: 'reply', enableSakura: false, forcedProvider: 'sol' }),
    ['sol'],
  );
  assert.deepEqual(
    planRoute({ tier: 'free', purpose: 'reply', enableSakura: false, forcedProvider: 'sakura' }),
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
