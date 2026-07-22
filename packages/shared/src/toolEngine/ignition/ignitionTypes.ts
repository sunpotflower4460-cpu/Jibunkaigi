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

export type CueKind = 'state' | 'pos';

/** 共有プールの1グループ。何も決めない。ただの言葉の袋。 */
export interface CueGroup {
  id: string;
  kind: CueKind;
  words: string[];
  /** pos語が皮肉で裏返ったとき、代わりに現れる気配のid。 */
  reverseCueId?: string;
}

/** 1要素が自分で持つ点火条件（閾値方式）。 */
export interface ElementIgnition {
  /** 点火する particle の id。'belief:' でも 'memory:' でもよい。 */
  particleId: string;
  /**
   * どの気配をどれだけ受け取るか（cueId → 重み）。
   * 空なら点火口を持たない（深い信念・コアは伝播でしか到達しない）。
   */
  receives: Record<string, number>;
  /** 自分の閾値。ここを超えたら点火する。 */
  threshold: number;
}

/** 1エージェントの励起設定。各要素が自分で「自分は点火するか」を決める（真空管モデル）。 */
export interface AgentIgnition {
  elements: ElementIgnition[];
}
