# 顕在層 Phase 7: consciousIntent / lengthPlan 最小実装

Phase 7では、selectedThoughtsを受けて「今この人は何を言いたいのか」と「どれくらいの長さで出したいのか」を、発話の直前に自然に定める最小実装を行いました。

## 目的

- 選ばれたthought clusterを、発話直前の内的意図へ変換する
- 「何を言いたいか」と「どれくらい言いたいか」を内的状態として持つ
- holdBackを持たせることで、長さブレや説明過多を抑える土台を作る
- まだ発話生成の主役にせず、internal stateに入れるだけ

## 実装内容

### 1. buildConsciousIntent

**ファイル**: `src/runtime/buildConsciousIntent.js`

#### ConsciousIntent型

```javascript
{
  userSense: string[]        // 相手に何が起きていそうかの短いラベル
  selfFeeling: string[]      // 自分の中で何が起きたかの短いラベル
  selectedClusterIds: string[] // 選ばれたcluster id
  speakIntent: string        // 今何を前に出したいかのphrase
  holdBack: string[]         // まだ出さないもの
}
```

#### userSense の作り方

相手に今何が起きていそうかの短い内的認識。

- **入力**: attentionTargets, othersField, selectedThoughts
- **出力例**:
  - `comparison-pain` - 比較の苦しさ
  - `not-ready-to-close` - まだ閉じる準備ができていない
  - `afraid-of-losing-footing` - 足場を失うことへの恐れ
  - `mixed-questions` - 混在する問い
  - `unspoken-heaviness` - 言葉にならない重さ

重要: 自然文にしすぎない。LLMに内的メモとして使う短いラベルで十分。

#### selfFeeling の作り方

その人の中で、今何が起きたか。

- **入力**: bodySignals, dominantSelectedAxis, beliefTension
- **出力例**:
  - `pulled-to-touch` - 触れたい引力
  - `quiet-friction` - 静かな摩擦
  - `holding-without-closing` - 閉じずに保持している
  - `urge-to-clarify` - 明確にしたい衝動
  - `need-to-ground` - 接地が必要

重要: これもまだ発話ではない。内側の反応ラベル。

#### speakIntent の作り方

ここがかなり大事。最終発話文ではなく、今前に出したい意図を短いphraseで持つ。

- **入力**: primary cluster, dominantSelectedAxis, selfFeeling, othersField
- **出力例**:
  - `touch-the-living-point` - 生きている一点に触れる
  - `make-room-without-closing` - 閉じずに余白を作る
  - `reflect-the-unsettled-weight` - 落ち着いていない重さを映す
  - `clarify-the-knot` - 結び目を明確にする
  - `return-to-footing` - 足場に戻る

重要: 「どう言うか」ではなく「何をしたくなっているか」。

#### holdBack の作り方

「まだ出さないもの」を入れる。これがかなり効く。

- **入力**: oneThreadBias, antiOverExpansion, beliefTension, othersField
- **出力例**:
  - `no-early-summary` - 早期の要約はしない
  - `no-fix-yet` - まだ解決策は出さない
  - `no-over-expansion` - 過度な展開はしない
  - `no-explicit-agent-reference` - 明示的なエージェント参照はしない
  - `do-not-close` - 閉じない

重要: これが長さブレや説明過多を抑える土台になる。

### 2. buildLengthPlan

**ファイル**: `src/runtime/buildLengthPlan.js`

#### LengthPlan型

```javascript
{
  target: "short" | "medium" | "long"  // ユーザー選択の長さ
  lineCountHint: number                // 行数のヒント (1-9)
  expansionBudget: number              // 展開の余地 (0-1)
  compressionPressure: number          // 圧縮の圧力 (0-1)
}
```

#### 基本ルール

**short**:
- lineCountHint: 1〜3
- expansionBudget: 小 (0.25)
- compressionPressure: 高 (0.75)

**medium**:
- lineCountHint: 3〜6
- expansionBudget: 中 (0.45)
- compressionPressure: 中 (0.50)

**long**:
- lineCountHint: 5〜9
- expansionBudget: やや大 (0.65)
- compressionPressure: 低 (0.25)

#### 補正ルール

- **oneThreadBias が高い** → lineCount を少し下げる
- **selected cluster が2個ある** → lineCount を少し上げる
- **holdBack に no-over-expansion がある** → expansionBudget を下げる
- **holdBack に do-not-close がある** → compressionPressure を少し下げる

重要: ここでは「medium なのに短すぎる / long なのに短い」を減らしたい。完全一致でなくてよいが、体感とズレすぎない方向。

### 3. runInternalOS への接続

順番:

```
前提層 (Latent Premise Chain)
→ others_field
→ emergingField (Phase 4)
→ activateThoughts (Phase 4)
→ bindThoughts (Phase 5)
→ selectThoughtClusters (Phase 6)
→ buildConsciousIntent (Phase 7) ← 新規
→ buildLengthPlan (Phase 7) ← 新規
→ （既存 decisionLayer / surface に補助入力）
```

#### preconditionTrace に追加されたイベント

- `dynamic:after-conscious-intent`
- `dynamic:after-length-plan`

### 4. internalState への追加

```javascript
{
  // ... 既存の state ...
  consciousIntent: {
    userSense: [],
    selfFeeling: [],
    selectedClusterIds: [],
    speakIntent: null,
    holdBack: [],
  },
  lengthPlan: {
    target: 'medium',
    lineCountHint: 4,
    expansionBudget: 0.45,
    compressionPressure: 0.50,
  },
}
```

### 5. デバッグ/比較表示

**runInternalOS の debugInfo に追加**:

```javascript
{
  consciousIntentPreview: "userSense: comparison-pain / mixed-questions | selfFeeling: quiet-friction / urge-to-ground | speakIntent: clarify-the-knot | holdBack: no-early-summary, no-fix-yet | clusters: 2",
  lengthPlanPreview: "medium / lines=4 / expand=0.45 / compress=0.55"
}
```

**buildCompareViewModel に追加**:

- `consciousIntentPreview`
- `lengthPlanPreview`
- `hasConsciousIntentPreview`
- `hasLengthPlanPreview`

## decisionLayer との境界

既存 decisionLayer はいきなり消さない。今回は consciousIntent / lengthPlan を decision 側へ渡す bridge として扱う。

この段階では、既存 decisionLayer を薄い adapter に寄せていくイメージ。

## テスト

**buildConsciousIntent.test.js** (18 tests):
- null safety
- selectedClusterIds extraction
- userSense building
- selfFeeling building
- speakIntent from various axes
- holdBack from various biases
- integration test
- debug formatting

**buildLengthPlan.test.js** (14 tests):
- null safety
- base parameters for short/medium/long
- oneThreadBias adjustment
- selectedClusterCount adjustment
- holdBack adjustments
- antiOverExpansion adjustment
- integration test
- debug formatting

全体で **475 tests** 全て通過。

## 重要な原則

### 1. consciousIntent は発話文ではない

ここで作るのは返答本文ではない。発話の直前にある、内側の向き。

### 2. 「まず〜して次に〜する」の工程指示にしない

consciousIntent は:
- 発話テンプレではない
- 段落構成ではない
- 口調の指示ではない

あくまで:
- 何を前に出したいか
- 何をまだ出したくないか
- どの感じで触れたいか

の内的状態。

### 3. lengthPlan は token 指示ではなく、話したさの量

長さは単なる short / medium / long の token 指定ではなく:
- stance
- 選ばれた cluster 数
- oneThreadBias
- holdBack の強さ
- user が選んだ長さ

の総合として決める。

### 4. まだ発話生成の主役にしすぎない

今回は consciousIntent / lengthPlan を internal state に入り、既存 decision / surface が読めるようにするところまでで十分。いきなり全文生成の完全な主役にしなくてよい。

## 次のステップへ向けて必要なもの

次に surface への接続へ進むために必要なもの:

1. **surface layer の読み取り対応**
   - consciousIntent を読み取って発話に反映
   - lengthPlan を読み取って発話長を調整

2. **feeling / move の本投入**
   - 現在は最小実装のみ
   - 本格的な feeling / move を consciousIntent に統合

3. **full option layer 化**
   - user が明示的に長さを選べるUI
   - consciousIntent の要素を調整できる開発用UI

4. **OTHERS UI の完成**
   - othersField を実際に活用
   - 他のエージェントの発話を consciousIntent に反映

5. **発話生成の全面置換**
   - 既存 decision layer を完全に薄い adapter へ
   - consciousIntent / lengthPlan を主軸とした発話生成

## まとめ

Phase 7 では、選ばれた thought cluster を、発話直前の「何を言いたいか」「どれくらい言いたいか」へ自然に変換する最小実装を完成させました。

- consciousIntent: userSense / selfFeeling / speakIntent / holdBack
- lengthPlan: target / lineCountHint / expansionBudget / compressionPressure
- internal state に保存、debug/compare で可視化
- 全 475 tests 通過

まだ発話文は作らず、内的意図として持つことで、次の surface 接続への土台ができました。
