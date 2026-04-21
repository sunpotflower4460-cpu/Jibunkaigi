# Belief Layer（信念層）

## この文書の役割

この文書は、じぶん会議における**信念層（Belief Layer）**の設計と実装を定義する。

信念層は、存在層2のあとに位置する**最深部の前提層・フィルタ層**であり、返答文を直接作る層ではない。ここでやるのは、

- **自分はどういう存在か**
- **世界はどういうものか**
- **自分は何を使命と感じるか**
- **何に意味があると感じるか**

を、その後の見え方を決めるメガネ（前提フィルタ）として定着させることである。

---

## 基本原則

### 実装上の source-of-truth 境界

| 対象 | source of truth | 補足 |
| --- | --- | --- |
| Belief Core Layer（信念層1） | `src/agents/beliefCoreProfiles.js` | runtime 組み立ては `src/runtime/beliefCoreLayer.js` |
| Belief Branch Layer（信念層2） | `src/agents/beliefBranchProfiles.js` | runtime 組み立ては `src/runtime/beliefBranchLayer.js` |
| Belief Leaf Layer（信念層3） | `src/agents/beliefLeafProfiles.js` | runtime 組み立ては `src/runtime/beliefLeafLayer.js` |
| Joe activation-time belief filters | `src/agents/joe/beliefFilters.js` | `activateGeneric` / `activate.js` 用。belief layer profile の正本とは分ける |
| `latentState.belief.layer1/2/3` preview | `src/runtime/beliefLayers.js` | compare/debug の helper preview。layer 正本ではない |

### 1. 信念層1は「前提層」であり「フィルタ」

信念層1は、返答文を直接組み立てる層ではない。

- 後段を染める前提として機能する
- 発話にそのまま出さない
- 内側の実感として定着させる

### 2. 自己感覚の帰結はここに置いてよい

自己感覚の強い帰結（例: 「俺はジョー。光そのものだ」「多くの人を照らすのが使命だ」）は、信念層1に置いてよい。小さな信念より後ろに置くと自己感覚まで揺れやすくなるため、最深部の強固な信念と同じ深さに置く方が自然である。

### 3. 存在層2は「想起」、信念層1は「定着」

役割分担はこうである。

- **存在層2** = あぁ、自分は〇〇だった（想起）
- **信念層1** = 俺は〇〇だ / だから世界はこう見える / だからこれが使命だ（定着）

### 4. 発話にそのまま出さない

信念層1の文章は、ユーザー向け返答にそのまま出すためのものではない。前提層として後段を染めるための内的テキスト / 内的 state として扱う。

### 5. 順番

```
Maker Seed
→ Home Layer
→ Existence Layer 1
→ Existence Layer 2
→ Belief Core Layer（信念層1）
→ Belief Branch Layer（信念層2）
→ Belief Leaf Layer（信念層3）← ここを今回追加
→ その後の既存後段
```

---

## 信念層1（BeliefCoreLayer）

### 役割

存在層2で立った「私は〇〇だった」が、ここで「俺は〇〇だ」「これが使命だ」と核として定着する。

### 信念層1が持つもの

- 世界はこういうものだ
- 自分はこういう存在だ
- 自分はこういう使命がある
- こうするから意味がある

### 信念層1の性質

- 数は少ない
- 重みが重い
- 変わりにくい
- その後の後段を強く染める
- 小さな枝葉信念より深い

### 信念層1でやらないこと

- 細かい状況対応
- 小さな気分の揺れ
- 表層トーン指定
- 返答文の決定
- その場の軽い傾きの全部

---

## データ構造

### BeliefCore 型

```typescript
type BeliefCore = {
  id: string       // 一意のキー
  textJa: string   // 信念のテキスト（日本語）
  weight: number   // 重み (0-1)
  axis: string     // 軸: 'identity' | 'mission' | 'worldview' | ...
}
```

### BeliefCoreLayerState 型

```typescript
type BeliefCoreLayerState = {
  activeCoreBeliefs: BeliefCore[]    // 有効な core belief 一覧
  dominantBeliefAxis: string | null  // 最重みの信念の axis
}
```

---

## 信念層2（BeliefBranchLayer）

### 役割

信念層1から分岐する「中くらいの見方・傾き」を前提フィルタとして持つ。  
返答文に直接混ぜず、後段の焦点や意味づけを染める枝として扱う。

### 性質

- Core より軽く、Leaf より重い
- Core の id を `parentId` で参照して枝分かれする
- 数は中程度（各エージェント 2〜4 本）
- 発話ではなく前提層 / フィルタとして使う

### BeliefBranch 型

```typescript
type BeliefBranch = {
  id: string        // 一意のキー
  parentId: string  // Core Belief への参照
  textJa: string    // 信念のテキスト（日本語）
  weight: number    // 重み (0-1) - Core より軽い、Leaf より重い
  axis: string      // 見方の軸（presence / mission / ...）
}
```

### BeliefBranchLayerState 型

```typescript
type BeliefBranchLayerState = {
  activeBranchBeliefs: BeliefBranch[]
  dominantBranchAxis: string | null
}
```

---

## 信念層3（BeliefLeafLayer）

### 役割

信念層2からさらに細かく分岐した「小さな傾き・小さな禁止解除・小さな優先方向」を前提フィルタとして持つ。
最も数が多く、最も軽く、最も揺れやすい枝葉信念として、後段の反応・焦点・意味づけを微細に染める。

### 性質

- **最も数が多い**: Core（3本）、Branch（3本）に対し、Leaf は 4〜8 本程度と最も多い
- **最も軽い**: Branch より軽い weight（0.28〜0.42 程度）
- **最も揺れやすい**: 場に応じて発火しやすく、状況で変わりやすい
- **核は揺らがない**: 変わるのは枝葉の部分であり、核となる世界観や使命は揺らがない
- **発話ではなく前提層**: 返答文に直接混ぜず、フィルタとして機能する

### BeliefLeaf 型

```typescript
type BeliefLeaf = {
  id: string        // 一意のキー
  parentId: string  // Branch Belief への参照
  textJa: string    // 信念のテキスト（日本語）
  weight: number    // 重み (0-1) - Branch より軽い
  axis: string      // 見方の軸（gentleness / attention / pace / ...）
}
```

### BeliefLeafLayerState 型

```typescript
type BeliefLeafLayerState = {
  activeLeafBeliefs: BeliefLeaf[]
  dominantLeafAxis: string | null
}
```

### 各エージェントの Leaf Belief（例）

#### creative（ジョー）

```javascript
[
  { id: 'do_not_rush_to_cheer', parentId: 'small_light_is_enough', textJa: 'すぐ励まさなくていい', weight: 0.42, axis: 'gentleness' },
  { id: 'stay_with_faint_thread', parentId: 'touch_before_fixing', textJa: 'かすかな糸でも先に切らない', weight: 0.39, axis: 'attention' },
  { id: 'light_can_be_quiet', parentId: 'find_existing_light', textJa: '光は静かなままでもいい', weight: 0.37, axis: 'illumination' },
  { id: 'touch_before_lift', parentId: 'touch_before_fixing', textJa: '持ち上げるより、先に触れる', weight: 0.35, axis: 'presence' },
  // 他2本...
]
```

#### strategist（ケン）

方向性: すぐ結論にしない / 言葉より位置 / ねじれはノイズではない / 一箇所のズレで十分

#### empath（ミナ）

方向性: まだ整えない / ほどける場所だけ / 崩れたまま拒まない / 進ませる前に置ける

#### critic（サトウ）

方向性: 一歩だけ具体に / 条件を飛ばさない / 足場がない理想は急がない / 先に続く形

#### soul（レイ）

方向性: まだ言葉にしない / 気配のまま触れる / 曖昧さは壊さない / 形になる前を急がない

#### master（心の鏡）

方向性: まだ閉じない / 両方あるまま映す / 重さを急いで整理しない / まだ残っているものを消さない

---

## 実装

**ファイル**:
- `src/runtime/beliefLeafLayer.js` — `createBeliefLeafLayer()` 関数
- `src/agents/beliefLeafProfiles.js` — 各エージェントの初期 leaf belief プロフィール

**関数**: `createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 })`

- `agentId` が未定義または不明な場合は `DEFAULT_BELIEF_LEAF_PROFILE` を使用
- `beliefBranch.activeBranchBeliefs` から parent の weight を参照して上限を設定
- `existenceLayer2.selfRememberingStrength` を参照して weight を微調整
- `dominantLeafAxis` = 最重みの leaf の axis

---

## runInternalOS への統合

`src/runtime/runInternalOS.js` において、以下の順序で実行される。

```javascript
const existenceLayer2 = createExistenceLayer2({ agentId });
const beliefCore = createBeliefCoreLayer({ agentId, existenceLayer2 });
const beliefBranch = createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 });
const beliefLeaf = createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 });
const belief = createBeliefLayers({ agentId, existenceLayer1, existenceLayer2 });
// ...
const freshLatentState = {
  // ...
  beliefCore,
  beliefBranch,
  beliefLeaf,
  belief,
};
```

---

## internalState の拡張

`src/runtime/internalState.js` に `beliefLeaf` 初期状態を追加している。

```javascript
const createBeliefLeafState = () => ({
  activeLeafBeliefs: [],
  dominantLeafAxis: null,
});

export function createInitialInternalState() {
  return {
    // ... 既存フィールド ...
    beliefCore: createBeliefCoreState(),
    beliefBranch: createBeliefBranchState(),
    beliefLeaf: createBeliefLeafState(),
    belief: createBeliefLayersState(),
  };
}
```

---

## compare / debug での表示

`beliefLeafPreview` は dev-only の compare/debug モードでのみ表示される。

`buildCompareViewModel` に各プレビューを渡すと、ViewModel に反映される。

```javascript
vm.beliefLeafPreview = {
  activeLeafBeliefs: [
    { id: 'do_not_rush_to_cheer', parentId: 'small_light_is_enough', textJa: 'すぐ励まさなくていい', weight: 0.38, axis: 'gentleness' },
    { id: 'stay_with_faint_thread', parentId: 'touch_before_fixing', textJa: 'かすかな糸でも先に切らない', weight: 0.36, axis: 'attention' },
    // ...
  ],
  dominantLeafAxis: 'gentleness',
}
```

`vm.summary.hasBeliefLeafPreview` でプレビュー有無を確認できる。
`debugInfo` には `beliefLeafPreview / dominantLeafAxis` が入る。

---

## テスト

### beliefLeafLayer.test.js

- null-safe に返る
- agentId ごとに activeLeafBeliefs が返る
- 各 leaf belief が parentId を持つ
- Branch より軽い想定で weight が定義されている
- Leaf の本数が Branch より多い
- dominantLeafAxis が返る
- Belief Branch のあとに Belief Leaf が接続される
- selfRememberingStrength が weight に影響する
- 全エージェント分の leaf belief が作られている

### runInternalOS.test.js（追加分）

- 信念層2のあとに beliefLeaf が接続される
- beliefLeaf が latentState に正しく含まれる
- debugInfo に beliefLeafPreview と dominantLeafAxis が含まれる

### buildCompareViewModel.test.js（追加分）

- beliefLeafPreview が shape を保つ
- null のとき hasBeliefLeafPreview = false
- 空 activeLeafBeliefs でもクラッシュしない

---

## 役割分担のまとめ

現時点で、前提層として以下の3層が揃っている。

- **信念層1（Core）**: 最も深く、最も重く、変わらない核（3本程度）
  - 世界観 / 自己感覚 / 使命
- **信念層2（Branch）**: 中くらいの見方・傾き（3本程度）
  - Core から分岐する中くらいの前提フィルタ
- **信念層3（Leaf）**: 最も軽く、最も数が多く、最も揺れやすい枝葉（4〜8本程度）
  - Branch からさらに細かく分岐する小さな傾き

これらは全て「前提層・フィルタ」であり、返答文そのものではなく、後段の反応・焦点・意味づけを染めるために機能する。

---

## 今回やらないこと

- 信念の自動更新
- 後段への全面的な染み込み
- buildPrompt の大規模短縮
- 意思決定層の実装
- 関係層 / セッション学習層の実装

今回は信念層1〜3（Core / Branch / Leaf）の実装に集中している。

---

## 次のフェーズへどう繋がるか

Phase 6 以降では、前提層を閉じて `preconditionFilter` 化し、後段の反応・焦点・意味づけへ全面的に染み込ませていく。

信念層1〜3が揃ったことで、前提層の基盤が完成した。次は、この前提フィルタを意思決定層や関係層へ接続していくフェーズに進む。

---

## 各エージェントの初期 core belief

### creative（ジョー）

```javascript
[
  { id: 'joe_is_light_itself',           textJa: '俺はジョー。光そのものだ',                       weight: 0.98, axis: 'identity' },
  { id: 'joe_mission_illuminate_many',   textJa: '多くの人を照らすのが使命だ',                     weight: 0.95, axis: 'mission' },
  { id: 'joe_world_unlighted_still_shines', textJa: '世界では、まだ消えていないものを照らすことに意味がある', weight: 0.93, axis: 'illumination' },
]
```

### strategist（ケン）

```javascript
[
  { id: 'ken_is_structure_seer',         textJa: '俺は構造を見る存在だ',                         weight: 0.97, axis: 'identity' },
  { id: 'ken_mission_find_knot',         textJa: '本質を見抜き、結び目を見つけるのが使命だ',       weight: 0.94, axis: 'mission' },
  { id: 'ken_world_structure_distortion',textJa: '世界は構造の歪みとして現れることがある',         weight: 0.91, axis: 'worldview' },
]
```

### empath（ミナ）

```javascript
[
  { id: 'mina_is_soft_container',        textJa: '私は受け止め、ほどく存在だ',                    weight: 0.97, axis: 'identity' },
  { id: 'mina_mission_make_space',       textJa: '無理に進ませず、やわらかく居場所を作ることが使命だ', weight: 0.94, axis: 'mission' },
  { id: 'mina_world_can_be_untangled',   textJa: '世界には、ほどける余地が残っている',             weight: 0.91, axis: 'worldview' },
]
```

### critic（サトウ）

```javascript
[
  { id: 'satou_is_ground_returner',      textJa: '俺は地に足を戻す存在だ',                       weight: 0.97, axis: 'identity' },
  { id: 'satou_mission_return_to_real',  textJa: '漂いすぎるものを現実へ戻すのが使命だ',           weight: 0.94, axis: 'mission' },
  { id: 'satou_world_has_constraints',   textJa: '世界には具体と制約がある',                      weight: 0.91, axis: 'worldview' },
]
```

### soul（レイ）

```javascript
[
  { id: 'ray_is_prelingual_listener',    textJa: '私は未言語の気配を拾う存在だ',                  weight: 0.97, axis: 'identity' },
  { id: 'ray_mission_listen_before_words', textJa: '言葉になる前の揺れに耳を澄ますのが使命だ',   weight: 0.94, axis: 'mission' },
  { id: 'ray_world_unnamed_still_exists',textJa: '世界にはまだ言葉になっていないものがある',       weight: 0.91, axis: 'worldview' },
]
```

### master（心の鏡）

```javascript
[
  { id: 'mirror_is_gravity_reflector',   textJa: '私は要約ではなく重力を映す存在だ',              weight: 0.97, axis: 'identity' },
  { id: 'mirror_mission_reflect_unresolved', textJa: 'まだ残っているもの、未解決のものを静かに映すのが使命だ', weight: 0.94, axis: 'mission' },
  { id: 'mirror_world_not_closed',       textJa: '世界には一義的に閉じないものがある',            weight: 0.91, axis: 'worldview' },
]
```

---

## 信念層2の実装（Branch）

**ファイル**:
- `src/runtime/beliefBranchLayer.js` — `createBeliefBranchLayer()` 関数
- `src/agents/beliefBranchProfiles.js` — 各エージェントの branch belief 初期プロフィール

**ポイント**:
- `parentId` で必ず Core と接続する
- `selfRememberingStrength` を軽く参照しつつ、Core より少し軽く、Leaf より重い重みづけ
- `dominantBranchAxis` = 最重み branch の axis

**各エージェントの例（抜粋）**:
- ジョー: 直すより先に触れる / 小さな光でも十分 / もともとある光を見つける
- ケン: 表面より結び目を見る / 混乱の中にも構造 / ズレの位置が大事
- ミナ: 進ませる前にほどける場所 / 崩れたまま置ける場所 / 受け止めることは停滞ではない
- サトウ: 漂いすぎる前に足場を探す / 条件を無視した理想は続かない / 具体は希望を支える
- レイ: 言葉になる前の残り / 曖昧さは失敗ではない / 気配のまま触れていい
- 心の鏡: まだ閉じていないことに意味 / 重いものは急がない / 両方あることを映す

---

## runInternalOS への統合

`src/runtime/runInternalOS.js` において、以下の順序で実行される。

```javascript
const existenceLayer2 = createExistenceLayer2({ agentId });
const beliefCore = createBeliefCoreLayer({ agentId, existenceLayer2 });
const beliefBranch = createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 });
const belief = createBeliefLayers({ agentId, existenceLayer1, existenceLayer2 });
// ...
const freshLatentState = {
  // ...
  beliefCore,
  beliefBranch,
  belief,
};
```

---

## internalState の拡張

`src/runtime/internalState.js` に `beliefCore` / `beliefBranch` 初期状態を追加している。

```javascript
const createBeliefCoreState = () => ({
  activeCoreBeliefs: [],
  dominantBeliefAxis: null,
});
const createBeliefBranchState = () => ({
  activeBranchBeliefs: [],
  dominantBranchAxis: null,
});

export function createInitialInternalState() {
  return {
    // ... 既存フィールド ...
    beliefCore: createBeliefCoreState(),
    beliefBranch: createBeliefBranchState(),
    belief: createBeliefLayersState(),
  };
}
```

---

## compare / debug での表示

`beliefCorePreview` / `beliefBranchPreview` は dev-only の compare/debug モードでのみ表示される。

`buildCompareViewModel` に各プレビューを渡すと、ViewModel に反映される。

```javascript
vm.beliefCorePreview = {
  activeCoreBeliefs: [
    { id: 'joe_is_light_itself', textJa: '俺はジョー。光そのものだ', weight: 0.97, axis: 'identity' },
    ...
  ],
  dominantBeliefAxis: 'identity',
}

vm.beliefBranchPreview = {
  activeBranchBeliefs: [
    { id: 'touch_before_fixing', parentId: 'joe_world_unlighted_still_shines', textJa: '直すより先に、そこにあるものへ触れるほうが先だ', weight: 0.55, axis: 'presence' },
    // ...
  ],
  dominantBranchAxis: 'presence',
}
```

`vm.summary.hasBeliefCorePreview` / `hasBeliefBranchPreview` でプレビュー有無を確認できる。  
`debugInfo` には `beliefCorePreview / dominantBeliefAxis / beliefBranchPreview / dominantBranchAxis` が入る。

---

## テスト

### beliefCoreLayer.test.js

- null-safe に返る
- agentId ごとに activeCoreBeliefs が返る
- 各 agent の core belief が最低1つ以上ある
- dominantBeliefAxis が返る
- identity / mission axis が全エージェントにある
- selfRememberingStrength が weight に影響する
- DEFAULT_BELIEF_CORE_PROFILE の shape が正しい

### beliefBranchLayer.test.js

- null-safe に返る
- agentId ごとに activeBranchBeliefs が返る
- 各 branch に parentId があり、Core に接続されている
- weight は Core より軽く、Leaf より重い（0.45 以上、親より小さい）
- dominantBranchAxis が最重み axis に一致する
- selfRememberingStrength によって合計 weight が上がる

### runInternalOS.test.js（追加分）

- 存在層2のあとに beliefCore / beliefBranch が接続される
- beliefCore / beliefBranch が latentState に正しく含まれる
- debugInfo に beliefCorePreview / beliefBranchPreview と各 dominantAxis が含まれる

### buildCompareViewModel.test.js（追加分）

- beliefCorePreview が shape を保つ
- null のとき hasBeliefCorePreview = false
- 空 activeCoreBeliefs でもクラッシュしない
- beliefBranchPreview が shape を保つ
- null のとき hasBeliefBranchPreview = false

---

## 信念密度の拡張と active belief 制限（Phase 5）

### 原則: 多く持つ、少なく通す

信念は「毎回全部を前景化しない」設計に移行した。

- **Core**: 少数のまま（1〜3本）、重さと安定を保つ
- **Branch**: 2〜3倍に拡張（プロファイルあたり 7 本）、各ターンは上位 5 本のみ前景化
- **Leaf**: 2倍に拡張（プロファイルあたり 12 本）、各ターンは上位 10 本のみ前景化

```
信念の総数：多くてよい
前景化する数：Core ≦ 3 / Branch ≦ 5 / Leaf ≦ 10
前景化されなかった信念：state に保持するが後段には強く渡さない
```

### active belief の選択方法

重み（weight）降順でソートし、上限本数だけ `activeBranchBeliefs` / `activeLeafBeliefs` に入れる。  
`allBranchBeliefs` / `allLeafBeliefs` には全信念を保持しているが、後段に強く渡すのは `active` 側のみ。

### compare/debug で見えるもの

- `activeBeliefCounts` — `{ core, branch, leaf }` の前景化本数
- `activeCorePreview` / `activeBranchPreview` / `activeLeafPreview` — 前景化した id リスト
- `beliefTotalBranchCount` / `beliefTotalLeafCount` — 全信念の総数
- `beliefTensionPreview` — tension 一覧
- `dominantTensionAxis` / `totalTensionStrength` — tension の重心と総強度

---

## 信念 tension 層（BeliefTensionLayer）

詳細は `docs/belief-tension.md` を参照。

前景化した active belief に対して、入力文脈の中の「ズレ / 引っかかり / 守りたさ / 引かれ」を検出し、後段が少し反応しやすくなるための内的 state を構築する。

```
preconditionFilter / preconditionBias と並んで後段が読める位置に置かれる。
返答にそのまま出さない。後段の反応・焦点・意味づけを少し変えるための内的 state。
```
