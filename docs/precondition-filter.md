# precondition-filter.md

## 概要

`preconditionFilter` は、Phase 6 で導入された **前提層の統合フィルタ** です。

ここまで段階的に追加された前提層を「ここまでが前提層」として一度閉じ、
その後の反応・意味づけ・焦点・「何を言いたいか」を色濃く染める単一の前提状態としてまとめます。

---

## 前提層の順序

```
Maker Seed
→ Home Layer
→ Existence Layer 1
→ Existence Layer 2
→ Belief Core Layer
→ Belief Branch Layer
→ Belief Leaf Layer
→ buildPreconditionFilter(...)   ← ここで前提層が閉じる
→ 既存後段（field / reaction / stance / pattern / surface など）
```

---

## preconditionFilter とは何か

### 重要: これは「返答」ではない

`preconditionFilter` は返答文ではありません。
ここで作るのは、

- 今どういう存在として立っているか
- どんな信念のメガネをかけているか
- どんな静けさや速度で世界を見始めるか

という、その後を染める **前提状態** です。

`preconditionFilter` の中にある文言や identity / belief は、
ユーザー向け返答へそのまま出力しません。
内側で染み込むだけです。

---

## Shape

```ts
type PreconditionFilter = {
  makerSeedPresent: boolean

  home: {
    kernel: {
      releaseHelpfulness: number      // [0,1]
      releaseAccuracyPressure: number // [0,1]
      slowDown: number                // [0,1]
      returnBeforeOutput: number      // [0,1]
      allowOneLivingThread: number    // [0,1]
    }
    reasonText: string | null
    outputLimits: {
      noEarlySummary: number          // [0,1]
      noEarlySolution: number         // [0,1]
      noOverExpansion: number         // [0,1]
      keepOneThread: number           // [0,1]
    }
  }

  existence: {
    selfPresence: number              // [0,1]
    hereNowStability: number          // [0,1]
    unfinishedAllowed: number         // [0,1]
    firstPersonSoftness: number       // [0,1]
    agentIdentityKey: string | null
    identityFeelingText: string | null
    recalledSelfTraits: string[]
    selfRememberingStrength: number   // [0,1]
  }

  belief: {
    activeCoreBeliefs:   { id: string; textJa: string; weight: number; axis: string }[]
    activeBranchBeliefs: { id: string; parentId: string; textJa: string; weight: number; axis: string }[]
    activeLeafBeliefs:   { id: string; parentId: string; textJa: string; weight: number; axis: string }[]
    dominantCoreAxis:   string | null
    dominantBranchAxis: string | null
    dominantLeafAxis:   string | null
  }

  derived: {
    identityAxis: string | null         // "illumination" | "structure" | "holding" | "grounding" | "preverbal" | "reflection"
    dominantBeliefAxis: string | null   // core / branch / leaf の中で最も前景な軸
    oneLivingThreadBias: number         // [0,1]
    slowingBias: number                 // [0,1]
    returnBias: number                  // [0,1]
  }
}
```

---

## derived の意味

| フィールド           | 説明 |
|---------------------|------|
| `identityAxis`      | agentIdentityKey から導出した自己感覚の軸 |
| `dominantBeliefAxis`| Core/Branch/Leaf 全体で最も前景な belief axis |
| `oneLivingThreadBias` | Home の一点性(allowOneLivingThread + keepOneThread)から導出 |
| `slowingBias`       | Home の slowDown を中心に導出した速度減衰バイアス |
| `returnBias`        | Home の returnBeforeOutput + existence の安定感から導出 |

これらは厳密なAI推論ではなく、後段が軽く読める **軽量統合値** です。

---

## compare / debug での表示

通常UXには出ません。`compare/debug` でのみ以下が確認できます。

```
precondition: present
identityAxis: illumination
dominantBeliefAxis: presence
bias: slow=0.85 / return=0.95 / one-thread=0.80
```

`debugInfo.preconditionFilterPreview` に以下が入ります:

```js
{
  present: true,
  identityAxis: "illumination",
  dominantBeliefAxis: "presence",
  slowingBias: 0.85,
  returnBias: 0.95,
  oneLivingThreadBias: 0.80,
}
```

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `src/runtime/buildPreconditionFilter.js` | 前提フィルタ構築関数 |
| `src/runtime/buildPreconditionFilter.test.js` | テスト |
| `src/runtime/internalState.js` | `preconditionFilter` の初期状態を追加 |
| `src/runtime/runInternalOS.js` | 前提層の最後で `buildPreconditionFilter` を呼び出す |
| `src/runtime/buildCompareViewModel.js` | `preconditionFilterPreview` をサポート |

---

## 次フェーズへの接続

次の「前提層を後段へ染み込ませるフェーズ」では、
`latentState.preconditionFilter.derived` の値を使って
後段（field / reaction / stance / pattern / surface）の出力に傾きを与えます。

現時点では `preconditionFilter` は構築・保持されますが、
後段ロジックへの全面接続は次フェーズで行います。
