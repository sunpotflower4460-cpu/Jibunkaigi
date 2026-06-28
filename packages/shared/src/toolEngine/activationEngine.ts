// 活性拡散エンジン（コア）。proto-*.test.ts の共通ロジックを1つに統合したもの。
//
// 1ステップ = 励起の再点火 → 伝播(propagate) → 減衰(decay)。これを規定回数回して平衡させ、
// activation 順に「浮上」を得る。すべて純粋関数（入力配列は破壊しない）。

import type {
  AgentNetwork,
  ParticleKind,
  ParticlePoint,
  ParticleLink,
  SurfacedMaterial,
  SurfacedNode,
} from './engineTypes';

/** 伝播の倍率。activation × weight × この値 を加算する。 */
export const PROPAGATION_SCALE = 0.5;
/** 平衡までのステップ数。 */
export const DEFAULT_STEPS = 20;
/** 浮上とみなす下限 activation。 */
export const SURFACE_THRESHOLD = 0.03;

/**
 * 伝播1回: activation が fire を超えたノードだけを伝播元として、
 * target に activation × weight × PROPAGATION_SCALE を加算（上限 1.0）。
 */
export function propagate(
  particles: ParticlePoint[],
  links: ParticleLink[],
  fire: number,
): ParticlePoint[] {
  const added = new Map<string, number>();
  for (const link of links) {
    const source = particles.find((p) => p.id === link.sourceId);
    if (!source || source.activation <= fire) continue;
    added.set(
      link.targetId,
      (added.get(link.targetId) ?? 0) + source.activation * link.weight * PROPAGATION_SCALE,
    );
  }
  return particles.map((p) => {
    let a = p.activation + (added.get(p.id) ?? 0);
    if (a > 1) a = 1;
    if (a < 0) a = 0;
    return { ...p, activation: a };
  });
}

/** 減衰1回: activation × (1 - decayRate)。ただし baseline 未満には落とさない。 */
export function decay(
  particles: ParticlePoint[],
  baseline: Record<string, number>,
): ParticlePoint[] {
  return particles.map((p) => ({
    ...p,
    activation: Math.max(baseline[p.id] ?? 0, p.activation * (1 - p.decayRate)),
  }));
}

/** id の接頭辞から種別を取り出す。 */
export function parseKind(id: string): ParticleKind {
  const prefix = id.split(':', 1)[0];
  switch (prefix) {
    case 'deepcore':
    case 'core':
    case 'belief':
    case 'memory':
    case 'emotion':
      return prefix;
    default:
      // 想定外の接頭辞は belief 扱い（安全側）。
      return 'belief';
  }
}

/** id の ":" 以降をラベルとして返す。 */
export function parseLabel(id: string): string {
  const idx = id.indexOf(':');
  return idx === -1 ? id : id.slice(idx + 1);
}

/**
 * ネットワークを ignitedIds で点火し、steps 回まわして平衡させた最終ノード状態を返す（純粋）。
 */
export function spreadActivation(
  network: AgentNetwork,
  ignitedIds: string[],
  steps: number = DEFAULT_STEPS,
): ParticlePoint[] {
  let particles = network.particles.map((p) => ({ ...p }));
  const ignitedSet = new Set(ignitedIds);
  for (let step = 0; step < steps; step++) {
    // 毎ステップ再点火（入力刺激が持続している間の挙動を表す）。
    particles = particles.map((p) =>
      ignitedSet.has(p.id) ? { ...p, activation: 1.0 } : p,
    );
    particles = propagate(particles, network.links, network.fire);
    particles = decay(particles, network.baseline);
  }
  return particles;
}

/**
 * 平衡後の状態を「浮上材料」（activation 降順・閾値超え）に整形する。
 */
export function toSurfacedMaterial(
  agentId: string,
  ignitedIds: string[],
  particles: ParticlePoint[],
  threshold: number = SURFACE_THRESHOLD,
): SurfacedMaterial {
  const surfaced: SurfacedNode[] = particles
    .filter((p) => p.activation > threshold)
    .sort((a, b) => b.activation - a.activation)
    .map((p) => ({
      id: p.id,
      kind: parseKind(p.id),
      label: parseLabel(p.id),
      activation: p.activation,
    }));
  return { agentId, ignited: ignitedIds, surfaced };
}
