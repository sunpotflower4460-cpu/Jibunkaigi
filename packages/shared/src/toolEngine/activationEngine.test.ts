import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  propagate,
  decay,
  spreadActivation,
  parseKind,
  parseLabel,
  PROPAGATION_SCALE,
} from './activationEngine.ts';
import type { AgentNetwork, ParticlePoint, ParticleLink } from './engineTypes.ts';

const P = (id: string, activation: number, decayRate: number): ParticlePoint => ({
  id,
  activation,
  decayRate,
});

test('propagate: 発火ゲートを超えたノードだけが伝播元になる', () => {
  const particles = [P('belief:a', 0.5, 0.1), P('emotion:b', 0, 0.3)];
  const links: ParticleLink[] = [{ sourceId: 'belief:a', targetId: 'emotion:b', weight: 0.8 }];
  // a(0.5) > fire(0.42) → b に 0.5*0.8*0.5 = 0.2 加算
  const next = propagate(particles, links, 0.42);
  assert.equal(next.find((p) => p.id === 'emotion:b')!.activation, 0.5 * 0.8 * PROPAGATION_SCALE);
});

test('propagate: 発火ゲート以下のノードは伝播しない（常駐漏れ防止）', () => {
  const particles = [P('core:a', 0.4, 0.1), P('emotion:b', 0, 0.3)];
  const links: ParticleLink[] = [{ sourceId: 'core:a', targetId: 'emotion:b', weight: 0.8 }];
  const next = propagate(particles, links, 0.42); // 0.4 <= 0.42 → 伝播なし
  assert.equal(next.find((p) => p.id === 'emotion:b')!.activation, 0);
});

test('propagate: 負の weight は抑制（減算）', () => {
  const particles = [P('emotion:a', 1, 0.3), P('emotion:b', 0.5, 0.3)];
  const links: ParticleLink[] = [{ sourceId: 'emotion:a', targetId: 'emotion:b', weight: -0.4 }];
  const next = propagate(particles, links, 0.42);
  assert.equal(next.find((p) => p.id === 'emotion:b')!.activation, 0.5 + 1 * -0.4 * PROPAGATION_SCALE);
});

test('propagate: activation は 0..1 にクランプ', () => {
  const particles = [P('a', 1, 0.1), P('b', 0.9, 0.1)];
  const links: ParticleLink[] = [{ sourceId: 'a', targetId: 'b', weight: 1 }];
  const next = propagate(particles, links, 0.42);
  assert.equal(next.find((p) => p.id === 'b')!.activation, 1); // 0.9+0.5 を 1 にクランプ
});

test('decay: 比例減衰（固定減算ではない）', () => {
  const particles = [P('emotion:x', 0.8, 0.3)];
  const next = decay(particles, {});
  assert.ok(Math.abs(next[0].activation - 0.8 * (1 - 0.3)) < 1e-9);
});

test('decay: baseline 未満には落ちない（常駐）', () => {
  const particles = [P('core:x', 0.4, 0.1)];
  const next = decay(particles, { 'core:x': 0.4 });
  assert.equal(next[0].activation, 0.4); // 0.4*0.9=0.36 だが baseline 0.4 で下げ止まる
});

test('spreadActivation: 入力を破壊しない（純粋）', () => {
  const net: AgentNetwork = {
    agentId: 't',
    fire: 0.42,
    baseline: { 'core:c': 0.4 },
    particles: [P('core:c', 0.4, 0.1), P('emotion:e', 0, 0.3)],
    links: [{ sourceId: 'core:c', targetId: 'emotion:e', weight: 0.7 }],
  };
  const before = net.particles.map((p) => p.activation).join(',');
  spreadActivation(net, ['core:c']);
  const after = net.particles.map((p) => p.activation).join(',');
  assert.equal(before, after);
});

test('parseKind / parseLabel', () => {
  assert.equal(parseKind('emotion:見据えるまなざし'), 'emotion');
  assert.equal(parseKind('deepcore:人生の全ては遊び'), 'deepcore');
  assert.equal(parseLabel('belief:麻痺や大丈夫の下に本当の状態がある'), '麻痺や大丈夫の下に本当の状態がある');
});
