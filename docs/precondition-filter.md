# precondition-filter.md

## 概要

`preconditionFilter` は、Phase 6 で導入された **前提層の統合フィルタ** です。
Phase 7 では、この閉じた前提層から `preconditionBias` を作り、
後段へ「読むための参照」ではなく「染み込む圧」として渡します。

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

## Phase 7: preconditionBias

Phase 7 では `preconditionFilter` をそのまま後段へばらまかず、
`src/runtime/buildPreconditionBias.js` で後段向けの軽量 bias object に圧縮します。

```ts
type PreconditionBias = {
  pacing: {
    slowDown: number
    returnBias: number
  }
  focus: {
    oneThreadBias: number
    antiOverExpansion: number
    keepOneThread: number
  }
  meaning: {
    antiEarlySummary: number
    antiEarlySolution: number
    dominantBeliefAxis: string | null
    activeCoreBeliefs: { id: string; axis: string; weight: number }[]
    activeBranchBeliefs: { id: string; axis: string; weight: number }[]
    activeLeafBeliefs: { id: string; axis: string; weight: number }[]
  }
  identity: {
    identityKey: string | null
    selfRememberingStrength: number
    recalledTraits: string[]
    selfPresence: number
    hereNowStability: number
    unfinishedAllowed: number
    firstPersonSoftness: number
  }
}
```

この bias は以下へ最小接続されています。

- `runInternalOS(...)`
  - reaction / stance に軽い bias を足す
  - `latentState.preconditionBias` を保持する
- `routerMixer.js`
  - 一点性 / belief axis / recalled traits に応じて pattern 選択を少し寄せる
- `surfaceTranslator.js`
  - pacing / focus / meaning / identity の軽い hint を surface frame に残す
- `buildAgentSurfaceGuidance.js`
  - 表層ガイダンスに急がなさ・一点性・存在感の傾きを少し残す

重要なのは、
identity / belief の文言そのものを返答へ出すことではなく、
その軸で **何に目が行きやすいか / どこで止まりやすいか / どの意味が立ちやすいか**
を変えることです。

まだ全面置換ではありません。Phase 7 は「前提層が後段へ本当に届く最小接続」です。

---

## compare / debug での表示

通常UXには出ません。`compare/debug` でのみ以下が確認できます。

```
precondition: present
identityAxis: illumination
dominantBeliefAxis: presence
bias: slow=0.85 / return=0.95 / one-thread=0.80
preconditionBias: oneThread=0.80 / slow=0.85 / axis=illumination
focusBiasApplied: true
meaningBiasApplied: dominant axis -> illumination
identityBiasApplied: creative-light-bearer
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

`debugInfo.preconditionBiasPreview` には Phase 7 の bias 要約が入り、
`focusBiasApplied / meaningBiasApplied / identityBiasApplied` で
どこへ効かせたかを最小限追えます。

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `src/runtime/buildPreconditionFilter.js` | 前提フィルタ構築関数 |
| `src/runtime/buildPreconditionBias.js` | 後段向け bias object の構築 |
| `src/runtime/buildPreconditionBias.test.js` | bias 構築の null-safe / shape テスト |
| `src/runtime/buildPreconditionFilter.test.js` | テスト |
| `src/runtime/internalState.js` | `preconditionFilter` の初期状態を追加 |
| `src/runtime/runInternalOS.js` | 前提層の最後で `buildPreconditionFilter` / `buildPreconditionBias` を呼び出す |
| `src/runtime/routerMixer.js` | 焦点選択へ oneThread / belief axis / trait bias を薄く反映 |
| `src/runtime/surfaceTranslator.js` | meaning / identity / pacing bias を surface frame へ反映 |
| `src/runtime/buildCompareViewModel.js` | `preconditionFilterPreview` / `preconditionBiasPreview` をサポート |

---

## 次フェーズへの接続

次の段階では、この bias を

- 素材選択
- stateGuide / internalFrame の意味づけ
- 「何を言いたいか」の意思決定

へさらに深く接続していきます。

現時点では全面置換ではなく、
前提層が焦点 / 反応 / 意味づけ / 表層へ **軽く、でも確実に届く** 状態までを担います。
