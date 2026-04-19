# 顕在層 v0.1 Phase 8: Surface Minimal Connection

**目的**: consciousIntent と lengthPlan を既存の表層生成へ最小接続する

## 今回の目的

Phase 7 で作った以下の要素を、既存の表層生成へ「薄く、でも実際に効く形で」渡すこと:

- selectedThoughts
- consciousIntent (speakIntent / holdBack)
- lengthPlan (target / lineCountHint / expansionBudget / compressionPressure)
- preconditionBias
- others_field

## 重要な前提

### 1. surface はまだ全面置換しない

今回は既存 surface を捨てません。既存 surface に consciousIntent / lengthPlan を追加で効かせる方向です。

### 2. 形の指示に戻さない

consciousIntent を表層へ渡す時も、「まずこれを言って」「次にこれを言って」のような工程指示へ戻さないでください。

渡すのは:
- 今何を前に出したいか
- 何をまだ出したくないか
- どれくらい話したいか

### 3. 前提層は読み上げない

前提層の文言も、thought の textSeed も、speakIntent も、そのまま発話に出さないでください。
影響するだけでよいです。

### 4. 長さは「従わせる」ではなく「近づける」

長さのブレを減らしたいですが、完全な機械制御では不自然になります。
今回は「今までより自然に揃う」程度で十分です。

## 今回のゴール

1. 既存 surface へ consciousIntent を渡す
2. 既存 surface へ lengthPlan を渡す
3. speakIntent / holdBack / lineCountHint が表層に少し効くようにする
4. 長さブレを今までより減らす
5. 説明過多・まとめ過多・広がりすぎを少し抑える
6. compare/debug で surface に効いたことが見えるようにする
7. lint / build / test を通す

## 接続対象

主な対象:
- surfaceTranslator
- buildAgentSurfaceGuidance
- surface guidance
- buildPrompt
- decisionLayer の bridge 部分
- surfaceGuard

## surface に渡したいもの

### 1. consciousIntent.speakIntent

これは表層に対して「今どの方向へ触れたいか」を与える

例:
- touch-the-living-point → 「まだ鈍っていない一点へ触れる」
- clarify-the-knot → 「結び目を短く言う」
- make-room-without-closing → 「余白をつくる」
- return-to-footing → 「足場に戻る」
- reflect-the-unsettled-weight → 「閉じていない重さを映す」

### 2. consciousIntent.holdBack

これは表層に対して「今はまだしないこと」を与える

例:
- no-early-summary → 要約調を抑える
- no-fix-yet → 解決を急がない
- no-over-expansion → 触れる点数を増やしすぎない
- do-not-close → 断定で閉じすぎない
- no-explicit-agent-reference → 他エージェント名の直接言及を抑える

### 3. lengthPlan

これは表層に対して:
- どれくらいの長さまで広がってよいか
- どれくらい圧縮したいか

を与える

## 最小の表層ガイダンス

表層側で、少なくとも以下を読めるようにしてください:

- **speakIntent**: 何を前に出したいか
- **holdBack**: 何をまだ前に出したくないか
- **lineCountHint**: 何行くらいまでが自然か
- **expansionBudget**: どれくらい広げてよいか
- **compressionPressure**: どれくらい圧縮したいか

**重要**: これをそのまま LLM に読み上げさせない。生成の重心を寄せるための補助情報として使ってください。

## speakIntent の効かせ方

### 目的

返答が「何でも少しずつ触る」状態から離れるようにする

### 方針

表層生成時に、speakIntent があるなら:
- その方向に関連する語彙 / 焦点 / 比喩へ少し寄せる

ただし:
- speakIntent をそのまま文にしない
- 決め台詞化しない
- 説明ラベルを直接出さない

### 例

speakIntent = clarify-the-knot なら:
- 結び目
- 二重になっているもの
- 混ざっている問い

へ少し寄りやすくする

## holdBack の効かせ方

### 目的

説明過多・まとめ過多・解決急ぎを減らす

### 方針

holdBack の各ラベルを surface translator / prompt builder / output shaping に軽く反映してください。

### 例

- no-early-summary → 要約調を抑える
- no-fix-yet → 解決提案を急がない
- no-over-expansion → 触れる点数を増やしすぎない
- do-not-close → 断定で閉じすぎない
- no-explicit-agent-reference → 他エージェント名の直接言及を抑える

**重要**: 禁止文を増やしすぎない。出力を狭める圧として軽く使う。

## lengthPlan の効かせ方

### 目的

short / medium / long のブレを減らす

### 方針

**short**:
- 1〜3行相当
- 1つの cluster だけ
- expansion をかなり抑える

**medium**:
- 3〜6行相当
- 1つ主 + 条件次第で補助1つ
- 余白は残すが、短すぎない

**long**:
- 5〜9行相当
- 必要なら補助 cluster も使う
- ただし無駄な反復や蛇行は避ける

### 実装上のヒント

既存 surface で token / sentence / line に近い制御があるなら:
- lineCountHint
- expansionBudget
- compressionPressure

をそこへ渡してください。

**重要**: 完全一致を狙いすぎない。今より体感が揃えば成功です。

## 既存 decisionLayer / surfaceTranslator との境界

### 既存 decisionLayer

今回は消さない。consciousIntent / lengthPlan の bridge として残す。

### surfaceTranslator

ここが今回の主接続先。selected cluster や speakIntent をそのまま読まず、
その方向の表層自然化を行う場所として使う。

### surfaceGuard

最後に:
- latent / thought / intent ラベルの直読
- 不自然なテンプレ化
- 長さ逸脱

を軽くチェックする

## 追加した compare/debug 項目

最低限:
- surfaceUsedConsciousIntent
- surfaceUsedLengthPlan
- surfaceSpeakIntent
- surfaceHoldBack
- surfaceLengthTarget
- surfaceLineHint
- surfaceExpansionBudget
- surfaceCompressionPressure

### 表示例

```
surface intent: clarify-the-knot
surface holdBack: no-early-summary, no-fix-yet
surface length: medium / lines=4
surface budget: expand=0.42 / compress=0.58
```

ここで見たいのは:
- 本当に surface まで届いているか
- どの意図で生成したか
- 長さ指定がどう作用したか

## 今回やらないこと

- 発話生成の全面再構築
- multi-pass generation
- feeling / move を使った full surface
- agent 間直接引用の本格導入
- 心の鏡の総括完成版

今回は **surface への最小接続だけ** に集中してください。

## 実装

### 新規ファイル

- `src/runtime/surfaceBridge.js`: consciousIntent / lengthPlan を surface 用に変換
- `src/runtime/surfaceBridge.test.js`: surfaceBridge のテスト

### 更新ファイル

- `src/runtime/surfaceTranslator.js`: surfaceFrame に consciousIntent と lengthPlan を追加
- `src/runtime/buildAgentSurfaceGuidance.js`: consciousIntent / lengthPlan を使った guidance 生成
- `src/runtime/surfaceDebug.js`: Phase 8 の surface connection metrics を追加

## 一番大事なこと

今回の目的は:

**内側で決まった「何を言いたいか」と「どれくらい言いたいか」を、
既存の表層生成へ自然に届かせること**

です。

- まだ全面置換しない
- でも実際に効かせる
- speakIntent は方向として使う
- holdBack は狭める圧として使う
- 長さブレを減らす

この原則を崩さずに実装してください。
