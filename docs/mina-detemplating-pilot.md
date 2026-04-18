# Mina De-templating Pilot: Zero-Instruction Architecture

## 概要

このドキュメントは、Minaの「指示ゼロ化」パイロット実装について説明する。

**目的**: LLMに「どう寄り添うか」をできる限り教えず、前提層から自然に内側で起きたものが、そのままMinaとして発露する状態へ極限まで近づける。

## 中核原則

### 1. 形は教えない。場だけ渡す

❌ **Before (形の指示):**
```
- まず相手の感情を受け取る
- 「そっか」「うん」のような短い受容から入る
- 次に、今の具体的な感触に短く触れる
```

✅ **After (場の提示):**
```
【ミナの知覚傾向】
- ほどける余地へ目が行きやすい
- 崩れたまま置ける場所を作りやすい
- 晒されている疲れや感情の質感に反応しやすい
```

### 2. 前提層は読み上げない（影響するだけ）

Home / Existence / Belief / Decision の内的文言は、そのまま発話に出してはいけない。
それらは **影響するだけ** である。

### 3. 内的意図 → 外的発話の二段階を取る

Decision layerを経由することで:
- `userSense`: 相手に何が起きていそうか
- `selfFeeling`: 自分はそこに何を感じたか
- `selfLean`: どっちへ触れたくなるか

→ その後で初めてユーザー向け返答を生成する

### 4. 定型語の再生をguardで抑える

Surface guardで短期反復を検出:
- `「そっか」「なんだね」` などの定型語
- 同じフレーズが3回以上続く場合のみ再生成
- 一度出ただけでは禁止しない（Minaらしさを残す）

### 5. 品質基準は人間用

`mina-quality.md` や voice quality contract は、設計者・比較者・レビュアーのためのもの。
**LLMにそのまま見せない**。

## 実装の変更点

### A. Prompt構造の変更

#### Before: 発話テンプレートの直接指示

```javascript
// 【返答の組み立て方】
// 1. まず受け取る（短い受容）
// 2. 今の具体的な感触に触れる
// 3. 急いで閉じない。開いたままでいい
```

#### After: 知覚傾向としての間接影響

```javascript
// 【ミナの知覚傾向】
// - ほどける余地へ目が行きやすい
// - 無理に進ませない
// - 崩れたまま置ける場所を作りやすい
```

### B. Surface Guidance の弱化

#### Before: 行動指示

```javascript
hints.push('急がず、ゆっくり受け止める');
hints.push('やわらかく、そのまま受ける');
```

#### After: 知覚バイアス

```javascript
hints.push('余白への傾きが強い');
hints.push('やわらかい質感への反応');
```

### C. Surface Guard の強化

新機能: `detectMinaTemplateRepetition()`

```javascript
// Mina専用の定型語反復検出
MINA_TEMPLATE_PHRASES = [
  'そっか',
  'なんだね',
  'ここに置いておいていい',
  'でいいんだよ',
  // ...
]

// 短期ウィンドウ（直近3応答）で3回以上 → 再生成
```

### D. Compare/Debug の観察項目

新機能: `buildZeroInstructionMetrics()`

```javascript
{
  templateDirectivesRemoved: 7,      // 削除した指示数
  rolePhrasesInPrompt: 0,            // prompt内の役割語彙数
  decisionStageUsed: true,           // decision layer使用
  templatePhraseCount: 1,            // 現応答の定型語数
  templateRepeatRisk: 'medium',      // 反復リスク
  seemsTemplateDriven: false,        // テンプレ再生感
}
```

## 削除したもの（Removed）

1. **発話テンプレの骨組み**
   - `1. まず受け取る 2. 感触に触れる 3. 閉じない`
   - `先に〜 → 次に〜 → 最後に〜` のような工程指定

2. **キャラ語彙の直接注入**
   - `「そっか」「うん」「ここにいていいよ」`
   - `「無理しなくていいよ」` など

3. **行動指示の具体例**
   - `「そっか」のような短い受容から入る`
   - `まず出してくれたものを受け取る`

4. **User promptの指示**
   - Before: `感情をまず受け取ってください。直そうとせず…`
   - After: `この言葉に応答してください。`（シンプル化）

## 維持したもの（Maintained）

1. **Safety guards**
   - 過剰賛美の禁止
   - パフォーマティブ共感の禁止
   - 内部レイヤー読み上げの禁止

2. **知覚傾向としての輪郭**
   - `ほどける余地へ目が行きやすい`
   - `崩れたまま置ける場所を作りやすい`
   - これらは「何に反応しやすいか」であり「どう言うか」ではない

3. **Decision layer経由の二段階処理**
   - 内的意図 → 外的発話の分離
   - 前提層からの直接漏出を防ぐ

## 検証方法

### 1. Template directive count
監査で特定した形の指示が減ったか
- Before: 7+ template directives
- After: 0 direct form instructions

### 2. Response naturalness
定型語の出現頻度が自然な範囲か
- 同じフレーズの3回以内反復: OK
- 3回以上反復: Guard発動

### 3. Character presence
Minaの輪郭は残っているか
- 受容的な質感
- 押し付けない傾向
- 余白を残す感覚

### 4. Decision stage usage
内的意図が経由されているか
- `feltSense`, `intention` の生成
- 前提層からの直接出力を避ける

## 次のステップ（サトウへの展開）

Minaで検証が成功したら、サトウへ同様の脱テンプレ化を適用する際:

1. **サトウ固有の定型語を監査**
   - `「それは違う」「率直に言うと」` など

2. **サトウの知覚傾向を定義**
   - 危険への反応しやすさ
   - 矛盾を指摘する傾向
   - ただし断罪はしない

3. **Surface guardの拡張**
   - サトウ専用の反復検出パターン

4. **Compare metricsの追加**
   - `satouSharpness` (鋭さ)
   - `satouOverharshness` (過剰な厳しさ)

## 参考文献

- `src/runtime/prompts/mina.js` - Mina prompt builder
- `src/runtime/surfaceGuard.js` - Template repetition detection
- `src/runtime/compareInsights.js` - Zero-instruction metrics
- `src/runtime/decisionLayer.js` - Internal intention separation
- `docs/joe-structure.md` - Joe's de-templating architecture (reference)
