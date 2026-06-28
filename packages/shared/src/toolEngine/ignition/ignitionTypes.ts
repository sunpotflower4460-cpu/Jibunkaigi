// 励起判定の型。入力テキスト → どの particle が点火するか を、LLM なしで決める。

/**
 * 形態素解析の抽象インターフェース（差し替え可能）。
 *
 * shared は決定的な純ロジックに保つため、kuromoji の実体はここに注入する。
 * Worker 側で kuromoji.js を生成して渡す想定。未注入なら ignite は部分一致で動く
 * （proto/ignition テストの難問セットは部分一致だけで 100% を達成済み）。
 */
export interface Tokenizer {
  /**
   * 入力を辞書原形の配列にする。
   * 例: "楽しくなかった" -> ["楽しい", "ない"] / "しんどすぎ" -> ["しんどい"]
   */
  toBaseForms(text: string): string[];
}

export type TriggerKind = 'state' | 'pos';

/**
 * 1トリガー = 反応語の集合と、点火するノード。
 * - state: 否定形そのものが状態（感じない/しんどい）。二重否定でなければ点火。
 * - pos:   ポジ語（楽しい/大丈夫）。後ろに否定が付くと反転＝非点火。皮肉で反転。
 */
export interface NodeTrigger {
  /** このトリガーが点いたら 1.0 にする particle id 群。 */
  igniteParticleIds: string[];
  kind: TriggerKind;
  /** 反応語。原形で1個書けば、Tokenizer 注入時は活用・若者言葉も拾える。 */
  words: string[];
}

/** 1エージェントの励起設定。 */
export interface AgentIgnition {
  triggers: NodeTrigger[];
  /**
   * ポジ語が皮肉で反転したときに点火する particle id（投げやり・麻痺側）。
   * 例: サトウなら "belief:麻痺や大丈夫の下に本当の状態がある"。
   */
  sarcasmFallbackParticleId?: string;
}
