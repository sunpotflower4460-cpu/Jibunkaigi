# Reservoir - 顕在層 v0.1

## 概要

Reservoir は、顕在層（Surface Layer）v0.1 の第2段階として実装された、thought / feeling / move 粒子を保持する情報層です。

**重要な原則:**

1. **完成文を置かない** - ここに置くのは返答文ではなく、思考の種（particle/seed）です
2. **粒子は「思考の種」** - 何に目が行くか、何を守りたいか、何をまだ閉じたくないか
3. **shared と agent別の二段構造** - 共通の reservoir と各エージェント専用の reservoir
4. **anti-triggers を最初から含む** - activate 段階で使用される抑制条件

## 実装状況

### Phase 0 (現在)

- ✅ 型定義（ThoughtNode, FeelingNode, MoveNode, NodeRelation）
- ✅ ファイル構成（shared, agents, relations）
- ✅ Loader 関数（getThoughtReservoir など）
- ✅ compare/debug サポート（reservoir stats）
- ✅ 最小初期セット（thought 粒子のみ、約10個）
- ⏸️ feeling / move は placeholder のみ（今後実装）

### 今後の段階

- Phase 1: activate の本実装（trigger/antiTrigger による活性化）
- Phase 2: bind の本実装（NodeRelation を使った結合）
- Phase 3: select の本実装（最終的な粒子選択）

## ディレクトリ構成

```
src/reservoir/
  types.js                    # 型定義
  loadReservoir.js            # Loader 関数
  loadReservoir.test.js       # テスト
  shared/
    thoughtNodes.js           # 共通 thought 粒子
    feelingNodes.js           # 共通 feeling 粒子（Phase 0: 空）
    moveNodes.js              # 共通 move 粒子（Phase 0: 空）
  agents/
    joe/
      thoughtNodes.js         # ジョー専用 thought 粒子
      feelingNodes.js         # （Phase 0: 空）
      moveNodes.js            # （Phase 0: 空）
    mina/...
    ray/...
    ken/...
    satou/...
    mirror/...
  relations/
    sharedRelations.js        # 共通 relation（Phase 0: 空）
    agentRelations.js         # agent別 relation（Phase 0: 空）
```

## 型定義

### NodeOwner

```javascript
type NodeOwner = "shared" | "joe" | "ken" | "mina" | "ray" | "satou" | "mirror"
```

### BaseNode

```javascript
type BaseNode = {
  id: string              // 一意な識別子
  owner: NodeOwner        // 所有者
  textSeed: string        // 種テキスト（完成文ではない）
  tags: string[]          // タグ
  axis: string[]          // 軸（illumination, structure, holding など）
  triggers: string[]      // 活性化条件
  antiTriggers?: string[] // 抑制条件（activate 段階で使用）
  weight: number          // 基本重み（0-1）
  relationIds?: string[]  // 関連する node の ID
}
```

### ThoughtNode / FeelingNode / MoveNode

```javascript
type ThoughtNode = BaseNode & { category: "thought" }
type FeelingNode = BaseNode & { category: "feeling" }
type MoveNode = BaseNode & { category: "move" }
```

### NodeRelation

```javascript
type NodeRelation = {
  id: string
  from: string            // 元 node ID
  to: string              // 先 node ID
  relationType: "supports" | "softens" | "tensions_with" | "grounds" | "extends"
  weight: number          // 関係の強さ（0-1）
}
```

## Loader API

### getSharedThoughtNodes()

共通 thought 粒子を取得

```javascript
const shared = getSharedThoughtNodes();
// => ThoughtNode[]
```

### getAgentThoughtNodes(agentId)

特定エージェントの thought 粒子を取得

```javascript
const joeNodes = getAgentThoughtNodes('joe');
// => ThoughtNode[]
```

### getThoughtReservoir(agentId)

共通 + エージェント専用の thought 粒子をまとめて取得

```javascript
const reservoir = getThoughtReservoir('joe');
// => [...sharedThoughtNodes, ...joeThoughtNodes]
```

### getFeelingReservoir(agentId)

共通 + エージェント専用の feeling 粒子をまとめて取得（Phase 0: 空）

### getMoveReservoir(agentId)

共通 + エージェント専用の move 粒子をまとめて取得（Phase 0: 空）

### getNodeRelations(agentId)

共通 + エージェント関連の relation を取得（Phase 0: 空）

### getReservoirStats(agentId)

Reservoir の統計情報を取得（compare/debug 用）

```javascript
const stats = getReservoirStats('joe');
// => {
//   sharedThoughtCount: 5,
//   agentThoughtCount: 1,
//   totalThoughtCount: 6,
//   sharedFeelingCount: 1,
//   agentFeelingCount: 0,
//   totalFeelingCount: 1,
//   sharedMoveCount: 1,
//   agentMoveCount: 0,
//   totalMoveCount: 1,
//   relationCount: 0
// }
```

## 粒子の書き方

### Good Examples（良い例）

```javascript
{
  id: 'shared-thought-001',
  owner: 'shared',
  category: 'thought',
  textSeed: 'what is not yet said',           // ✅ 種
  tags: ['unsaid', 'holding'],
  axis: ['presence'],
  triggers: ['pause', 'hesitation'],
  antiTriggers: ['rush', 'closure-pressure'],
  weight: 0.7,
}
```

### Bad Examples（悪い例）

```javascript
{
  textSeed: 'それは大丈夫だよ、まだ時間はあるから', // ❌ 完成文
  textSeed: 'こう言えばジョーっぽい',              // ❌ 発話指示
  textSeed: '前向きに返す',                       // ❌ 返答方針
}
```

## anti-triggers の扱い

**重要:** anti-triggers は activate 段階で効きます。

- activate 時にスコアを下げる
- select 段階では基本再評価しない
- 顕在層の繊細な抑制に使う

例:

```javascript
triggers: ['vulnerability', 'fragility'],
antiTriggers: ['dismissal', 'minimization'],
// → vulnerability があれば活性化、dismissal があれば抑制
```

## 既存コードとの境界

### 既存層

- **preconditionBias** → 顕在層への入力
- **decisionLayer** → 後で select 出力を受ける bridge
- **surfaceTranslator** → 最後
- **surfaceGuard** → 最後

### 新規層（reservoir）

- まだ既存 runtime に統合されていない
- 「使える状態の材料置き場」としての位置づけ
- 将来 activate → bind → select が実装されたときに使用される

## compare/debug での確認方法

Compare Mode で reservoir の統計が表示されます:

```
reservoir: sharedThought=5 / joeThought=1
reservoir: sharedFeeling=1 / joeFeeling=0
reservoir: relations=0
```

## USER が次に書くべきもの

### Phase 0 の核粒子（合計20粒子前後）

1. **各エージェントの thought 粒子を 3個ずつ追加**:
   - ジョー: `src/reservoir/agents/joe/thoughtNodes.js`
   - ミナ: `src/reservoir/agents/mina/thoughtNodes.js`
   - レイ: `src/reservoir/agents/ray/thoughtNodes.js`
   - ケン: `src/reservoir/agents/ken/thoughtNodes.js`
   - サトウ: `src/reservoir/agents/satou/thoughtNodes.js`
   - 心の鏡: `src/reservoir/agents/mirror/thoughtNodes.js`

2. **shared thought 粒子を追加**:
   - 現在5個 → さらに追加可能（`src/reservoir/shared/thoughtNodes.js`）

### 今はまだ不要

- feeling を大量に書くこと
- move を大量に書くこと
- relation を全部埋めること

まずは thought の核だけで十分です。

## 参考

- [Internal OS](./internal-os.md) - 共通内部OS
- [Jibunkaigi Roadmap](./jibunkaigi-roadmap.md) - 顕在層の位置づけ
