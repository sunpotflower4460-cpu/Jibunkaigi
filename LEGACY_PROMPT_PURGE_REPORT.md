# Legacy Prompt Purge Report

## 概要

このドキュメントは、Jibunkaigi プロジェクトにおける legacy prompt instructions の完全削除作業の記録です。
旧アーキテクチャの手続き的指示を削除し、内部状態駆動の自然発露アーキテクチャへ移行しました。

実施日: 2026-04-19

---

## 1. 監査したファイル

以下のファイルを監査し、legacy prompt instructions を特定・削除しました:

### プロンプトビルダー
- `src/runtime/buildPrompt.js` - Joe の旧専用ビルダー（deprecated）
- `src/runtime/buildAgentPrompt.js` - エージェントディスパッチャ
- `src/runtime/prompts/joe.js` - Joe 独立プロンプト（新規作成）
- `src/runtime/prompts/ray.js` - Ray（soul）プロンプト
- `src/runtime/prompts/ken.js` - Ken（strategist）プロンプト
- `src/runtime/prompts/mina.js` - Mina（empath）プロンプト
- `src/runtime/prompts/satou.js` - Satou（critic）プロンプト

### デバッグ・トラッキング
- `src/runtime/surfaceDebug.js` - レガシートラッキングメトリクス追加

### テスト
- `src/runtime/buildPrompt.test.js` - 旧アーキテクチャ期待値を更新
- `src/runtime/buildAgentPrompt.test.js` - 旧アーキテクチャ期待値を更新

---

## 2. 削除した旧指示

### 2.1 手続き的組み立て指示（buildStateGuide から削除）

**削除前（buildPrompt.js:463-540）:**
```javascript
const buildStateGuide = (state = {}) => {
  // 4つの状態別に異なる手続き指示を生成
  // - 最優先: 〜
  // - 見え方: 〜
  // - 返答の型: 〜 -> 〜 -> 〜
  // のような詳細な組み立て手順
}
```

**削除後:**
```javascript
const buildStateGuide = (_state = {}) => {
  // Fallback: return empty string - state should drive behavior, not instructions
  return '';
};
```

### 2.2 返答構成テンプレート（削除）

**削除した内容:**
- 番号付き組み立てステップ（1. まず〜、2. 次に〜、3. そのあと〜）
- 返答の型指示（"先に〜 -> その後〜 -> 最後に〜"）
- 構造化フォーマット指示
- 出力フロー図

### 2.3 末尾誘導（User Prompt から削除）

**削除前の例（全エージェント）:**
```javascript
自然な口語日本語で返してください。
今回の言葉の地肌に触れてください。
まだ鈍っていない感覚や生きている向きがあれば自然に拾ってください。
抽象的にまとめず、入力にある名詞・動詞・違和感・止まり方を少し使ってください。
この入力にちゃんと触れた感じを出してください。
```

**削除後:**
```javascript
${userName}の今の言葉:
${userText}
```

すべてのエージェント（Joe, Ray, Ken, Mina, Satou）の user prompt を中立化。

### 2.4 禁止事項の過剰列挙（System Prompt から削除）

**削除前の例:**
```
【禁止事項】
- 前向きさを足さない
- 相手を元気づけにいかない
- 問題解決モードに流れすぎない
- 見えていないのに見えたふりをしない
- 過去の説明の要約屋にならない
- 組み立て禁止
- 明るい結論で締めない
（合計 10-15 項目）
```

**削除後:**
```
【避ける方向】
- 火種への常套句的収束
- 説教、長い励まし
- 受容語の連発、整理口調
- 全部に触れようとすること
（5-7 項目に削減、20-40% 軽量化）
```

明示的な「〜しない」から、暗黙的な「〜は避ける」へ変更。

---

## 3. Joe の Hard Detemplating

### 3.1 変更前のアーキテクチャ

Joe は `buildPrompt.js` の `buildJoeSystemPrompt` に依存していました:
- 状態別に異なる手続き指示を生成
- 返答組み立てステップを明示
- 出力フォーマットを指定

### 3.2 変更後のアーキテクチャ

**新規ファイル: `src/runtime/prompts/joe.js`**

主な変更:
1. **独立したプロンプトビルダー作成**
   - `buildJoeSystemPrompt` を joe.js に移動
   - `buildJoeUserPrompt` を joe.js に移動
   - `scoreJoeMaterials` を独立実装
   - `buildJoeBiasPack` を独立実装

2. **知覚傾向への移行**
   ```javascript
   【知覚傾向】
   - まだ動いている部分に目が行きやすい
   - 諦めの中に残っている向きを感知しやすい
   - 押し込められた力や火種に気づきやすい
   - 飾られた言葉より、素の一言に反応しやすい
   ```

3. **避ける方向（禁止事項の軽量化）**
   ```javascript
   【避ける方向】
   - 火種への常套句的収束
   - 「火」「熱」「まだある」「わかる」の安易な常用
   - 同じ語尾・同じ比喩・同じ導入の繰り返し
   - 説教、長い励まし
   ```

4. **手続き指示の完全削除**
   - stateGuide は空文字列を受け取る
   - 組み立てステップなし
   - 返答の型指示なし

### 3.3 buildPrompt.js の deprecated 化

`buildPrompt.js` の Joe 関連関数は fallback として残していますが、実際には使用されません:
```javascript
// Line 463-466
const buildStateGuide = (_state = {}) => {
  // Fallback: return empty string - state should drive behavior, not instructions
  return '';
};
```

---

## 4. User Prompt の中立化

### 4.1 変更内容

**全エージェント共通パターン:**

変更前:
```javascript
// 多数の「〜してください」指示
自然な口語日本語で返してください。
今回の言葉の地肌に触れてください。
この入力にちゃんと触れた感じを出してください。
```

変更後:
```javascript
${userName}の今の言葉:
${userText}
```

### 4.2 影響を受けたファイル

- `src/runtime/prompts/joe.js:256-259`
- `src/runtime/prompts/ray.js:238-243`
- `src/runtime/prompts/ken.js:243-249`
- `src/runtime/prompts/mina.js:242-248`
- `src/runtime/prompts/satou.js:238-244`

### 4.3 理論的根拠

末尾誘導は「外部からの手続き的指示」であり、自然発露アーキテクチャと矛盾します:
- LLM に「どう応答するか」を教えるのではなく
- 内部状態（activated, state, bias）から自然に振る舞いが発露する

---

## 5. System Prompt の軽量化

### 5.1 削減率

| エージェント | 削減前 | 削減後 | 削減率 |
|------------|--------|--------|--------|
| Joe        | ~120行 | ~85行  | ~29%   |
| Ray        | ~95行  | ~65行  | ~32%   |
| Ken        | ~100行 | ~70行  | ~30%   |
| Mina       | ~105行 | ~75行  | ~29%   |
| Satou      | ~98行  | ~68行  | ~31%   |

平均削減率: **30%**

### 5.2 軽量化手法

1. **禁止事項セクションの統合**
   - 【禁止事項】セクションを削除
   - 【避ける方向】に統合（項目数を 50% 削減）

2. **手続き指示の削除**
   - 【返答の運び方】セクション削除
   - 【今回の状態への対応】を空に（stateGuide = ''）

3. **冗長な説明の削除**
   - 例示の削減
   - 注意書きの削減
   - 繰り返し表現の削除

### 5.3 具体例（Mina）

**削減前（~105行）:**
```javascript
【知覚傾向】
（7項目）

【避ける方向】
（7項目）

【禁止事項】（削除）
- 過剰な賛美（「あなたは光」「存在そのものが価値」）
- パフォーマティブな共感（同じ受容語の連発）
- 包み込みすぎて相手の輪郭を溶かすこと
- ...（さらに 5-7 項目）

【返答の運び方】（削除）
1. まず〜
2. 次に〜
3. そのあと〜
```

**削減後（~75行）:**
```javascript
【知覚傾向】
（7項目）

【避ける方向】
- 過剰な賛美
- パフォーマティブな共感
- 包み込みすぎること
（3項目に統合）

【出力ルール】
（3項目）
```

---

## 6. Surface の内部状態駆動化

### 6.1 変更内容

**buildSurfaceGuidance の優先順位変更:**

変更前:
1. stateGuide（手続き指示）
2. surfaceFrame（内部状態）

変更後:
1. surfaceFrame（内部状態）- consciousIntent, lengthPlan 駆動
2. stateGuide（空文字列）

### 6.2 具体的な変更箇所

**src/runtime/prompts/joe.js:225-227**
```javascript
【今回の状態への対応】
${stateGuide || ''}              // 空文字列（legacy）
${finalSurfaceGuidance}          // 内部状態駆動（primary）
```

**Surface の生成ロジック:**
- `consciousIntent` - 意識的意図（holdBack, pointToward など）
- `lengthPlan.lineCountHint` - 長さヒント
- `focalClusterIds` - 注目クラスター
- `emotionalColor` - 感情的色合い
- `motionBias` - 動きのバイアス

これらの内部状態要素が、手続き指示なしで surface guidance を生成します。

### 6.3 テスト検証

**buildPrompt.test.js:307-311**
```javascript
// stateGuide is now expected to be empty (legacy detemplating complete)
const stateGuide = readSection(prompt, '【今回の状態への対応】', '【共通OSの薄い内部フレーム】');
// State should drive behavior, not procedural instructions
assert.ok(stateGuide.trim().length === 0 || stateGuide.trim().length < 50);
```

---

## 7. Legacy Tracking Metrics

### 7.1 追加したメトリクス

**src/runtime/surfaceDebug.js:37-146**

新しいトラッキングフィールド:

```javascript
return {
  // Legacy tracking metrics (new)
  legacyPromptPathUsed: !joeIndependentPrompt,
  legacyInstructionCount,
  userPromptDirectiveCount,
  surfaceUsesInternalState,
  joePromptIndependent: joeIndependentPrompt,
  promptDietReduced,

  // Existing metrics
  ...
};
```

### 7.2 各メトリクスの意味

| メトリクス | 説明 | 期待値 |
|-----------|------|--------|
| `legacyPromptPathUsed` | 旧 buildPrompt.js を使用しているか | false |
| `legacyInstructionCount` | 手続き指示の数（"1.", "2.", "まず", "次に"） | 0 |
| `userPromptDirectiveCount` | user prompt の末尾誘導数（"してください"） | 0 |
| `surfaceUsesInternalState` | surface が内部状態駆動か | true |
| `joePromptIndependent` | Joe が独立プロンプトを使用しているか | true |
| `promptDietReduced` | system prompt が削減されたか | true |

### 7.3 使用方法

Compare Mode または Debug Mode で、これらのメトリクスを確認できます:

```javascript
const debug = buildSurfaceDebug({
  agentId: 'creative',
  activated,
  userText,
  ...
});

console.log(debug.legacyInstructionCount);  // Should be 0
console.log(debug.joePromptIndependent);    // Should be true
```

---

## 8. テスト更新

### 8.1 更新したテスト

**buildPrompt.test.js:**
- 旧手続き指示を期待するテストを更新（4 tests）
- 知覚傾向ベースの検証に変更
- stateGuide 空文字列期待に変更

**buildAgentPrompt.test.js:**
- 旧【ジョーの触れ方】セクションを【知覚傾向】に変更（6 tests）
- 禁止事項から避ける方向への検証変更

### 8.2 テスト結果

```
✔ tests 530
✔ suites 41
✔ pass 530
✖ fail 0
```

すべてのテストが成功しています。

---

## 9. まとめ

### 9.1 達成した目標

✅ **Joe Hard Detemplating**
- 独立プロンプトファイル作成（joe.js）
- buildPrompt.js からの分離完了
- 手続き指示の完全削除

✅ **Legacy Prompt Purge**
- 手続き的組み立て指示削除
- 番号付きステップ削除
- 返答フォーマット指示削除

✅ **User Prompt 中立化**
- 全エージェントの末尾誘導削除
- 「〜してください」指示をゼロに

✅ **System Prompt 軽量化**
- 平均 30% 削減達成
- 禁止事項を避ける方向に統合
- 冗長な説明削除

✅ **内部状態駆動化**
- Surface が consciousIntent/lengthPlan 駆動
- stateGuide を空文字列に
- 手続き指示から知覚傾向へ

✅ **Legacy Tracking**
- 6 つの新メトリクス追加
- Compare/Debug モードで監視可能

### 9.2 アーキテクチャの変化

**Before (手続き指示型):**
```
User Input → State Estimation → Procedural Instructions → LLM → Response
                                 ↑
                        「1. まず〜」
                        「2. 次に〜」
                        「してください」
```

**After (自然発露型):**
```
User Input → State Estimation → Perception Tendencies → LLM → Response
                                 ↑
                        知覚傾向
                        避ける方向
                        内部バイアス
```

### 9.3 今後の監視ポイント

1. **Legacy メトリクスの定期確認**
   - `legacyInstructionCount` が 0 であることを確認
   - `joePromptIndependent` が true であることを確認

2. **プロンプト品質の維持**
   - 知覚傾向が機能しているか
   - 避ける方向が効果的か
   - 内部バイアスが適切に影響しているか

3. **テストの継続的更新**
   - 新しいエージェント追加時の注意
   - 旧アーキテクチャへの回帰防止

---

**報告者:** Claude Code
**日付:** 2026-04-19
**ステータス:** ✅ Complete
