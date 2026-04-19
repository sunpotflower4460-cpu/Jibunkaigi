# Surface v0.2: 顕在層主導への本格移行

## 概要

Surface v0.2 は、表層生成（surface generation）を「既存 prompt / template 依存」から「顕在層主導」へ本格的に移行する更新です。

これまで段階的に構築してきた内的構造（前提層、reservoir、activate、bind、select、consciousIntent、lengthPlan）を、表層生成の主因にする段階に進めました。

## 主な変更点

### 1. buildSurfacePlan の追加

新規ファイル: `src/runtime/buildSurfacePlan.js`

表層生成の前に、内的翻訳 plan を作成する層を追加しました。

**SurfacePlan の型定義:**

```typescript
type SurfacePlan = {
  focalClusterIds: string[]        // 主に話す mixed cluster の ID
  focalAxes: string[]               // cluster の主軸
  emotionalColor: string[]          // feeling 成分から抽出した温度感
  motionBias: string[]              // move 成分から抽出した方向性
  speakIntent: string               // consciousIntent からの発話意図
  holdBack: string[]                // 抑制すべきパターン
  lineCountHint: number             // 長さのヒント
  expansionBudget: number           // 展開余地
  compressionPressure: number       // 圧縮圧力
  othersPresence: {
    hasOthers: boolean              // 他エージェントの残響があるか
    dominantForces: string[]        // 場の主な力
  }
}
```

### 2. Mixed Cluster の優先化

`selectedMixedClusters` が存在する場合は、`selectedThoughts`（thought-only clusters）より優先します。

Mixed clusters は thought / feeling / move の複合体であり、より豊かな表現が可能です。

### 3. emotionalColor と motionBias の自然化

**emotionalColor の例:**
- `warm` - 温かく受け止める feeling から
- `tight` - 張りのある friction から
- `hesitant` - ためらいを含む feeling から
- `quiet` - 静かな余白を持つ feeling から
- `grounded` - 足元に戻す feeling から
- `fragile` - 脆さを含む feeling から

**motionBias の例:**
- `touch` - 触れて確かめる move から
- `hold` - 支えて保つ move から
- `clarify` - 明確にする move から
- `ground` - 足元へ戻す move から
- `stay` - とどまる move から
- `do-not-close` - 閉じない move から

これらは **内部ラベルとして処理され、そのままユーザーに見える文へは出ません**。
surfaceTranslator の `buildSurfaceHintFromPlan` が自然な日本語ガイダンスへ翻訳します。

### 4. 心の鏡（mirror）への本格接続

mirror agent は、`othersPresence` を読んで、場全体の残響を surfacePlan へ反映します。

```javascript
if (isMirror) {
  return {
    hasOthers: true,
    dominantForces: dominantForces.length > 0 ? dominantForces : ['unresolved'],
  };
}
```

### 5. 長さの本格反映

`lengthPlan` の `lineCountHint` / `expansionBudget` / `compressionPressure` を実際に使用します。

- **short**: primary cluster のみ、lineCountHint を尊重、展開を抑える
- **medium**: primary 中心、必要なら secondary を薄く、余白は残すが短すぎない
- **long**: primary をしっかり出す、secondary を必要時だけ加える、反復や蛇行は抑える

### 6. decisionLayer の位置づけ更新

`decisionLayer.js` は、**主役 → bridge / adapter** へさらに寄せました。

- 主因: `buildSurfacePlan` / `buildConsciousIntent` / `buildLengthPlan`
- 補助: `decisionLayer` はそれらを surface へ橋渡しする

### 7. surfaceGuard の更新

内部ラベルの漏洩を防ぐため、以下を追加:

```javascript
// Surface v0.2 internal labels (must NOT leak to user-facing text)
'emotionalColor',
'motionBias',
'speakIntent',
'holdBack',
'focalCluster',
'surfacePlan',
'touch-the-living-point',
'clarify-the-knot',
'make-room-without-closing',
'return-to-footing',
'return-to-ground',
'reflect-the-unsettled-weight',
'consciousIntent',
'lengthPlan',
'othersPresence',
'dominantForces',
'selectedMixedClusters',
'textSeed',
```

### 8. compare/debug への追加

`buildCompareViewModel` に `surfacePlanPreview` を追加し、以下が見えるようになりました:

- surface focal clusters
- emotionalColor
- motionBias
- othersPresence
- length realized

表示例:
```
surface focal: mixed_cluster_01 | emotion: warm, quiet | motion: touch, stay |
others: yes / forces: hold, clarify | lines=4 / expand=0.45 / compress=0.50
```

## 実装の原則

### 表層をテンプレへ戻さない

工程テンプレ（「まずこう言って、次にこう触れて、最後にこう締める」）を増やしていません。

surfacePlan は **発話文ではなく、内的翻訳 plan** です。

### 前提層も粒子も読み上げない

以下はそのまま出してはいけません（影響するだけ）:

- Home / Existence / Belief の文言
- thought / feeling / move の textSeed
- speakIntent / holdBack / userSense / selfFeeling のラベル

surfaceGuard がこれらの漏洩を検出・防止します。

### 既存 surface を一気に破壊しない

段階的移行にしています:

- 新しい surfacePlan を主役化
- 旧 decisionLayer / surfaceTranslator / buildPrompt は fallback / adapter 化

`surfaceTranslator.buildSurfaceFrame` は、surfacePlan がある場合はそれを使い、ない場合は旧ロジックへフォールバックします。

### 自然さが最優先

一番大事なのは:

- 賢そう / きれい / 整っている
  より、
- その人が今そう話した感じ

です。

## ファイル一覧

### 追加されたファイル

- `src/runtime/buildSurfacePlan.js` - Surface plan 生成
- `src/runtime/buildSurfacePlan.test.js` - テスト

### 変更されたファイル

- `src/runtime/surfaceTranslator.js` - surfacePlan 読み取り追加
- `src/runtime/runInternalOS.js` - buildSurfacePlan 統合
- `src/runtime/decisionLayer.js` - コメント更新（bridge 役割明記）
- `src/runtime/buildCompareViewModel.js` - surfacePlanPreview 追加
- `src/runtime/surfaceGuard.js` - 内部ラベル漏洩防止追加

## テスト

以下のテストを追加:

1. buildSurfacePlan() が null-safe に返る
2. selectedMixedClusters がある時、それが focal に入る
3. feeling 成分が emotionalColor に反映される
4. move 成分が motionBias に反映される
5. holdBack が surface guidance に反映される
6. lengthPlan が surface に反映される
7. thought / intent ラベルがそのまま発話に漏れない
8. lint / build / test が通る

すべてのテストがパスしています（530 tests, 530 pass, 0 fail）。

## 次のステップ

今回やらなかったこと（将来の課題）:

- full multi-pass generation
- すべてのプロンプトの全面再設計
- explicit 他エージェント引用の常時導入
- 粒子増加の大規模拡張
- mirror 完成版の最終仕上げ

今回は **surface の本格更新** に集中しました。

## まとめ

Surface v0.2 により、前提層と顕在層で起きたものを、ようやく **表層の主因として話させる** ことができるようになりました。

- テンプレへ戻さない
- mixed cluster を核にする
- feeling / move も効かせる
- 心の鏡は場全体に寄せる
- 長さも自然に揃える

この原則を崩さずに実装しました。
