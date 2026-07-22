import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ignite } from '../ignition/ignite.ts';
import { igniteAndSpread } from '../igniteAndSpread.ts';
import { satoIgnition, satoNetwork } from './sato.ts';
import { CUE_POOL } from '../ignition/cuePool.ts';

const B_MAHI = 'belief:麻痺や大丈夫の下に本当の状態がある';
const B_KAKURE = 'belief:本当に大事なものは見ない所に隠れてる';
const B_FUMIKOMI = 'belief:踏み込みすぎると相手は心を閉じる';
const B_MIMAMORU = 'belief:相手が自分で見られる時は見守る';
const CORE = 'core:目を背けない_背けた奥に大切なものがある';
const E_MISUERU = 'emotion:見据えるまなざし';
const E_YASURAKA = 'emotion:静かな安らかさ';

function act(material: ReturnType<typeof igniteAndSpread>, id: string): number {
  return material.surfaced.find((n) => n.id === id)?.activation ?? 0;
}

// ── 励起判定（否定・皮肉・二重否定）──────────────────────────────────────────

const IGNITION_CASES: Array<{ text: string; expect: string[] }> = [
  { text: 'もう何も感じない', expect: [B_MAHI] },
  { text: 'ずっと頑張ってきたけど、もう何も感じない', expect: [B_MAHI] },
  { text: '感情が麻痺してる感じ', expect: [B_MAHI] },
  { text: '本当に大丈夫、心配しないで', expect: [B_MAHI] }, // 大丈夫の下を見据える
  { text: 'もう大丈夫じゃないんです', expect: [] }, // ポジ語が否定で反転
  { text: '別に楽しくなかったけどね', expect: [] }, // ポジ語が否定で反転
  { text: '大丈夫じゃないわけでもないんだけど', expect: [B_MAHI] }, // 二重否定→肯定に戻す
  { text: 'はいはい、大丈夫大丈夫', expect: [B_MAHI] }, // 皮肉→投げやり側へ
  { text: '今はそっとしておいてほしい', expect: [B_FUMIKOMI] },
  { text: 'ずっと蓋をして避けてきた', expect: [B_KAKURE] },
  { text: '今日はいい一日だった', expect: [B_MIMAMORU] },
  { text: '明日の会議は何時ですか', expect: [] }, // 中立
  { text: 'はいはい、了解です進めます', expect: [] }, // はいはい+業務（誤反転回避）
];

test('サトウ励起: 否定・皮肉・二重否定を語ベースで捌く', () => {
  for (const c of IGNITION_CASES) {
    const fired = ignite(c.text, satoIgnition);
    const got = [...fired].sort();
    assert.deepEqual(got, [...c.expect].sort(), `「${c.text}」→ ${got.join(',') || '-'}`);
  }
});

// ── 活性拡散（浮上する感情が入力で変わる＝鏡の純度）─────────────────────────

test('「もう何も感じない」: 核が立ち、見据えるまなざしが浮上する', () => {
  const m = igniteAndSpread('もう何も感じない', 'satou');
  assert.ok(m.ignited.includes(B_MAHI), '麻痺の信念が点火している');
  assert.ok(act(m, CORE) > 0.5, '核が強く立つ');
  assert.ok(act(m, E_MISUERU) > 0.3, '見据えるまなざしが浮上する');
  assert.ok(
    act(m, E_MISUERU) > act(m, E_YASURAKA),
    '直視の入力では見据える > 静かな安らかさ',
  );
});

test('「いい一日だった」: 静かな安らかさが立ち、見据えるは沈む', () => {
  const m = igniteAndSpread('今日はいい一日だった', 'satou');
  assert.ok(m.ignited.includes(B_MIMAMORU), '見守る信念が点火している');
  assert.ok(act(m, E_YASURAKA) > 0.3, '静かな安らかさが浮上する');
  assert.ok(
    act(m, E_YASURAKA) > act(m, E_MISUERU),
    '平穏な入力では静かな安らかさ > 見据える',
  );
});

test('中立入力: 何も点火せず、常駐の核だけが残る', () => {
  const m = igniteAndSpread('明日の会議は何時ですか', 'satou');
  assert.equal(m.ignited.length, 0);
  assert.equal(m.surfaced.length, 1);
  assert.equal(m.surfaced[0].id, CORE);
  assert.ok(Math.abs(m.surfaced[0].activation - 0.4) < 1e-9, '核は baseline 0.40 に常駐');
});

test('未知の agentId: throw せず空材料を返す', () => {
  const m = igniteAndSpread('もう何も感じない', 'unknown');
  assert.deepEqual(m, { agentId: 'unknown', ignited: [], surfaced: [] });
});

// ── 閾値方式（指示書05）─────────────────────────────────────────────────────

const M_SEOWAKU = 'memory:目を背けて取り返しつかなくなった';

test('「大丈夫、あとで考える」で memory:目を背けて取り返しつかなくなった が ignited に入る', () => {
  const fired = ignite('大丈夫、あとで考える', satoIgnition);
  assert.ok(fired.has(M_SEOWAKU), '強がり+先送りの加算で記憶が開くはず');
});

test('「大丈夫」だけでは上記 memory が ignited に入らない（＝加算が効いている）', () => {
  const fired = ignite('大丈夫', satoIgnition);
  assert.ok(!fired.has(M_SEOWAKU), '強がり単独では閾値0.5に届かないはず');
});

test('「最近、何をやっても満たされない」で belief:麻痺や大丈夫の下に本当の状態がある が ignited に入る', () => {
  const fired = ignite('最近、何をやっても満たされない', satoIgnition);
  assert.ok(fired.has(B_MAHI), '虚無の気配だけで閾値0.4に届くはず（現行の一語方式では開かない入力）');
});

test('「体が重くて眠れない」ではサトウは何も点火しない（フィオの領分）', () => {
  const fired = ignite('体が重くて眠れない', satoIgnition);
  assert.equal(fired.size, 0);
});

test('CUE_POOL の全 reverseCueId が、実在する CueGroup.id を指している', () => {
  const ids = new Set(CUE_POOL.map((g) => g.id));
  for (const group of CUE_POOL) {
    if (group.reverseCueId) {
      assert.ok(ids.has(group.reverseCueId), `${group.id}.reverseCueId="${group.reverseCueId}" が存在しない`);
    }
  }
});

test('サトウの全 ElementIgnition.particleId が、サトウのネットワークに実在する', () => {
  const particleIds = new Set(satoNetwork.particles.map((p) => p.id));
  for (const el of satoIgnition.elements ?? []) {
    assert.ok(particleIds.has(el.particleId), `${el.particleId} がサトウのネットワークに無い`);
  }
});
