# Reservoir - 顕在層 v0.1

## 概要

Reservoir は、顕在層（Surface Layer）v0.1 の第2段階として実装された、thought / feeling / move 粒子を保持する情報層です。

**重要な原則:**

1. **完成文を置かない** - ここに置くのは返答文ではなく、思考の種（particle/seed）です
2. **粒子は「思考の種」** - 何に目が行くか、何を守りたいか、何をまだ閉じたくないか
3. **shared と agent別の二段構造** - 共通の reservoir と各エージェント専用の reservoir
4. **anti-triggers を最初から含む** - activate 段階で使用される抑制条件

## 実装状況

### Phase 0 (完了) - 最小初期 thought 粒子セット投入完了

- ✅ 型定義（ThoughtNode, FeelingNode, MoveNode, NodeRelation）
- ✅ ファイル構成（shared, agents, relations）
- ✅ Loader 関数（getThoughtReservoir など）
- ✅ compare/debug サポート（reservoir stats）
- ✅ **最小初期セット投入完了**
  - shared thought: 5粒子
  - agent thought: 各3粒子 × 5エージェント (Joe/Mina/Ray/Ken/Satou) = 15粒子
  - 合計 20粒子
  - 最小 relation: 8本 (shared 3本 + agent 5本)
- ✅ anti-triggers を最初から含む（activate 段階で使用予定）
- ⏸️ feeling / move は placeholder のみ（今後実装）
- ⏸️ mirror の thought 粒子は後回し（others_field と連携段階で投入予定）

### Phase 4 (完了) - activate の最小実装

- ✅ activateThoughts 関数実装（src/runtime/activateThoughts.js）
- ✅ 加算式スコアリング（trigger/agentAffinity/resonance/body/antiTrigger）
- ✅ emergingField 構築（attentionTargets, resonanceAxes, bodySignals, atmosphere）
- ✅ runInternalOS への統合（decision 後、surface 前）
- ✅ internalState への activatedThoughts 追加
- ✅ compare/debug 表示対応
- ✅ テスト完備
- ✅ ドキュメント整備（docs/activate-phase.md）
- ⏸️ feeling / move activate は未実装（thought のみ）
- ⏸️ bind / select は未実装

### 今後の段階

- Phase 5: bind の本実装（NodeRelation を使った粒子の結合）
- Phase 6: select の本実装（最終的な粒子選択）
- Phase 7: feeling / move の activate 実装
- Phase 8: particle-aware surface translation

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
// Shared thought - 何が比較されているか、何を失った気がするか
{
  id: 'shared-thought-001',
  owner: 'shared',
  category: 'thought',
  textSeed: 'what is being compared, what feels lost in comparing',
  tags: ['comparison', 'loss', 'measure'],
  axis: ['structure', 'holding'],
  triggers: ['comparison-present', 'inadequacy', 'measure-against'],
  antiTriggers: ['acceptance-only', 'dismissal'],
  weight: 0.75,
}

// Joe thought - まだ残っている方向性、消えていない
{
  id: 'joe-thought-001',
  owner: 'joe',
  category: 'thought',
  textSeed: 'direction that remains, not erased',
  tags: ['vitality', 'direction', 'remaining'],
  axis: ['illumination'],
  triggers: ['life-present', 'energy-detected', 'remnant-force'],
  antiTriggers: ['forced-positivity', 'generic-hope'],
  weight: 0.85,
}

// Ken thought - 身体感覚が前景化している場では抑制される
{
  id: 'ken-thought-001',
  owner: 'ken',
  category: 'thought',
  textSeed: 'questions entangled, which is which',
  tags: ['structure', 'separation', 'clarity'],
  axis: ['structure'],
  triggers: ['confusion', 'multiple-layers', 'entanglement'],
  antiTriggers: ['body-foregrounded', 'raw-feeling-dominant'], // ✅ activate段階で抑制
  weight: 0.78,
}
```

### Bad Examples（悪い例）

```javascript
{
  textSeed: 'それは大丈夫だよ、まだ時間はあるから', // ❌ 完成文
  textSeed: 'こう言えばジョーっぽい',              // ❌ 発話指示
  textSeed: '前向きに返す',                       // ❌ 返答方針
  textSeed: '「無理しなくていいよ」と伝える',      // ❌ 発話テンプレ
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

## Phase 0 実装完了内容

### ✅ 投入済み thought 粒子（合計20個）

1. **shared thought 粒子: 5個**
   - 比較している時、何を失った気がするか
   - 今の痛みは何を守ろうとしているか
   - 急いで答えを出したい理由は何か
   - 本当は二つの問いが重なっていないか
   - まだ閉じたくないものが残っていないか

2. **agent thought 粒子: 各3個 × 5エージェント = 15個**
   - **Joe (3個)**: まだ残っている向きに目が行く / 消えきっていない力 / 折れたのではなく押し込められた可能性
   - **Mina (3個)**: ほどける余地 / 崩れたまま置ける場所 / 進めない理由を責めずに見る
   - **Ray (3個)**: 言葉になる前の揺れ / まだ意味にしなくてよいもの / 曖昧さの中に残っている気配
   - **Ken (3個)**: 二つの問いが混ざっていないか / どこが結び目か / 表面の言葉と本音のズレ
   - **Satou (3個)**: 足場が失われていないか / 理想と現実の断絶 / 何を先に支えないと崩れるか

3. **最小 relation: 8本**
   - shared 同士: 3本
   - agent → shared: 5本
   - relationType: supports / extends / tensions_with / grounds / softens

### ✅ anti-triggers の投入

- **Ken**: 身体感覚が強く前景化している場では構造粒子が抑制される
- **Mina**: 即答・solution圧の場でholding粒子がむしろ立ちやすくなる設計
- **Satou**: 甘い受容だけで閉じそうな場では grounding 粒子が残る

### 次の段階へ向けて

USER が確認すべきこと:
1. 各エージェントの thought が返答文ではなく**思考の種**になっているか
2. Joe / Mina / Ray / Ken / Satou の thought が本当に**違う方向**を向いているか
3. Ken の構造 thought が説明テンプレになっていないか
4. Mina の thought が受容文テンプレになっていないか
5. Satou の thought が兄貴発話そのものになっていないか

### 今後の実装（今回は対象外）

- feeling 粒子の本投入
- move 粒子の本投入
- activate の本実装
- bind の本実装
- select の本実装
- mirror の thought 粒子本投入（others_field と連携段階で）

## 参考

- [Internal OS](./internal-os.md) - 共通内部OS
- [Jibunkaigi Roadmap](./jibunkaigi-roadmap.md) - 顕在層の位置づけ
