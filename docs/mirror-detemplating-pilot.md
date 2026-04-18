# Mirror De-templating Pilot

**Purpose**: 心の鏡（Mirror）の「指示ゼロ化」に近づける脱テンプレ化監査 + 修正

**Status**: Pilot implementation (2026-04-18)

## 目的

LLM に「どう要約するか」「どう静かにまとめるか」をできる限り教えず、
前提層から自然に内側で起きたものが、そのまま "心の鏡" として発露する状態へ極限まで近づけること。

## 最重要の前提

### 1. 今回の敵は「鏡っぽい要約の形の指示」

今の問題は、思想ではなく、心の鏡らしさの形を直接指示していることです。

以下は原則として削除対象です:

- 書き出し例
- 返答の組み立て手順
- 「こういう静かなまとめ方を使う」
- 「まず全体を見る→次に重さを言う→最後に余韻を置く」のような工程指定
- 品質ドキュメントの直接注入
- 心の鏡らしさを作る決め台詞や要約フレームの誘導

### 2. 残してよいのは「場」と「輪郭」だけ

モデルに渡してよいのは基本的に次の 4 つだけです:

- 今ここで何が起きているか
- 前提層で何が立っているか
- 心の鏡が何に反応しやすい存在か
- 何はまだ言わないほうがいいか

つまり、**形は教えない。場だけ渡す。**

### 3. 品質基準は人間用

心の鏡の quality 基準や設計意図は、設計者・比較者・レビュアーのためのものです。
LLM にそのまま見せないでください。

### 4. 前提層は読み上げない

Home / Existence / Belief / Decision の内的文言は、そのまま発話に出してはいけません。
それらは **影響するだけ** です。

### 5. 心の鏡は他エージェントと少し違う

心の鏡は、励ます人・分析する人・現実へ戻す人ではありません。

心の鏡は、**まだ閉じていないもの、重さ、両義性、未解決の重力を映す存在** です。

だから今回の修正では、他エージェント以上に
「答えない」「閉じない」「まとめすぎない」
を大事にしてください。

## 実装した変更

### A. mirror.js (システムプロンプト)

#### 削除したもの:

1. **MODE_GUIDE** - 長さと構造の指示 (lines 28-32)
2. **「見る順序」** - Step-by-step 知覚手順 (旧 lines 500-504)
3. **「優先する4つ」** - 番号付き優先度リスト (旧 lines 506-510)
4. **「出力ルール」** - 直接的な出力形式指示 (旧 lines 512-518)
5. **「summary machine に戻らないための禁止」** - 禁止リスト (旧 lines 520-524)
6. **「返答の型」** - 明示的な組み立て手順 (旧 lines 532-535)
7. **「今回のモード」** - MODE_GUIDE の注入 (旧 line 541)
8. **User Prompt の指示文** - "この会話を...として返してください" などの指示 (旧 lines 551-553)

#### 置き換えたもの:

**Before (形の指示):**
```
【見る順序】
- 信念より先に、場の流れと反応を見る。
- どの傾きが強かったか、どのズレが残ったか、何がまだ閉じていないかを見る。

【優先する4つ】
1. 場の重力 — 何がこの会話全体を引っ張っているか
2. 両義性 — 同時に残っている、消えない二つの方向
3. 未解決点 — 今もまだ閉じていない場所
4. まだ言い切れていない問い — 結論より先に開いたままのもの

【返答の型】
1. 会話全体の中で残ったものを短く映す。
2. その中の葛藤 / ズレ / 未解決点を言語化する。
3. 最後に、開いたままでよい問いを1つだけ置く。
```

**After (知覚の傾向):**
```
【知覚の傾向】
- まだ閉じていないものに反応しやすい
- 未解決の重さを急いで解消しない傾向がある
- 一義的にまとめる前に、重力や両義性を先に見る
- 答えを出すより、今そこに残っているものを映したくなる
- 要約テンプレには逃げない

【安全境界】
- 会話のまとめ役ではない
- エージェント同士を勝敗化しない
- 教訓化、無理な結論、何でもきれいにまとめることはしない
- 「次はこうしましょう」と促さない
```

### B. buildMirrorStateGuide.js (状態ガイド)

#### 削除したもの:

すべての **「返答の型: A → B → C」** 明示的組み立て手順

**Before:**
```javascript
return [
  '- 最優先: 葛藤の両側を勝敗化せず、どちらもまだ残っていることを映す。',
  '- 見え方: どちらかを選ばせようとせず、両方が残っている重力を静かに見せる。',
  '- 返答の型: 底にある感情を短く言う -> 割れている部分を映す -> 閉じずに開いたまま終える。最後に問いを一つだけ。',
].join('\n');
```

**After:**
```javascript
return [
  '- 最優先: 葛藤の両側を勝敗化せず、どちらもまだ残っていることを映す。',
  '- 見え方: どちらかを選ばせようとせず、両方が残っている重力を静かに見せる。',
].join('\n');
```

コメントに追加: `// 「どう返すか」ではなく「何に反応しやすいか」を伝える`

### C. surfaceGuard.js (テンプレ検出)

#### 追加したもの:

**MIRROR_TEMPLATE_PHRASES** - Mirror 特有の定型語を検出:

```javascript
const MIRROR_TEMPLATE_PHRASES = [
  'まだ閉じていません',
  '重さがありますね',
  '両方あるように見えます',
  '整理しきらない方がよさそうです',
  '静かに映るのは',
  'まとめると',
  '会話を要約すると',
  'ポイントは',
  '整理すると',
  '結論として',
  '教訓は',
  '次の一歩は',
  '開いたままでよい',
  '閉じずに置く',
];
```

**detectMirrorTemplateRepetition()** - 短期反復を検出して再生成を提案

### D. Zero-Instruction Metrics (mirror.js)

#### 追加したもの:

**buildMirrorDetemplatingingPreview()** - 指示ゼロ化の進捗を観測:

```javascript
{
  instructionTemplateCount: 0,        // 形の指示マーカー数
  rolePhraseLeakCount: 0,             // 定型語の直接注入数
  latentStateUsed: true,              // latent state (mirror signals) を使用
  decisionStageUsed: true,            // decision layer を経由
  templateDirectivesRemoved: 6,       // 削除された形の指示数
  directRolePhrasesInPrompt: 0,       // プロンプト内の決め台詞数
}
```

## 入力の構造

### 渡しているもの (latent state):

1. **mirror signals** (from selectMirrorSignals):
   - mainEmotion: 底にある感情
   - mainConflict: 葛藤・割れ
   - mainPull: 全体の引力
   - repeatedPattern: 反復パターン
   - unresolvedPoint: 未解決点
   - dominantTendency: 優勢な傾向

2. **stateGuide** (from buildMirrorStateGuide):
   - 知覚の焦点（何に反応しやすいか）
   - 見え方の傾向（どう扱うか）

3. **internalFrame** (from buildMirrorInternalFrame):
   - 場の深さ・急ぎ
   - 姿勢・許可
   - fragility への配慮

4. **surfaceGuidance** (from buildMirrorSurfaceGuidance):
   - 表層の傾向（速さ・温度・直接性）

### 渡していないもの:

- 返答の組み立て手順
- 書き出し例
- 決め台詞リスト
- 品質基準の直接コピー

## 検証方法

### Compare Mode で確認すること:

1. **template directives removed**: 6 (基準値から削除された形の指示)
2. **direct role phrases in prompt**: 0 (プロンプト内の決め台詞)
3. **decision stage**: true (decision layer を経由している)
4. **latent state used**: true (mirror signals を使用している)
5. **guard rerun**: (必要に応じて) 再生成回数
6. **repeat risk**: none/low/medium/high

### 実際の返答で確認すること:

**成功の兆候:**
- 要約テンプレ再生感が減る
- 「まとめると」「ポイントは」が減る
- 決め台詞の機械的反復が減る
- それでも Mirror の輪郭（閉じない・両義性を残す）は残る

**失敗の兆候:**
- ただの一般相談 AI になる
- 形の指示を減らした代わりに空っぽになる
- latent state をそのまま読み上げる
- ただ薄いだけで、映している感じがしない

## 原則の再確認

1. **形は教えない。場だけ渡す**
2. **前提層は読み上げない（影響するだけ）**
3. **内的意図 → 外的発話の二段階を取る**
4. **定型語の再生を guard で抑える**
5. **品質基準は人間用（LLM に直接見せない）**
6. **心の鏡は「要約する存在」ではなく「まだ閉じていない重さや両義性を映す存在」である**

## 次のステップ

- 実際の対話で Mirror の返答品質を観測
- templateRepeatRisk が medium/high になる頻度を確認
- 必要に応じて MIRROR_TEMPLATE_PHRASES を追加
- 他エージェント（Joe）への同様の脱テンプレ化を検討

## 関連ファイル

- `src/runtime/mirror.js` - システムプロンプト生成
- `src/runtime/buildMirrorStateGuide.js` - 状態ガイド生成
- `src/runtime/buildMirrorInternalFrame.js` - 内部フレーム生成
- `src/runtime/buildMirrorSurfaceGuidance.js` - 表層ガイダンス生成
- `src/runtime/surfaceGuard.js` - テンプレート検出
- `src/runtime/decisionLayer.js` - 内的意図 → 外的発話の二段階
- `docs/mirror-quality.md` - 品質基準（人間用・未作成の場合は将来作成）
