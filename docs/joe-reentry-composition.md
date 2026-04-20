# Joe reentry composition

## 目的

Joe の reentry を固定カード選択から、その場で 3 パートを合成する構造へ移した。
現在の本番 runtime activation path の正本は `composeJoeReentry(...)` であり、D-4 dynamic composition を使う。
`getJoeReentry(...)` は D-2 の tagged selection を残す legacy / compatibility path で、runtime の主経路には使わない。
合成対象は次の 3 つに限定する。

1. 観察の起点
2. 判断
3. 出力制約

完成文は常にコーパス由来の言い回しを使い、3 行で返す。
完全新文を LLM で作らず、ルールベースで近い断片を選ぶ。

## 3 パートの定義

### 観察の起点

- 主入力: `state`, `microSignals`
- 役割: 何を先に見るかを決める
- 重点:
  - hesitation / freeze が高いときは受け寄りの起点を優先する
  - desire / reach が高いときは「まだ残っている向き」を見る

### 判断

- 主入力: `beliefTension`
- 役割: 何を決めつけないかを決める
- 重点:
  - friction / violation / protection / pull を `holdBack` や `avoidAssertion` に圧縮する
  - tension が強いほど、断定や整理のしすぎを避ける

### 出力制約

- 主入力: `afterglowSeed`, `othersField`
- 役割: どう返すかを決める
- 重点:
  - 前ターンの受け / 接触 / 密度を残す
  - `othersField` にケンの構造化が見える場合は、ジョー側は構造化を重ねすぎない

## コーパス管理方針

- 既存 `REENTRY_VARIANTS` は削除せず `src/agents/joe/reentryCorpus.js` に移した
- 各 variant は
  - 全体テキスト
  - variant tags
  - part ごとの text / tags
  を持つ
- 合成時は part corpus から選ぶ
- 後方互換の `getJoeReentry` は variant 全体の選択ロジックを維持する legacy / compatibility path

## D-2 tagged selection と D-4 dynamic composition の関係

- D-2 は `REENTRY_VARIANTS` 全体から 1 枚を選ぶ tagged selection
- D-4 は observation / judgment / outputConstraint の 3 パートを、その場の入力から合成する dynamic composition
- D-4 でも part corpus と candidate 表示の基礎として `REENTRY_VARIANTS` とその tags は引き続き参照する
- つまり D-2 は「互換性のために残る旧経路」、D-4 は「本番 runtime activation path の正本」
- debug panel の `reentryCandidates` / `reentryComposition` は D-4 の選択結果を追うための表示

## 選択ロジック

- 各 part で入力ベクトルを作る
- corpus 側は part tags を持つ
- 選択スコアは次の 2 系統を混ぜる
  - tag match
  - cosine similarity
- corpus override が空でも、組み込み corpus に戻る
- 合成失敗時も空文字にはせず、必ず corpus から 1 つ拾う

## テンプレート方式の拡張性

- variant を増やしても part tags を足すだけで選択対象を拡張できる
- observation / judgment / outputConstraint の責務が分かれているため、入力源を増やしても局所改修で済む
- debug panel では part ごとの入力、選ばれた言い回し、スコア、最終合成文を追える
- これにより「設定資料の朗読」に戻っていないかを Wide/User review で確認しやすい
