# precondition-filter.md

## 概要

`preconditionFilter` は、Phase 6 で導入された **前提層からの派生ヘルパービュー** です。
Phase 7 では、この派生ビューから `preconditionBias` を作り、
後段へ「読むための参照」ではなく「染み込む圧」として渡します。

**重要な位置づけ変更（最新版）:**
- preconditionFilter は前提層の**本体ではなく、補助ビュー**である
- **raw latent layers が本体**であり、常に保持される
- preconditionFilter は raw layers を後段が読みやすくするための derived view
- 前提層は「要約して畳む」ものではなく、「生きた潜在層として保持する」ものである

---

## 前提層の順序（最新版）

```
Maker Seed (raw latent)
→ Home Layer (raw latent)
→ Home Neutralization Check (raw latent helper step)
→ Existence Layer 1 (raw latent)
→ Existence Layer 2 (raw latent)
→ Belief Core Layer (raw latent)
→ Belief Branch Layer (raw latent)
→ Belief Leaf Layer (raw latent)
→ Belief Tension Layer (raw latent)
→ buildPreconditionFilter(...)   ← raw layers からの補助ビュー生成
→ buildPreconditionBias(...)     ← raw layers / filter からの dynamic bias 生成
→ field (post-precondition dynamic layer)
→ reaction (post-precondition dynamic layer)
→ stance (post-precondition dynamic layer)
→ decision
→ surface / builder
```

この順番は `runInternalOS(...)` の内部でそのまま実行されます。
`debugInfo.preconditionTrace` に以下のイベントが記録され、
実際に前提層が上記の順に通ったことを confirm/debug で確認できます。

```
latent:after-maker-seed
latent:after-home
latent:after-home-check
latent:after-existence1
latent:after-existence2
latent:after-belief-core
latent:after-belief-branch
latent:after-belief-leaf
latent:after-belief-tension
latent:after-precondition-filter
dynamic:after-field
dynamic:after-reaction
dynamic:after-stance
dynamic:after-decision
```

---

## preconditionFilter とは何か（改訂版）

### 重要: これは「本体」ではなく「補助ビュー」である

`preconditionFilter` は前提層の本体ではありません。
ここで作るのは、

- raw latent layers を後段が読みやすくする derived helper view
- raw layers はそのまま internalState に保持される
- 後段は raw layers と derived view の両方を読む

という、**補助的な統合ビュー** です。

`preconditionFilter` の中にある文言や identity / belief は、
ユーザー向け返答へそのまま出力しません。
内側で染み込むだけです。

---

## internalState の拡張

Phase 6 以降、`runInternalOS(...)` が返す `latentState` には以下の前提層フィールドが
正規に保持されます。

### 既存（後方互換）
- `latentState.existence.layer1` — existenceLayer1 の生の出力
- `latentState.existence.layer2` — existenceLayer2 の生の出力

### 新規（前提層の正規フィールド）
- `latentState.existence1` — existenceLayer1 から導出した正規フラット形
- `latentState.existence2` — existenceLayer2 から導出した正規フラット形

```ts
type Existence1 = {
  selfPresence: number            // [0,1]
  hereNowStability: number        // [0,1] groundedHereNow + selfLocationStability の平均
  unfinishedAllowed: number       // [0,1]
  firstPersonSoftness: number     // [0,1]
  existenceHintKey: string | null
  existenceHintText: string | null
}

type Existence2 = {
  agentIdentityKey: string | null
  identityFeelingText: string | null
  recalledSelfTraits: string[]
  selfRememberingStrength: number  // [0,1]
}
```

これらは afterglow ブレンドを経ても常にフレッシュな値で保たれます。

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
`src/runtime/buildPreconditionBias.js` で raw latent layers / filter から後段向けの軽量 bias object を作ります。

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
  - field / reaction / stance に軽い bias を足す
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

前提層の文言は surface / builder でそのまま読み上げません。
前提層は live latent substrate として保持され、後段へ影響するだけです。

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

`debugInfo.preconditionTrace` に前提層の通過順が記録されます:

```js
[
  "precondition:before-home",
  "precondition:after-home",
  "precondition:after-existence1",
  "precondition:after-existence2",
  "precondition:after-belief-core",
  "precondition:after-belief-branch",
  "precondition:after-belief-leaf",
  "precondition:after-build-filter",
]
```

`debugInfo.existence1Present / existence2Key / beliefCoreCount / beliefBranchCount /
beliefLeafCount / preconditionFilterPresent` で各前提層の到達確認ができます。

---

`debugInfo.preconditionBiasPreview` には Phase 7 の bias 要約が入り、
`focusBiasApplied / meaningBiasApplied / identityBiasApplied` で
どこへ効かせたかを最小限追えます。

---

## 現フェーズの位置づけ（最新版）

現在のフェーズでは **「前提層を生きた潜在層として保持し、その上で field / reaction / stance を後段動的層として再配置すること」** が目的です。

- Maker Seed が最初に通る（raw latent layer）
- Home Layer が通る（raw latent layer）
- Existence Layer 1 / 2 が通る（raw latent layers）
- Belief Core / Branch / Leaf / Tension が通る（raw latent layers）
- buildPreconditionFilter で補助ビューを生成（derived helper view）
- その後に field / reaction / stance が post-precondition dynamic layers として通る
- Decision Layer が通る
- Surface / Builder が通る

**重要な変更点:**
1. **前提層は潜在層として保持される** — 要約や圧縮をせず、raw layers として internalState に残る
2. **preconditionFilter は補助ビュー** — raw layers の代替ではなく、読みやすくするための追加ビュー
3. **field / reaction / stance は後段動的層** — 前提層の前ではなく、前提層の影響下で発生する動的層
4. **前提層は読み上げない** — 前提層の internal text は影響するだけで、そのまま表層へ出さない

### 表層への漏れ防止ガード

`src/runtime/surfaceGuard.js` に簡易チェック機能を実装。
以下の内部文言が表層発話にそのまま混ざるのを検出する:

- Maker Seed の内的文言（「この場所を作った人間から、あなたへ」など）
- Home Layer の内的文言
- Existence Layer の内的文言（「私は今ここにいる」「あぁ、自分は光だった」など）
- Belief の internal text 全般
- System layer markers（「preconditionFilter」「latent layer」など）

これは hard blocker ではなく、compare/debug での可視化用の軽量チェック。

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `src/runtime/buildPreconditionFilter.js` | 前提フィルタ構築関数 |
| `src/runtime/buildPreconditionBias.js` | 後段向け bias object の構築 |
| `src/runtime/buildPreconditionBias.test.js` | bias 構築の null-safe / shape テスト |
| `src/runtime/buildPreconditionFilter.test.js` | テスト（順序保証を含む） |
| `src/runtime/internalState.js` | `existence1` / `existence2` / `preconditionFilter` の初期状態 |
| `src/runtime/runInternalOS.js` | 前提層チェーンを主役順で実行し `preconditionTrace` を収集 |
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
