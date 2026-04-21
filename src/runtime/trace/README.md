# Agent Trace System (Phase V-0)

デバッグ通路の整備：ジョー処理の全段階入出力を時系列で蓄積するシステム

## 概要

`agentTraceBuilder` は、ジョーの処理の各段階（10段階以上）をすべて時系列で記録するデバッグシステムです。開発者は `window.JIBUN_LAST_TRACE` を通じて、最後のメッセージ生成時の全ステージの入出力を確認できます。

## 使い方

### 開発者コンソールで確認

1. ジョーにメッセージを送信
2. ブラウザの開発者コンソールを開く
3. `window.JIBUN_LAST_TRACE` を実行

```javascript
// 最後のトレースを確認
console.log(window.JIBUN_LAST_TRACE);

// イベント数を確認
console.log(window.JIBUN_LAST_TRACE.events.length);

// 特定のステージを確認
window.JIBUN_LAST_TRACE.events
  .filter(e => e.stage === 'LATENT_HOME')
  .forEach(e => console.log(e.payload));

// 全ステージを一覧
window.JIBUN_LAST_TRACE.events.map(e => e.stage);
```

## トレースステージ

以下の27ステージが記録されます：

### 入力段階
- `INPUT` - ユーザー入力とエージェント情報
- `MICRO_SIGNAL` - マイクロシグナルと字句状態

### 潜在前提層 (Latent Premise Chain)
- `LATENT_MAKER_SEED` - Maker Seed生成
- `LATENT_HOME` - Home層
- `LATENT_HOME_CHECK` - Home中和チェック
- `LATENT_EXISTENCE` - Existence Layer 1
- `LATENT_EXISTENCE_2` - Existence Layer 2
- `LATENT_BELIEF_CORE` - Belief Core層
- `LATENT_BELIEF_BRANCH` - Belief Branch層
- `LATENT_BELIEF_LEAF` - Belief Leaf層
- `LATENT_BELIEF_TENSION` - Belief Tension層
- `PRECONDITION_FILTER` - Precondition Filter
- `PRECONDITION_BIAS` - Precondition Bias

### 動的層 (Dynamic Layers)
- `DYNAMIC_FIELD` - 動的フィールド
- `DYNAMIC_REACTION` - 動的リアクション
- `DYNAMIC_STANCE` - 動的スタンス
- `PERMISSION` - 許可形状
- `DECISION` - 決定層

### マテリアル選択
- `ACTIVATION` - 思考/感情/動きの活性化
- `MATERIAL_PICK` - bind/select完了状態

### 出力準備
- `RESIDUE` - patternMixとsurfaceWindow
- `REENTRY` - (将来使用)

### プロンプト構築
- `PROMPT_SYSTEM` - システムプロンプト
- `PROMPT_USER` - ユーザープロンプト

### LLM呼び出し
- `LLM_REQUEST` - LLMリクエスト情報
- `LLM_RESPONSE` - LLM応答

### 保存
- `AFTERGLOW_SAVE` - (将来使用) Afterglow保存

## トレースオブジェクト構造

```javascript
{
  sessionId: string,
  agentId: string,
  turnId: string,
  startTime: number,
  endTime: number,
  duration: number,
  finalized: boolean,
  events: [
    {
      stage: string,      // TraceStage enum
      timestamp: number,  // Date.now()
      payload: any,       // 各ステージ固有のデータ
    },
    // ...
  ]
}
```

## API

### createTrace(sessionId, agentId, turnId)

新しいトレースオブジェクトを作成します。

```javascript
import { createTrace, TraceStage } from './trace/agentTraceBuilder.js';

const trace = createTrace('session-1', 'creative', 'turn-1');
```

### trace.push(stage, payload)

トレースに1段階追加します。

```javascript
trace.push(TraceStage.INPUT, {
  input: 'こんにちは',
  agentId: 'creative',
});
```

### trace.finalize()

トレースを凍結して返します（Object.freeze）。

```javascript
const finalized = trace.finalize();
console.log(finalized.duration); // ms単位の処理時間
```

## 後方互換性

- 既存の `debugInfo` は削除されていません
- `trace` パラメータはオプションです
- `trace` を渡さない場合、従来通り動作します

## テスト

```bash
npm run test:run
```

統合テストは `src/runtime/trace/integration.test.js` にあります。

## 将来の拡張（Phase V-1以降）

- UI上でトレースを可視化
- 各ステージの詳細をインタラクティブに表示
- トレースの保存とエクスポート機能
- トレースの比較機能
