import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreDelegateVoices,
  pickDelegateByContext,
  type DelegateMessageLike,
} from './delegateSelection.ts';

const CONCRETE = ['ray', 'joe', 'ken', 'mina', 'satou', 'tom', 'fio'] as const;

function topVoice(scores: Record<string, number>): string {
  return Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
}

// ── scoreDelegateVoices: 決定的なスコアリング（偶発性に依存しない）──────────

test('scoreDelegateVoices: 感情・つらさの語はミナが最高', () => {
  assert.equal(topVoice(scoreDelegateVoices('つらくて悲しくて、もう無理かもしれない')), 'mina');
});

test('scoreDelegateVoices: 整理・選択の語はケンが最高', () => {
  assert.equal(topVoice(scoreDelegateVoices('どうすれば整理できる？選択肢が多くて迷う')), 'ken');
});

test('scoreDelegateVoices: 現実・行動の語はサトウが最高', () => {
  assert.equal(
    topVoice(scoreDelegateVoices('お金も時間もないのに、やらなきゃいけない現実から逃げてる')),
    'satou',
  );
});

test('scoreDelegateVoices: 火種・諦めきれなさはジョーが最高', () => {
  assert.equal(topVoice(scoreDelegateVoices('本当はまだやりたい。悔しくて手放せない')), 'joe');
});

test('scoreDelegateVoices: 手がかりが希薄ならレイがデフォルト優勢', () => {
  assert.equal(topVoice(scoreDelegateVoices('今日はいい天気だった')), 'ray');
});

test('scoreDelegateVoices: 慣性回避 — 直前がミナならミナのスコアが減衰', () => {
  const prev: DelegateMessageLike[] = [
    { role: 'user', text: 'つらい' },
    { role: 'agent', text: '…', agentId: 'mina' },
  ];
  const withPrev = scoreDelegateVoices('つらくて悲しい', prev);
  const without = scoreDelegateVoices('つらくて悲しい', []);
  assert.ok(withPrev.mina < without.mina, '直前ミナでもスコアが下がっていない');
});

test('scoreDelegateVoices: 慣性回避は直前が具体エージェントのときのみ（userやmirrorは無視）', () => {
  const prevUser: DelegateMessageLike[] = [{ role: 'user', text: 'つらい' }];
  const base = scoreDelegateVoices('つらくて悲しい', []);
  const afterUser = scoreDelegateVoices('つらくて悲しい', prevUser);
  assert.equal(afterUser.mina, base.mina, 'userの直前で減衰してはいけない');
});

// ── pickDelegateByContext: softmax + rng（偶発部分は rng 固定で決定論化）──────

test('pickDelegateByContext: rng を固定すれば結果は再現的', () => {
  const fixed = () => 0.42;
  const a = pickDelegateByContext('つらい', [], { rng: fixed });
  const b = pickDelegateByContext('つらい', [], { rng: fixed });
  assert.equal(a, b);
});

test('pickDelegateByContext: 常に具体エージェントを返す（空入力でも）', () => {
  const r = pickDelegateByContext('', [], { rng: () => 0.99 });
  assert.ok((CONCRETE as readonly string[]).includes(r));
});

test('pickDelegateByContext: 異常な温度（0）でもクラッシュせず具体エージェントを返す', () => {
  const r = pickDelegateByContext('つらい', [], { rng: () => 0.5, temperature: 0 });
  assert.ok((CONCRETE as readonly string[]).includes(r));
});

test('pickDelegateByContext: rng=0 は重み配列の先頭(ray)に当たる（cumulative sampling の性質）', () => {
  // この性質はゴールデン回帰の固定点。挙動が変わったら検知する。
  const r = pickDelegateByContext('お金の話', [], { rng: () => 0 });
  assert.equal(r, 'ray');
});
