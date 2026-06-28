// 活性拡散エンジンの型定義。
//
// 設計原則（proto-*.test.ts で検証済みの知見）:
//   - 励起はオンオフ（点いたら activation = 1.0）。強弱は手で与えず、拡散が生む。
//   - 減衰は比例（activation * (1 - decayRate)）。固定減算は階調が出ないため不可。
//   - 常駐(baseline): コア系ノードは減衰しても baseline 未満には落ちない。
//   - 発火ゲート FIRE は baseline より上に置く（常駐ノードの漏れ伝播を防ぐ）。FIRE は人ごと。

export type ParticleKind = 'deepcore' | 'core' | 'belief' | 'memory' | 'emotion';

/** ノード（意味）: 信念・記憶・感情・核。 */
export interface ParticlePoint {
  /** "<kind>:<label>" 形式（例: "emotion:見据えるまなざし"）。 */
  id: string;
  /** 0..1。励起で 1.0、拡散で増減、減衰で baseline まで戻る。 */
  activation: number;
  /** 比例減衰率。コア=0.10 / 信念=0.16 / 記憶=0.18 / 感情=0.26〜0.30 目安。 */
  decayRate: number;
}

/** リンク（ノード間結合）。weight が負なら抑制。 */
export interface ParticleLink {
  sourceId: string;
  targetId: string;
  weight: number;
}

/** 1エージェントの活性拡散ネットワーク。 */
export interface AgentNetwork {
  agentId: string;
  particles: ParticlePoint[];
  links: ParticleLink[];
  /** id -> 常駐値。コア/deepcore のみ持つのが通例。 */
  baseline: Record<string, number>;
  /** 発火ゲート。必ず baseline の最大値より上にする（人ごとに違う）。 */
  fire: number;
}

/** 浮上した1ノード（活性拡散の結果）。 */
export interface SurfacedNode {
  id: string;
  kind: ParticleKind;
  /** id の ":" 以降（人間可読なラベル）。 */
  label: string;
  /** 平衡後の activation（強度）。 */
  activation: number;
}

/** igniteAndSpread の出力（浮上材料）。 */
export interface SurfacedMaterial {
  agentId: string;
  /** 励起で点火した particle id 群。 */
  ignited: string[];
  /** activation 降順の浮上ノード。 */
  surfaced: SurfacedNode[];
}
