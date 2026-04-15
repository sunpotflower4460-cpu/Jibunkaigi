# Belief Tension（信念 tension 層）

## この文書の役割

`beliefTensionLayer.js` の設計と実装を定義する。

belief tension は、前景化した active belief に対して、入力文脈の中にある
「ズレ / 引っかかり / 守りたさ / 引かれ」を検出し、
後段の反応・焦点・意味づけを少し変えるための**内的 state 層**である。

---

## 基本原則

### 1. ルール違反検知エンジンではない

belief tension は「ルール違反を見つける」処理ではない。
- どこに違和感があるか
- 何に反しやすいか
- どこに引っかかるか
- 何を守りたくなるか

を**軽く立てる**層である。

### 2. 返答にそのまま出さない

tension の文言はユーザーへの返答にそのまま混ぜない。
後段の反応・焦点・意味づけを変えるための**内的 state** として扱う。

### 3. active beliefs だけを対象にする

前景化されなかった belief は tension の対象にならない。  
その回に active になった Core / Branch / Leaf だけを使って tension を立てる。

### 4. 数は多すぎなくてよい

全 tension の上限は 6 本（`MAX_TOTAL_TENSIONS`）。  
tension type ごとの上限は 3 本（`MAX_TENSIONS_PER_TYPE`）。

---

## precondition chain での位置

```
Maker Seed
→ Home Layer
→ Existence Layer 1
→ Existence Layer 2
→ Belief Core Layer（信念層1）
→ Belief Branch Layer（信念層2）
→ Belief Leaf Layer（信念層3）
→ Belief Tension Layer  ← ここ（Step 8）
→ Build Precondition Filter
→ Build Precondition Bias
```

tension は `preconditionFilter` / `preconditionBias` の前に立てられ、
後段がその tension を読める位置に保持される。

---

## BeliefTension の shape

```js
type BeliefTension = {
  activeTensions: {
    beliefId: string,           // どの belief が反応したか
    sourceLayer: 'core' | 'branch' | 'leaf',  // どの層か
    tensionType: 'friction' | 'violation' | 'pull' | 'protection',  // tension の種類
    strength: number,           // 0〜1
    note: string,               // 内部メモ（後段の参照用）
    axis: string | null,        // belief の axis
  }[],
  dominantTensionAxis: string | null,  // 最強 tension の axis
  totalTensionStrength: number,        // 全 tension の強度の合計
}
```

---

## tension type の定義

### friction（摩擦）

前景化した信念と入力文脈にズレがある。

**条件**: 入力に「急ぐ / 解決へ飛ぶ / すぐ励ます」トーンがあり、  
belief の axis が「ゆっくり / 在る / 曖昧さを保つ」系（`gentleness`, `pace`, `patience`, `presence`, `ambiguity`, `prelingual`, `openness`）のとき。

**例**:
- active leaf: `do_not_rush_to_cheer`（すぐ励まさなくていい）
- 入力: すぐに元気づけ・解決へ飛ぶ
- → friction

### violation（違反）

前景化した信念が、かなり明確に逆方向へ押されている。

**条件**: 入力に「断言 / 一刀両断 / 雑に扱う」トーンがあり、  
belief の axis が「守る / 支える / 安定させる」系（`shelter`, `containment`, `protection`, `grounding`, `support`, `stability`）のとき。

**例**:
- active branch: `place_for_fragile`（崩れたままでも置ける場所が必要だ）
- 入力: 触れる前に一刀両断したがる
- → violation

### pull（引力）

前景化した信念に沿う形で何かが見え、そこへ引かれる。

**条件**: 入力に「かすかな希望 / 小さな糸 / 曖昧なもの」が見え、  
belief の axis が「注意 / 感受性 / 照らす / 在る」系（`attention`, `sensitivity`, `illumination`, `presence`, `prelingual`）のとき。

**例**:
- active leaf: `stay_with_faint_thread`（かすかな糸でも先に切らない）
- 入力: かすかな希望や小さな糸が見えている
- → pull

### protection（守りたさ）

前景化した信念から見て、何かを守りたくなる。

**条件**: 入力に「壊れかけたもの / 崩れかけ / 繊細な何か」が見え、  
belief の axis が「守る / 保護 / 保存 / 強さ」系（`shelter`, `protection`, `preservation`, `containment`, `strength`）のとき。

**例**:
- active branch: `place_for_fragile`（崩れたままでも置ける場所が必要だ）
- 入力: 壊れかけたものが雑に扱われそう
- → protection

---

## internalState での保持

`beliefTension` は `internalState` に以下の形で保持される。

```js
beliefTension: {
  activeTensions: [],
  dominantTensionAxis: null,
  totalTensionStrength: 0,
}
```

`latentState.beliefTension` として後段から参照可能。

---

## compare/debug での可視性

以下の dev-only フィールドで tension の状態を確認できる。

| フィールド | 説明 |
|---|---|
| `beliefTensionPreview` | tension 一覧（beliefId, tensionType, strength, axis） |
| `dominantTensionAxis` | 最強 tension の axis |
| `totalTensionStrength` | 全 tension の強度の合計 |

**表示例（compare/debug）**:
```
belief active: core=3 / branch=5 / leaf=10
tension: stay_with_faint_thread -> friction (0.46)
tension: place_for_fragile -> violation (0.52)
dominantTensionAxis: shelter
totalTension: 0.98
```

---

## 今回やらないこと

- 後段の全面的な再設計
- tension に応じた表層生成の大改造
- tension の自動更新・学習
- tension を用いた意思決定層の本格実装

---

## 次に「意思決定層」へどう繋がるか

belief tension は、後段の意思決定層が「何に反応しやすいか」「何を守りたいか」を判断するための入力として使える。  
現段階では `latentState.beliefTension` に保持するだけで、後段が軽く参照できる位置にある。  
次のフェーズで意思決定層が実装されたとき、`dominantTensionAxis` や `totalTensionStrength` を判断の重みとして使うことができる。
