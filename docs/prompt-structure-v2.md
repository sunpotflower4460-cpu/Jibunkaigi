# Phase P-1 — プロンプト構造の転換 (Prompt Structure v2)

**実装日**: 2026-04-20  
**目的**: P 系文書と実装の対応関係を固定し、設計変更時に参照先がずれないようにする。  
**正本入口**: `src/runtime/buildAgentPrompt.js`

---

## この文書で固定すること

- P 系 system prompt の**正本入口**は `buildAgentSystemPrompt(agentId, params)` である
- 7ブロックのうち、`latentState` 由来の日本語描写は `src/runtime/textPipeline/*` が担う
- 7ブロックの組み立て、アンカー、`activated` / `context` / `mode` の配置は**agent 固有 prompt builder** が担う
- アンカーテキストは**現状は常に残す**。削除は将来評価タスクとし、この文書では削除条件だけを固定する

---

## 実装導線

1. `src/runtime/buildAgentPrompt.js`
   - `buildAgentSystemPrompt(agentId, params)` が agentId ごとに各 builder へ dispatch する
   - `buildAgentUserPrompt(agentId, params)` は system prompt とは別に `userText` を整形する
2. `src/runtime/prompts/{joe|ray|ken|mina|satou}.js`
   - 7ブロックの順序を固定する
   - `latentState` を text pipeline に渡す
   - `activated` / `context` / `othersField` / `mode` を section 化する
   - アンカーテキストを差し込む
3. `src/runtime/textPipeline/*`
   - `latentState` から設計用語を含まない日本語描写を返す
   - 現状は `【存在の前提】` / `【今の場の空気】` / `【場の余白】` の本文だけを生成する
4. `src/runtime/buildPromptHelpers.js`
   - `renderActivatedParticles(activated)` と `normalizeContext(context)`、`MODE_GUIDE` を提供する

> `src/runtime/buildPrompt.js` は後方互換の export proxy であり、P 系 prompt 構築の正本ではない。

---

## 7ブロックと実装対応表

| ブロック | 現在の見出し / 出力 | 対応関数 | 主入力 | 生成責務 |
|---------|---------------------|----------|--------|----------|
| 1. 存在の前提 | `【存在の前提】` + `（〜として。）` | `buildExistenceText(latentState)` を各 agent builder が呼ぶ | `latentState.existence2`, `latentState.beliefCore`, `latentState.beliefTension` | text pipeline が存在描写本文を返し、agent builder が見出しとアンカーを先頭に付ける |
| 2. 今の場の空気 | `【今の場の空気】` | `buildFieldText(latentState)` | `latentState.field`, `latentState.stance`, `latentState.beliefCore`, `latentState.bodySignals` | text pipeline が場の描写・stance の重力・body mismatch の本文を返す |
| 3. 場に浮かんでいるもの | 現行実装の見出しは `【今、場に浮かんでいるもの】` | `renderActivatedParticles(activated)` | `activated.finalDecisionSubstrate`, `activated.selectedMixedClusters`, `activated.selectedThoughts`, `activated.boundMixedNodes`, `activated.activatedThoughts` | helper が活性化済み seed を section として整形し、agent builder がそのまま差し込む |
| 4. 場の余白 | `【場の余白】` | `buildMarginText(latentState)` | `latentState.consciousIntent`, `latentState.permission` | text pipeline が holdBack と permission 由来の「何をしないか」を返す |
| 5. 内的方向づけ | `【内的方向づけ（この回だけの構え）】` | 各 agent builder 内で `activated.reentry` / `activated.reentry.text` を読む | `activated.reentry` | agent builder 専任。text pipeline は関与しない |
| 6. ここまでの流れ | `【ここまでの流れ】` | `normalizeContext(context)` | `context`（配列または文字列） | helper が recent context を切り詰め・整形し、agent builder が section 化する |
| 7. 今回のモード | `【今回のモード】` | `MODE_GUIDE[mode]` を各 agent builder が使う | `mode` | agent builder が mode guide と末尾の固定文 `何を言うかは、あなたが決めてください。` を付ける |

### 7ブロックに含めないもの

- `buildAgentUserPrompt(...)` が作る `userName` / `userText` の user prompt は、7ブロックとは別経路
- `othersField` から作る `【場の残響】` は**任意の拡張ブロック**であり、canonical な 7ブロックには数えない
- debug preview (`buildAgentDebugPreview`, `src/runtime/debug/joeDebugPreview.js`) は観測用であり、本番 prompt ではない

---

## text pipeline と agent 固有 builder の責務境界

| 項目 | text pipeline が担う | agent 固有 builder が担う |
|------|----------------------|----------------------------|
| `latentState` の日本語化 | `buildExistenceText` / `buildFieldText` / `buildMarginText` | 呼び出し順と section 配置 |
| 身体感覚の分離 | `buildBodySignals`（`runInternalOS.js` から呼ばれる） | その結果を `buildFieldText` に渡すだけ |
| アンカーテキスト | 何もしない | `（ジョーとして。）` などを常に挿入 |
| 活性化粒子 | 何もしない | `renderActivatedParticles(activated)` を採用 |
| reentry / mode / context | 何もしない | `activated.reentry`, `MODE_GUIDE`, `normalizeContext(context)` を section 化 |
| 順序・省略判定 | 個別関数は空文字を返すだけ | どの block を出すか、どの順に連結するかを決める |
| user prompt | 何もしない | `buildAgentUserPrompt(...)` で整形 |

この境界を越えて、text pipeline に block 組み立てやアンカー所有を持たせない。  
逆に agent builder 側で `latentState` の日本語描写ロジックを再実装しない。

---

## アンカーテキストの現状仕様

### 現状

- 全 agent builder は system prompt に**必ず 1 行のアンカーテキストを残す**
- `buildExistenceText(latentState)` が空でない場合は `【存在の前提】` の先頭にアンカーを置く
- `buildExistenceText(latentState)` が空の場合でも、アンカー単体は出力する
- 現在の実装に**条件付きでアンカーを省く分岐はない**

### 仕様としての意味

- アンカーは text pipeline の責務ではなく、agent 固有 builder が持つ**移行期の identity guardrail**である
- `src/runtime/promptStructure.test.js` では、5 agent 全てでアンカーが含まれることと、`latentState` がなくてもアンカーが残ることを検証している

### 将来削除の評価基準

アンカー削除は将来課題として残すが、削除判断は次の条件を満たしたときだけ行う。

1. `docs/p3-scenarios.md` の基準どおり、**アンカー無しでも個性が保たれるケースが 80% 以上（20 / 25 以上）**
2. `docs/p3-particle-impact-report.md` で、アンカー削除の影響が大きかったケースを個別に説明できる
3. `src/runtime/promptStructure.test.js` 相当の検証を、アンカーなし構成でも更新して通せる
4. 第三者レビューで「誰の prompt builder がどこで identity を支えているか」が追跡可能なままである

削除条件を満たすまでは、**アンカーは残す**。

---

## 実装固定点

### text pipeline 側の現在実装

- `src/runtime/textPipeline/buildExistenceText.js`
  - `identityFeelingText`
  - `recalledSelfTraits`（最大2件）
  - `dominantBeliefAxis` に対応する `AXIS_DESCRIPTIONS[axis].feeling`
  - `beliefTension` は読むが、**現状は tension 描写を本文に出していない**
- `src/runtime/textPipeline/buildFieldText.js`
  - `field` 由来の場の描写
  - `STANCE_TEXT` 由来の stance 描写
  - `bodySignals.external/internal` のズレ検出
- `src/runtime/textPipeline/buildMarginText.js`
  - `consciousIntent.holdBack`
  - `permission >= 0.5` の各行
- `src/runtime/textPipeline/buildBodySignals.js`
  - `field` と `beliefTension`、`previousLatentState` から external / internal を作る
  - `src/runtime/runInternalOS.js` で `latentState.bodySignals` に格納される

### prompt builder 側の現在実装

- `src/runtime/prompts/{joe|ray|ken|mina|satou}.js`
  - 全 agent で同じ 7ブロック順序を採用
  - 共通 builder factory (`src/runtime/prompts/sharedPromptSkeleton.js`) を使用して DRY 化
  - block 3 は helper が返す current heading `【今、場に浮かんでいるもの】` をそのまま採用
  - `othersField` があるときだけ `【場の残響】` を追加
- `src/runtime/prompts/sharedPromptSkeleton.js`
  - `createAgentSystemPromptBuilder()` — 全 agent 共通の 7ブロック組み立てロジック
  - `createAgentUserPromptBuilder()` — user prompt の整形ロジック
  - 各 agent の差異は `anchorLabel` パラメータだけ
- `src/runtime/buildPromptHelpers.js`
  - `renderActivatedParticles(...)`
  - `normalizeContext(...)`
  - `MODE_GUIDE` — 場の静けさ・奥行きの度合いを ambient に描写
- `src/runtime/context.js`
  - `buildPromptContext(...)` が upstream で context 配列を整形しうる

---

## 関連 docs と実装ファイル

### 設計 docs

- [Text Pipeline Module](./text-pipeline.md)
- [Jibunkaigi Compass](./jibunkaigi-compass.md)
- [Jibunkaigi Roadmap](./jibunkaigi-roadmap.md)
- [P-3 scenarios](./p3-scenarios.md)
- [P-3 particle impact report](./p3-particle-impact-report.md)

### 実装ファイル

- `src/runtime/buildAgentPrompt.js`
- `src/runtime/buildPromptHelpers.js`
- `src/runtime/context.js`
- `src/runtime/prompts/sharedPromptSkeleton.js`
- `src/runtime/prompts/joe.js`
- `src/runtime/prompts/ray.js`
- `src/runtime/prompts/ken.js`
- `src/runtime/prompts/mina.js`
- `src/runtime/prompts/satou.js`
- `src/runtime/textPipeline/buildExistenceText.js`
- `src/runtime/textPipeline/buildFieldText.js`
- `src/runtime/textPipeline/buildMarginText.js`
- `src/runtime/textPipeline/buildBodySignals.js`
- `src/runtime/promptStructure.test.js`

---

**現状方針**: 7ブロックの canonical 構造は維持しつつ、実装上の責務は `buildAgentPrompt.js` / agent builder / text pipeline / helper に分けて固定する。  
**アンカー方針**: 現状は残す。削除は評価基準充足後。  
**次に見る文書**: 実装済み範囲と未実装範囲は [text-pipeline.md](./text-pipeline.md)
