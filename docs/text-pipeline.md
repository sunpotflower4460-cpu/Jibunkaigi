# Text Pipeline Module

**Phase P-6: 身体感覚分離・テキストパイプライン独立化**

text pipeline は、`runInternalOS` が生成した `latentState` から、設計用語を含まない日本語描写を返す独立モジュールです。  
ただし、**P 系 prompt 全体を組み立てる正本ではありません**。正本入口は `src/runtime/buildAgentPrompt.js` です。

---

## この文書で固定すること

- text pipeline の責務は **`latentState` → 日本語描写 / bodySignals snapshot** に限定する
- 7ブロックの section 組み立て、アンカー、`activated` / `context` / `mode` の配置は agent 固有 prompt builder が担う
- 実装済み / 未実装 / 将来分離予定をここで固定し、P 系文書とコードのずれを防ぐ
- アンカーテキストは text pipeline の責務ではなく、builder 側の移行期仕様として扱う

---

## 実装導線

```text
runInternalOS.js
  └─ buildBodySignals({ field, beliefTension, previousLatentState })
       └─ latentState.bodySignals を構築

buildAgentPrompt.js
  └─ buildAgentSystemPrompt(agentId, params)
       └─ prompts/{joe|ray|ken|mina|satou}.js
            ├─ buildExistenceText(latentState)
            ├─ buildFieldText(latentState)
            ├─ buildMarginText(latentState)
            ├─ renderActivatedParticles(activated)
            ├─ normalizeContext(context)
            └─ MODE_GUIDE[mode]
```

text pipeline は上のうち、`buildBodySignals` / `buildExistenceText` / `buildFieldText` / `buildMarginText` だけを持つ。  
それ以外の section 化は prompt builder 側の責務。

---

## 現状ステータス

### 実装済み

| 項目 | 実装箇所 | 現在の役割 |
|------|----------|------------|
| bodySignals の external / internal 分離 | `src/runtime/textPipeline/buildBodySignals.js` | `field`・`beliefTension`・`previousLatentState` から snapshot を計算し、`runInternalOS.js` が `latentState.bodySignals` に載せる |
| 存在描写の生成 | `src/runtime/textPipeline/buildExistenceText.js` | `identityFeelingText`、`recalledSelfTraits`、`dominantBeliefAxis` から `【存在の前提】` 本文候補を返す |
| 場の空気の生成 | `src/runtime/textPipeline/buildFieldText.js` | `field`、`stance`、`beliefCore`、`bodySignals` から `【今の場の空気】` 本文候補を返す |
| 余白描写の生成 | `src/runtime/textPipeline/buildMarginText.js` | `consciousIntent.holdBack` と `permission >= 0.5` を `【場の余白】` 本文候補に変換する |
| 入出力契約 | `src/runtime/textPipeline/types.d.ts` | `LatentState` / `BodySignals` / `Permission` などの契約を文書化する |
| 単体テスト | `src/runtime/textPipeline/tests/*.test.js` | 各関数を `latentState` モックで独立検証する |

### 未実装（現時点で text pipeline が担っていないもの）

| 項目 | 現在の所有者 | 補足 |
|------|--------------|------|
| 7ブロックの section 組み立て | `src/runtime/prompts/{agent}.js` | text pipeline は本文だけ返し、見出しや順序は持たない |
| アンカーテキストの挿入 / 削除 | `src/runtime/prompts/{agent}.js` | `（ジョーとして。）` などは builder が常に入れる |
| 活性化粒子の整形 | `src/runtime/buildPromptHelpers.js` | `renderActivatedParticles(activated)` が処理 |
| reentry / context / mode | agent builder + helper | `activated.reentry`, `normalizeContext`, `MODE_GUIDE` を builder が section 化 |
| user prompt の整形 | `src/runtime/buildAgentPrompt.js` / 各 `build*UserPrompt` | text pipeline は関与しない |
| `othersField` の `【場の残響】` | 各 agent builder | canonical 7ブロックの外側にある任意 block |

### 将来分離予定 / 今後の整理対象

| 項目 | 現状 | 将来の整理方針 |
|------|------|----------------|
| 共通 section assembler | 各 agent builder に同型ロジックがある | 将来 shared assembler に寄せるなら、text pipeline ではなく prompt builder 層の shared utility として分離する |
| tension 描写の存在ブロック反映 | `buildExistenceText` は `beliefTension` を読むが本文には出していない | 反映する場合は text pipeline 関数の責務として追加し、builder 側で補完しない |
| agent 固有の axis 拡張 | 現状は共通 `AXIS_DESCRIPTIONS` のみ | 共通表と agent 拡張表の責務境界を別文書または別モジュールで固定する |
| アンカー削除 | 未対応 | P-3 検証が削除条件を満たした時だけ builder 側で扱いを変える |

---

## text pipeline と agent 固有 prompt builder の責務境界

| 仕事 | text pipeline | agent 固有 prompt builder |
|------|---------------|----------------------------|
| `latentState` を日本語にする | する | しない |
| section の見出しを付ける | しない | する |
| section の順序を決める | しない | する |
| アンカーを付ける | しない | する |
| `activated` を prompt に入れる | しない | する |
| `context` を切り詰めて載せる | しない | する（`normalizeContext` を利用） |
| `mode` guide を載せる | しない | する |
| `userText` を整形する | しない | する |

つまり、text pipeline は**描写の生成器**であり、agent builder は**prompt の編成器**です。

---

## アンカーテキストの現状扱い

### 現在は残すのか

残す。現行コードでは 5 agent 全てが system prompt にアンカー 1 行を必ず含める。

### 条件付きで残すのか

現時点では**条件付きではない**。`buildExistenceText(...)` が空でもアンカー単体は残る。

### 将来削除の評価基準は何か

削除判断は text pipeline ではなく prompt builder の仕様変更として扱い、少なくとも以下を満たすまで行わない。

1. [P-3 scenarios](./p3-scenarios.md) の基準どおり、アンカー無しでも個性保持が 80% 以上（20 / 25 以上）
2. [P-3 particle impact report](./p3-particle-impact-report.md) で劣化ケースを説明できる
3. `src/runtime/promptStructure.test.js` のアンカー依存部分を見直しても、設計と実装の対応が第三者に追える

---

## 実装メモ（現状コードに合わせた注意点）

- `buildBodySignals` の internal 側は **current stance/reaction ではなく `previousLatentState`** を使う
- `runInternalOS.js` には後方互換のための flat `emergingField.bodySignals` も残っている
- `buildFieldText` の block 2 生成は `bodySignals.external/internal` のズレ検出を含む
- `renderActivatedParticles` が返す block 3 の見出しは、現行コードでは `【今、場に浮かんでいるもの】`
- text pipeline は debug preview を生成しない

---

## 関連 docs

- [Prompt Structure v2](./prompt-structure-v2.md) — 7ブロックと実装対応表
- [Jibunkaigi Compass](./jibunkaigi-compass.md) — P/D 系 docs の入口
- [Jibunkaigi Roadmap](./jibunkaigi-roadmap.md) — フェーズ順と参照順
- [P-3 scenarios](./p3-scenarios.md) — アンカー削除評価基準
- [P-3 particle impact report](./p3-particle-impact-report.md) — アンカー影響の確認テンプレート

---

**現状結論**: text pipeline は「P 系 prompt の正本」ではなく、「`latentState` を日本語描写へ変換する独立モジュール」である。  
**builder 境界**: アンカー・粒子・reentry・context・mode は agent 固有 builder 側。  
**次に見る文書**: 7ブロックとの対応は [prompt-structure-v2.md](./prompt-structure-v2.md)
