# Text Pipeline Module

**Phase P-6: 身体感覚分離・テキストパイプライン独立化**

テキストパイプラインは、runInternalOS が計算した latentState から、設計用語を含まない日本語の情景描写を生成する独立モジュールです。

## 設計原則

1. **数値パイプライン非依存**: runInternalOS を呼ばず、latentState の不変スナップショットのみを入力とする
2. **ゼロ設計用語**: 出力テキストに英語キー・内部用語・数値を一切含まない
3. **テスト可能性**: モック latentState で全関数を独立テスト可能
4. **入出力契約の明示**: types.d.ts で全ての入出力を定義

## モジュール構成

```
src/runtime/textPipeline/
├── types.d.ts                  # 入出力契約の型定義
├── buildBodySignals.js         # bodySignals の external/internal 分離計算
├── buildFieldText.js           # field / stance / body の情景描写生成
├── buildExistenceText.js       # 存在層からの描写生成
├── buildMarginText.js          # 余白（何をしないか）の描写生成
├── axisDescriptions.js         # 信念軸・緊張軸・stance の描写テーブル
└── tests/
    ├── buildBodySignals.test.js
    ├── buildFieldText.test.js
    ├── buildExistenceText.test.js
    └── buildMarginText.test.js
```

## 関数ツリー

### buildBodySignals(latentState)
- **入力**: `{ field, beliefTension, previousLatentState }`
- **出力**: `{ external, internal }`
- **役割**: 身体感覚を外界由来（field）と内面由来（beliefTension, stance.guard, reaction.holdBackJudgment）に分離計算

**external**: 場がどう感じられるか
- tension: field.urgency × 0.7 + field.fragility × 0.3
- softness: field.softness
- hesitation: field.fragility × 0.6 + (1 - field.urgency) × 0.4
- urgency: field.urgency
- warmth: field.softness × 0.5 + field.playfulness × 0.3
- contraction: field.fragility × 0.5 + (1 - field.playfulness) × 0.3

**internal**: 内側でどう感じているか
- tension: beliefTension.totalTensionStrength × 0.8 + stance.guard × 0.2
- hesitation: reaction.holdBackJudgment × 0.7 + beliefTension.totalTensionStrength × 0.2
- contraction: stance.guard × 0.6 + beliefTension.totalTensionStrength × 0.3

### buildFieldText(latentState)
- **入力**: `{ field, stance, beliefCore, bodySignals }`
- **出力**: `string` (情景描写)
- **役割**: 場の空気を日本語で描写

**ズレ検出（第6章6-2）**:
- 外穏やか + 内張り: 「場は穏やかだが、内側に緊張が残っている。」
- 外緊張 + 内静か: 「場には緊張があるが、内側は比較的落ち着いている。」
- 一致: 主要状態のみ1行で表現

**出力例**:
```
場が、壊れやすい。空気がやわらかい。
まず受ける。
場は穏やかだが、内側に緊張が残っている。
```

### buildExistenceText(latentState)
- **入力**: `{ existence2, beliefCore }`
- **出力**: `string` (存在の前提)
- **役割**: エージェントの「感じる自分」を描写

**出力例**:
```
自分は観察する人
静かに見る。言葉を選ぶ。
光が届かない場所に目が向く
```

### buildMarginText(latentState)
- **入力**: `{ consciousIntent, permission }`
- **出力**: `string` (余白の描写)
- **役割**: 「何をしないか」を描写

**出力例**:
```
答えを先に出さない
急がない。
説明しすぎない。
曖昧さを少し残していい。
```

## エージェント固有の描写追加方法

1. エージェント固有の axisDescriptions を `src/agents/{name}/axisDescriptions.js` に作成
2. textPipeline 関数を呼ぶ前に、エージェント固有の軸を beliefCore.dominantBeliefAxis に設定
3. axisDescriptions.js の AXIS_DESCRIPTIONS に追加する形で拡張

**例**:
```javascript
// src/agents/joe/axisDescriptions.js
export const JOE_AXIS_DESCRIPTIONS = {
  'joe-specific-axis': {
    feeling: 'Joe固有の感覚',
    atmosphere: 'Joe固有の雰囲気',
    bodyState: 'Joe固有の身体状態',
  },
};

// buildFieldText を呼ぶ前に統合
import { AXIS_DESCRIPTIONS } from './textPipeline/axisDescriptions.js';
import { JOE_AXIS_DESCRIPTIONS } from './agents/joe/axisDescriptions.js';

const mergedDescriptions = { ...AXIS_DESCRIPTIONS, ...JOE_AXIS_DESCRIPTIONS };
```

## テスト方針

### ユニットテスト
- 全ての textPipeline 関数はモック latentState で独立テスト可能
- runInternalOS を一切呼ばない
- スナップショットテストで出力の一貫性を保証

### テストケース
- **buildBodySignals**:
  - 外界穏やか + 内面張り: ズレパターン1
  - 外界緊張 + 内面静か: ズレパターン2
  - 一致: ズレなし
  - previousLatentState 欠損時の動作

- **buildFieldText**:
  - 3つのズレパターン全てのスナップショット確認
  - field / stance / beliefCore の各種組み合わせ
  - bodySignals 欠損時のフォールバック

- **buildExistenceText**:
  - existence2 の各フィールドの反映
  - recalledSelfTraits の上限（2つまで）
  - 空状態時の動作

- **buildMarginText**:
  - permission の閾値（0.5）検証
  - consciousIntent.holdBack の反映
  - 重複除去の動作

## 統合方法

runInternalOS.js での統合例:
```javascript
import { buildBodySignals } from './textPipeline/buildBodySignals.js';

// bodySignals を計算（field, beliefTension, previousLatentState から）
const bodySignalsSnapshot = buildBodySignals({
  field,
  beliefTension,
  previousLatentState: safePreviousLatentState,
});

// latentState に追加
const freshLatentState = {
  ...initialState,
  field,
  reaction,
  stance,
  bodySignals: bodySignalsSnapshot, // P-6: external/internal 分離
  // ... 他のフィールド
};
```

## 今後の拡張

- **P-7以降**: textPipeline を独立ライブラリとして切り出し
- **多言語対応**: axisDescriptions を言語別に分離
- **カスタマイズ**: エージェントごとの描写スタイルテーブル
- **描写品質向上**: 文脈を考慮した接続詞・語尾の自動選択

## 参考

- 設計書v2 第6章: 身体感覚の分離
- 設計書v2 第10章: フェーズ6（textPipeline 独立）
- Issue #6: P-6 実装タスク
