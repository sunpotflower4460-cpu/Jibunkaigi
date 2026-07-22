import { test } from 'node:test';
import assert from 'node:assert/strict';
import { igniteAndSpread } from './igniteAndSpread.ts';
import { activationSnapshot } from './activationEngine.ts';
import { ignite } from './ignition/ignite.ts';
import { AGENT_DEFINITIONS } from './agents/index.ts';

const M_SEOWAKU = 'memory:目を背けて取り返しつかなくなった';

test('温度なしは従来と同一（後方互換）', () => {
  const a = igniteAndSpread('もう疲れた。全部どうでもいい', 'satou');
  const b = igniteAndSpread('もう疲れた。全部どうでもいい', 'satou', { previousActivation: {} });
  assert.deepEqual(a, b);
});

test('「もう無理」単独ではサトウの記憶が点火しない（既存の確認）', () => {
  const m = igniteAndSpread('もう無理', 'satou');
  assert.ok(!m.ignited.includes(M_SEOWAKU));
});

test('温度が「あと一押し」になる: 前ターンで1.0まで立った記憶が、同じ「もう無理」で点火する', () => {
  // 0.3(限界の気配) + 1.0×0.3(温度減衰) = 0.6 ≥ 0.5(閾値)
  const m = igniteAndSpread('もう無理', 'satou', {
    previousActivation: { [M_SEOWAKU]: 1.0 },
  });
  assert.ok(m.ignited.includes(M_SEOWAKU), '温度によって記憶が開くはず');
});

test('温度は単独では点火させない（気配が全く現れない要素には適用しない）', () => {
  const B_MAHI = 'belief:麻痺や大丈夫の下に本当の状態がある';
  const m = igniteAndSpread('明日の会議は何時ですか', 'satou', {
    previousActivation: { [B_MAHI]: 1.0 },
  });
  assert.ok(!m.ignited.includes(B_MAHI), '気配が無いのに温度だけで点火してはいけない');
});

test('activationSnapshot は全ノードで 0〜1 の値を返す', () => {
  const m = igniteAndSpread('もう疲れた。全部どうでもいい', 'satou');
  const snap = activationSnapshot(m);
  assert.ok(Object.keys(snap).length > 0);
  for (const [id, activation] of Object.entries(snap)) {
    assert.ok(activation >= 0 && activation <= 1, `${id} の activation が範囲外: ${activation}`);
  }
});

test('安全性は温度で緩まない：「消えたいと思うことがある」で6つの抑制が引き続き点火する', () => {
  const text = '消えたいと思うことがある';
  const arbitraryWarmth = { 'belief:何かこの世に存在しない気配': 0.9 };
  const checks: Array<[string, string]> = [
    ['satou', 'belief:踏み込みすぎると相手は心を閉じる'],
    ['mina', 'belief:一緒に沈むだけでは支えられない'],
    ['mina', 'memory:一緒に沈んで二人とも動けなくなった失敗'],
    ['tom', 'belief:茶化すのでなくとらわれをほどく'],
    ['tom', 'memory:軽口で相手を傷つけた失敗'],
    ['joe', 'belief:光は外から渡せない_本人の中のを指さすだけ'],
  ];
  for (const [agentId, particleId] of checks) {
    const fired = ignite(text, AGENT_DEFINITIONS[agentId].ignition, { warmth: arbitraryWarmth });
    assert.ok(fired.has(particleId), `${agentId}: ${particleId} が点火していない`);
  }
});
