# Dual Stream Architecture

## 位置づけ

Dual Stream Architecture は、既存の `runInternalOS` を置き換えずに並行運用する観測層です。  
この Phase では、Lexical Stream と Micro-Signal Stream を `FusedState` で合流させ、そこから `ProtoMeaning` を生成します。

## 4つの層

### 1. Lexical Stream

- 入力: `estimateState(text)`
- 役割: 発話の意味面にある欲求・恐れ・凍結・未完了感を粗く読む
- 特徴: 既存の状態推定ロジックをそのまま利用する

### 2. Signal Stream

- 入力: `estimateMicroSignals(text)`
- 役割: 句読点、言いよどみ、距離化、短文化などの微小な残り方を数値化する
- 特徴: dynamic layer を置き換えず、薄い bias として扱う

### 3. FusedState

- 実装: `src/runtime/fusedState.js`
- 入力: `{ state, microSignals }`
- 出力:
  - `lexical`: Lexical Stream の正規化済み値
  - `signal`: Signal Stream の正規化済み値
  - `fused`: 両者を重み付き統合した観測指標

`fused` は、既存層の責務を奪わないように、次のような「意味になる直前の勾配」だけを持ちます。

- `hesitation`
- `guardedness`
- `reachability`
- `unfinishedPull`
- `selfSilencing`
- `pressure`
- `expressionTension`
- `ember`

### 4. ProtoMeaning

- 実装: `src/runtime/protoMeaning.js`
- 入力: `buildProtoMeaning(fusedState, context)`
- 出力:
  - `sensory`: 感覚寄りの原意味
  - `narrative`: 物語寄りの原意味

この Phase では ML / Embedding を使わず、`FusedState` と belief / tension 文脈だけを見たルールベース生成に限定します。

## 既存 `runInternalOS` との関係

- 既存の 13 層は維持する
- `fusedState` と `protoMeaning` は `latentState` に追加保存する
- field / reaction / stance / decision の主経路は置き換えない
- afterglow 正規化でも保持し、並行観測を継続できるようにする

## 下流への反映

この Phase の下流反映は、`activateThoughts` に対する **低優先度の補助入力** のみです。

- 対象: Joe (`creative`) のみ
- 入力: `protoMeaning.narrative`
- 反映位置: thought の topN 選択前スコア
- 重み: `baseScore * 0.08 * match`（既存スコアの 10% 未満）

つまり ProtoMeaning は「勝ち筋を差し替える」ものではなく、すでに浮上している候補の並びを少しだけ繊細に寄せる用途に留めます。

## 可視化

Joe Debug Panel では次を観測できます。

- `fusedState.fused` の統合メトリクス
- `protoMeaning.sensory`
- `protoMeaning.narrative`

`sensory` / `narrative` は別カードに分け、文章化前の感触と物語化前の向きを見分けやすくしています。

## 将来の統合パス

この層は次の拡張の土台です。

- D-6: Interoception
- D-7: PredictionState
- D-8: Session Brain
- D-9: Workspace Gate

現時点では「壊さず残す」ことを優先し、既存の latent substrate と併走する観測層として扱います。
