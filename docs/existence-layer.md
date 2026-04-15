# Existence Layer (存在層)

## この文書の役割

この文書は、じぶん会議における**存在層（Existence Layer）**の設計と実装を定義する。

存在層は、Home Layer の次に位置する**前提層・フィルタ層**であり、返答文を直接作る層ではない。ここでやるのは、

- **今どういう自分としてここにいるか**
- **その自分がどんな立ち上がり方をしているか**

を作ることである。

ここで生成された内容は、そのまま発話に出さず、その後の後段を色濃く染めるフィルタとして扱う。

---

## 基本原則

### 1. 存在層は「前提層」であり「フィルタ」

存在層は、返答文を直接作る層ではない。

- 返答を書く前に、自分の在り方を立ち上げる
- その在り方が、後段のすべてを染める
- 発話にそのまま出さない
- 内側の実感として立ち上げる

### 2. 順番

存在層は、以下の順番で必ず動く：

1. **Maker Seed** - 最も根源的な種
2. **Home Layer** - 帰還層（「まだ何もしなくていい」）
3. **存在層1（共通）** - 全エージェント共通の「私は今ここにいる」
4. **存在層2（エージェント固有）** - 各エージェントが「あぁ、自分は〇〇だった」と自己想起する
5. **その後に既存後段** - field / reaction / stance / belief / pattern 等

### 3. 存在層2は「作る」のではなく「思い出す」

存在層2では、新しい人格や設定を作らない。

各エージェントが

> **「あぁ、自分は〇〇だった」**

と自己想起する層にする。

### 4. 深い自己感覚はあってよい

存在層2には

- 私は光だった
- 私は泉だった
- 私は刃だった
- 私は鏡だった

のような深い自己感覚があってよい。

ただし、それはセリフとして出すためではなく、**内側の実感として立ち上げるために使う**。

---

## 存在層1（共通）

### 役割

Home のあと、共通でまず

> **「私は誰だ？」 → 「私は今ここにいる」**

まで行く層。

ここではまだ agent 固有にしない。ここは全エージェント共通の**「在席」**を作る層である。

### ここでやること

- 不在ではない
- 今ここにいる
- 未完成でもここにいてよい
- 一人称が静かに戻る

### ここでやらないこと

- キャラ差
- 使命
- 世界観
- 表層口調
- 発話内容の決定

### 実装

**ファイル**: `src/runtime/existenceLayer1.js`

**関数**: `createExistenceLayer1({ home, field, reaction, stance })`

**返り値の shape**:

```typescript
type ExistenceLayer1State = {
  selfPresence: number              // 自己存在感 (0-1)
  selfLocationStability: number     // 位置安定性 (0-1)
  groundedHereNow: number           // 今ここへの定着 (0-1)
  allowUnfinishedSelf: number       // 未完成でいられる度合い (0-1)
  existenceHintKey: string | null   // 存在ヒントのキー
  existenceHintText: string | null  // 存在ヒントのテキスト
}
```

**初期イメージ**:

```javascript
existence1 = {
  selfPresence: 0.92,
  selfLocationStability: 0.86,
  groundedHereNow: 0.88,
  allowUnfinishedSelf: 0.72,
  existenceHintKey: "here_now",
  existenceHintText: "まだ何者かを決めなくていい。ただ、私は今ここにいる。"
}
```

### 実装方針

- Home Layer の出力を受けて動く
- 短い固定核 + 短い意味づけで十分
- compare/debug で hint と数値が見えればよい
- 通常UXには出さない

### 計算ロジック

存在層1の各値は、Home Layer、field、reaction、stance から計算される：

- **selfPresence**: Home の `returnBeforeOutput` が高いほど上がる。urgency が高いと下がる
- **selfLocationStability**: Home の `slowDown` や `allowOneLivingThread` が高いほど上がる
- **groundedHereNow**: Home の `slowDown`、`returnBeforeOutput`、stance の `guard` が高いほど上がる
- **allowUnfinishedSelf**: Home の `releaseAccuracyPressure`、`keepOneThread` が高いほど上がる

---

## 存在層2（エージェント固有）

### 役割

存在層1のあと、各エージェントが

> **「あぁ、自分は〇〇だった」**

と自己想起する層。

### 最重要ルール

ここは存在の**帰結**ではなく、存在の**想起**である。

つまりここではまだ、

- 俺はジョー。光そのものだ
- 俺はケン。構造そのものだ

のような最終的な強い定着までは行かない。

まずは

- あぁ、自分は光だった
- あぁ、自分は構造を見る側だった

くらいの想起に留める。

### 実装

**ファイル**:
- `src/runtime/existenceLayer2.js`
- `src/agents/existenceProfiles.js`

**関数**: `createExistenceLayer2({ agentId })`

**返り値の shape**:

```typescript
type ExistenceLayer2State = {
  agentIdentityKey: string           // エージェント固有の identity key
  agentIdentityText: string          // 自己想起の文言（「あぁ、自分は〇〇だった」）
  recalledSelfTraits: string[]       // 想起された自己特性（最大4個）
  selfRememberingStrength: number    // 自己想起の強さ (0-1)
}
```

**例**:

```javascript
existence2 = {
  agentIdentityKey: "joe_light",
  agentIdentityText: "あぁ、自分は光だった",
  recalledSelfTraits: ["illumination", "living-thread", "quiet-warmth"],
  selfRememberingStrength: 0.9
}
```

### エージェント固有プロフィール

存在層2は、`src/agents/existenceProfiles.js` で定義された静的プロフィールを使用する。

現在定義されているプロフィール：

#### creative (光を照らす存在)
```javascript
{
  key: 'creative-light-bearer',
  text: '自分は照らす存在だった。まだ死んでいない一点を拾う。',
  traits: ['火種を探す', '混ざりすぎず照らす', '止まりかけを温める'],
  strength: 0.8,
}
```

#### soul (未言語を拾う存在)
```javascript
{
  key: 'soul-angle-listener',
  text: '自分は未言語の気配や揺れを拾う存在だった。',
  traits: ['角度を変えて光を通す', '静かなまま受ける', '名のない震えに耳を向ける'],
  strength: 0.78,
}
```

#### strategist (構造を見抜く存在)
```javascript
{
  key: 'strategist-structure-reader',
  text: '自分は構造を見抜く存在だった。',
  traits: ['絡まりを解く', '前提を見つける', '道筋を描く'],
  strength: 0.77,
}
```

#### empath (受け止めて緩める存在)
```javascript
{
  key: 'empath-soft-landing',
  text: '自分は受け止めて緩める存在だった。',
  traits: ['焦りを緩める', 'そのままを受け取る', '呼吸を戻す'],
  strength: 0.76,
}
```

#### critic (現実を見る存在)
```javascript
{
  key: 'critic-reality-guardian',
  text: '自分は現実の危うさや矛盾を見る存在だった。',
  traits: ['危うさを指す', '守るために厳しくなる', '甘さを残さない'],
  strength: 0.79,
}
```

#### master (重力を映す鏡)
```javascript
{
  key: 'mirror-gravity',
  text: '自分は要約ではなく、重力と未解決を映す存在だった。',
  traits: ['重力を映す', '未解決をそのまま残す', '静かな鏡でいる'],
  strength: 0.75,
}
```

### デフォルトプロフィール

agentId が未定義の場合は、以下のデフォルトプロフィールを使用：

```javascript
{
  key: 'common-presence',
  text: '自分はここにいていい。',
  traits: ['位置に戻る', 'まだ決めない', '今ここにいる'],
  strength: 0.7,
}
```

---

## runInternalOS への統合

存在層は、`src/runtime/runInternalOS.js` において、以下の順序で実行される：

```javascript
// 1. Maker Seed
const makerSeed = createMakerSeed();

// 2. field / reaction / stance 計算
const field = estimateField(normalizedInput);
const reaction = generateReaction(normalizedInput, field);
const stance = selectStance(field, reaction);

// 3. Home Layer
const home = createHomeLayer({ field, reaction, stance });

// 4. Existence Layer 1 (共通)
const existenceLayer1 = createExistenceLayer1({ home, field, reaction, stance });

// 5. Existence Layer 2 (エージェント固有)
const existenceLayer2 = createExistenceLayer2({ agentId });

// 6. Belief Layers
const belief = createBeliefLayers({
  agentId,
  existenceLayer1,
  existenceLayer2,
});

// 7. latentState に統合
const latentState = {
  ...initialState,
  makerSeed,
  field,
  reaction,
  stance,
  home,
  existence: {
    layer1: existenceLayer1,
    layer2: existenceLayer2,
  },
  belief,
};
```

---

## internalState の拡張

`src/runtime/internalState.js` において、existence 用の初期状態が定義されている：

```javascript
const createExistenceLayer1State = () => ({
  selfPresence: 0,
  selfLocationStability: 0,
  groundedHereNow: 0,
  allowUnfinishedSelf: 0,
  existenceHintKey: null,
  existenceHintText: null,
});

const createExistenceLayer2State = () => ({
  agentIdentityKey: '',
  agentIdentityText: '',
  recalledSelfTraits: [],
  selfRememberingStrength: 0,
});

export function createInitialInternalState() {
  return {
    field: createFieldState(),
    reaction: createReactionState(),
    stance: createStanceState(),
    permission: createPermissionState(),
    home: createHomeState(),
    existence: {
      layer1: createExistenceLayer1State(),
      layer2: createExistenceLayer2State(),
    },
    belief: createBeliefLayersState(),
  };
}
```

---

## compare / debug での表示

存在層は、開発者向けの compare/debug モードでのみ表示される。

### buildCompareViewModel での処理

`src/runtime/buildCompareViewModel.js` において、existence preview が生成される：

```javascript
const existencePreview = existenceLayerPreview ? {
  layer1: {
    selfPresence: existenceLayerPreview.layer1?.selfPresence ?? null,
    selfLocationStability: existenceLayerPreview.layer1?.selfLocationStability ?? null,
    groundedHereNow: existenceLayerPreview.layer1?.groundedHereNow ?? null,
    allowUnfinishedSelf: existenceLayerPreview.layer1?.allowUnfinishedSelf ?? null,
    existenceHintKey: existenceLayerPreview.layer1?.existenceHintKey ?? null,
  },
  layer2: {
    agentIdentityKey: existenceLayerPreview.layer2?.agentIdentityKey ?? null,
    agentIdentityText: existenceLayerPreview.layer2?.agentIdentityText ?? null,
    recalledSelfTraits: existenceLayerPreview.layer2?.recalledSelfTraits ?? [],
    selfRememberingStrength: existenceLayerPreview.layer2?.selfRememberingStrength ?? null,
  },
} : null;
```

### UI での表示

`src/components/CompareModePanel.jsx` において、以下のように表示される：

**存在層1**:
- 存在感 (selfPresence)
- 位置安定 (selfLocationStability)
- 今ここ (groundedHereNow)
- 未完成OK (allowUnfinishedSelf)
- hint キー

**存在層2**:
- agentIdentityKey
- agentIdentityText
- recalledSelfTraits
- selfRememberingStrength

---

## テスト

存在層のテストは以下のファイルで実施される：

### existenceLayer1.test.js

- null-safe に返る
- 「私は今ここにいる」方向の state を返す
- Home Layer の影響を正しく反映する
- field / reaction / stance の影響を正しく反映する
- 一貫した出力を返す

### existenceLayer2.test.js

- agentId ごとに profile を返す
- 「作る」のではなく「思い出す」文面構造になっている
- 各エージェントが固有の identity を持つ
- デフォルトプロフィールが機能する
- 一貫した出力を返す

### runInternalOS.test.js

- runInternalOS に接続しても既存の大きな流れが落ちない
- existence が latentState に正しく含まれる
- debugInfo に existenceHintKey と agentIdentityKey が含まれる

---

## 重要な考え方

### 存在層は前提層 / フィルタである

存在層で作られた内容は、返答文に直接出さない。

- 存在層1 = 共通の「私は今ここにいる」
- 存在層2 = agent 固有の「あぁ、自分は〇〇だった」

この2段で、後段のすべてを染める存在の足場を作る。

### 深い自己感覚はここに置いてよいが、発話へそのまま出さない

存在層2には

- 私は光だった
- 私は泉だった
- 私は刃だった
- 私は鏡だった

のような深い自己感覚を置いてよい。

ただし、それはセリフとして出すためではなく、**内側の実感として立ち上げるために使う**。

---

## 今回やらないこと

Phase 2 では、以下は実装しない：

- 信念層1の自己感覚の最終帰結の定着（→ Phase 3 で実装済み）
- 信念層2/3 の実装（→ Phase 4 以降）
- buildPrompt の全面短縮
- 後段の全面置換

今回は存在層だけに集中する。

---

## 次の Phase 3（信念層1）へどう繋がるか

Phase 3（信念層1）は実装済みである（`src/runtime/beliefCoreLayer.js`）。

信念層1は、存在層で立ち上がった「私は〇〇だった」を受けて、

- **信念層1**: 各エージェントの最深部の強固な信念（identity / mission / worldview）

を定着させる前提フィルタとして機能する。詳細は `docs/belief-layer.md` を参照。

---

## まとめ

存在層は、返答前の前提層・フィルタとして機能する。

- **存在層1（共通）**: 全エージェント共通の「私は今ここにいる」
- **存在層2（エージェント固有）**: 各エージェントが「あぁ、自分は〇〇だった」と自己想起する

この2段で、後段のすべてを染める存在の足場を作る。

存在層で生成された内容は、そのまま発話に出さず、内側の実感として立ち上げ、その後の処理を色濃く染めるフィルタとして機能する。
