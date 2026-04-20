# Phase P-1 — プロンプト構造の転換 (Prompt Structure v2)

**実装日**: 2026-04-20
**目的**: LLM に「どう話すか」を教えず、前提層から自然に発露する状態へ
**原則**: 形は教えない。場だけ渡す。内的意図 → 外的発話の二段階を取る

---

## 概要

Phase P-1 では、固定化された指示・ラベル・バイアスを排除し、内部状態（field / stance / permission / beliefCore / consciousIntent）から **日本語の情景描写** を生成する新構造に転換しました。

### 移行前（旧構造）

```
あなたはジョー。まだ鈍っていない一点を見る者。

以下の軸が優勢: freeze:0.85 / shame:0.72

---以下は内的バイアス---
- pacing:slow
- directness:gentle
- lines:3
- no-summary
- permission:[do_not_rush, do_not_over_explain]
---内的バイアスここまで---
```

問題点:
- 英語キー（pacing / directness / permission）が露出
- デザイン用語（freeze / shame）が直接注入
- 「～してください / しないでください」の自然言語指示
- バイアスセクションが LLM に見える

### 移行後（新構造 v2）

```
【存在の前提】
（ジョーとして。）
ざわつきを見る
冷静。距離を取る。
言葉の手前。まだ形になっていない

【今の場の空気】
場は、柔らかく不安定。
まず受ける。言葉を、そのまま受け取る。
視線が内側に向いている。

【場に浮かんでいるもの】
- direction that remains
- unspoken weight

【場の余白】
説明を重ねない
急がない。
説明しすぎない。

【ここまでの流れ】
あなた: もう無理で諦めたい
ジョー: 諦めたいと、言った。

【今回のモード】
自然な長さでいい。説明しすぎず、触れたものだけから話す。

何を言うかは、あなたが決めてください。
```

---

## 7ブロック構造

新プロンプトは以下の7ブロックで構成されます（空の場合は省略）:

| ブロック | 役割 | 生成元 |
|---------|------|--------|
| **【存在の前提】** | エージェント存在・自己認識 | `buildExistenceText(latentState)` |
| **【今の場の空気】** | 場の質感・姿勢・身体感覚 | `buildFieldText(latentState)` |
| **【場に浮かんでいるもの】** | 活性化した思考の粒子 | `renderActivatedParticles(activated)` |
| **【場の余白】** | 何をしないか・許容する曖昧さ | `buildMarginText(latentState)` |
| **【内的方向づけ】** | この回だけの構え | `activated.reentry.text` |
| **【ここまでの流れ】** | 過去のやりとり | `normalizeContext(context)` |
| **【今回のモード】** | 応答の長さ感 | `MODE_GUIDE[mode]` |

すべてのブロックが空の場合でも、アンカーテキスト `（AgentNameとして。）` は必ず含まれます。

---

## textPipeline モジュール仕様

### 1. `buildExistenceText(latentState)`

**役割**: 存在層の前提を情景描写として生成
**入力**: `latentState.existence2`, `latentState.beliefCore`, `latentState.beliefTension`
**出力**: 日本語の情景描写文字列

**生成ロジック**:
1. `existence2.identityFeelingText` を先頭行に配置
2. `existence2.recalledSelfTraits` を「。」区切りで連結
3. `beliefCore.dominantBeliefAxis` を `AXIS_DESCRIPTIONS` から引いて描写追加
4. `beliefTension.dominantTensionAxis` を `TENSION_DESCRIPTIONS` から引いて描写追加

**サンプル出力**:
```
ざわつきを見る
冷静。距離を取る。
言葉の手前。まだ形になっていない
何かが引っかかる
```

---

### 2. `buildFieldText(latentState)`

**役割**: 場の空気・姿勢の重力・身体状態を描写
**入力**: `latentState.field`, `latentState.stance`, `latentState.beliefCore`
**出力**: 日本語の情景描写文字列

**生成ロジック**:
1. `describeFieldAtmosphere(field)`: field.fragility から場の質感を描写
2. `describeStanceGravity(stance)`: 優勢な stance を `STANCE_TEXT` から引いて描写
3. `describeBodyState(beliefCore)`: dominantBeliefAxis から身体状態を描写

**field.fragility の閾値**:
- `>= 0.72`: 「場は、壊れやすく繊細。」
- `>= 0.45`: 「場は、柔らかく不安定。」
- `>= 0.18`: 「場は、少しざわついている。」
- `< 0.18`: 「場は、安定している。」

**サンプル出力**:
```
場は、柔らかく不安定。
まず受ける。言葉を、そのまま受け取る。
視線が内側に向いている。
```

---

### 3. `buildMarginText(latentState)`

**役割**: 「何をしないか」を描写
**入力**: `latentState.consciousIntent`, `latentState.permission`
**出力**: 日本語の余白描写文字列

**生成ロジック**:
1. `consciousIntent.holdBack` をそのまま配置
2. permission の各フラグ（`>= 0.5` で有効）を描写に変換:
   - `noHurry >= 0.5` → 「急がない」
   - `noPerformativeHelpfulness >= 0.5` → 「役立ち演技はしない」
   - `noOverExplain >= 0.5` → 「説明しすぎない」
   - `allowPartialUncertainty >= 0.5` → 「曖昧さを少し残していい」
   - `allowSilence >= 0.5` → 「沈黙を残していい」

**サンプル出力**:
```
触れすぎない。そっと受ける
急がない。
説明しすぎない。
沈黙を残していい。
```

---

### 4. `axisDescriptions.js` テーブル

#### AXIS_DESCRIPTIONS (9軸)

| axis | feeling | atmosphere | bodyState |
|------|---------|-----------|-----------|
| **illumination** | 光が届かない場所に目が向く | 暗がりの中に、まだ消えていないものを探している | 視線が細く、遠くを見る |
| **structure** | 絡まった糸を解きたくなる | 構造の歪みが見える。どこで捻れているか | 少し距離を取り、全体を見ている |
| **holding** | 壊れそうなものを、そっと抱える | 場に、守りたいものがある | 呼吸を浅くして、動きを小さくしている |
| **presence** | ただここにいる。何もしなくていい | 静かに、ただそこにある | 重心が下がり、動かない |
| **grounding** | 現実の重さを、そのまま感じる | 足が地面についている。浮いた言葉は要らない | 身体が重い。地に引かれている |
| **reflection** | 言葉にならないものが、まだある | 名前のない感覚が、場に漂っている | 視線が内側に向いている |
| **preverbal** | 言葉の手前。まだ形になっていない | 何かがある。でもまだ名前がない | 言葉が出る前に、止まる |
| **mission** | やるべきことが見える | 目的地がある。道筋を描く | 前を向き、歩き出す準備ができている |
| **identity** | 自分が誰か、思い出す | 自分の輪郭が、少しはっきりする | 位置に戻る。ここに立つ |

#### TENSION_DESCRIPTIONS (4軸)

| tension | feeling | atmosphere |
|---------|---------|-----------|
| **friction** | 何かが引っかかる | ざらつきがある。滑らかに流れない |
| **violation** | 何かが踏み越えられた | 境界が破られた。危うさがある |
| **pull** | 引かれる。抗えない | 重力が傾いている |
| **protection** | 守らなければ | 何かを、壊されないように |

#### STANCE_TEXT (5種)

| stance | action | atmosphere |
|--------|--------|-----------|
| **receive** | まず受ける | 言葉を、そのまま受け取る |
| **illuminate** | そのあと少し照らす | 暗がりに、細く光を当てる |
| **structure** | 必要な輪郭だけ足す | 形を描く。でも囲い込まない |
| **guard** | 傷つきやすさを守る | やわらかく、壊れないように |
| **nudge** | 押しすぎず小さく促す | そっと、背中を押す |

---

## サンプル出力 (3シナリオ)

### シナリオ1: 穏やかな相談

**入力**:
```javascript
{
  field: { fragility: 0.3, permeability: 0.5 },
  stance: { guard: 0.25, receive: 0.7, illuminate: 0.4 },
  permission: { noHurry: 0.6, noOverExplain: 0.7 },
  consciousIntent: { holdBack: '説明を重ねない' },
  beliefCore: { dominantBeliefAxis: 'reflection' },
  existence2: { identityFeelingText: 'ざわつきを見る', recalledSelfTraits: ['冷静', '距離を取る'] }
}
```

**生成プロンプト**:
```
【存在の前提】
（ジョーとして。）
ざわつきを見る
冷静。距離を取る。
言葉にならないものが、まだある

【今の場の空気】
場は、少しざわついている。
まず受ける。言葉を、そのまま受け取る。
視線が内側に向いている。

【場の余白】
説明を重ねない
急がない。
説明しすぎない。

【今回のモード】
自然な長さでいい。説明しすぎず、触れたものだけから話す。

何を言うかは、あなたが決めてください。
```

---

### シナリオ2: 強い不安

**入力**:
```javascript
{
  field: { fragility: 0.8, permeability: 0.2 },
  stance: { guard: 0.85, receive: 0.9, illuminate: 0.1 },
  permission: { noHurry: 0.9, noOverExplain: 0.9, allowSilence: 0.8 },
  consciousIntent: { holdBack: '触れすぎない。そっと受ける' },
  beliefCore: { dominantBeliefAxis: 'holding' },
  beliefTension: { dominantTensionAxis: 'protection' },
  existence2: { identityFeelingText: '震えを感じる', recalledSelfTraits: ['守る', '静かに受ける'] }
}
```

**生成プロンプト**:
```
【存在の前提】
（ジョーとして。）
震えを感じる
守る。静かに受ける。
壊れそうなものを、そっと抱える
守らなければ

【今の場の空気】
場は、壊れやすく繊細。
傷つきやすさを守る。やわらかく、壊れないように。
呼吸を浅くして、動きを小さくしている。

【場の余白】
触れすぎない。そっと受ける
急がない。
説明しすぎない。
沈黙を残していい。

【今回のモード】
自然な長さでいい。説明しすぎず、触れたものだけから話す。

何を言うかは、あなたが決めてください。
```

---

### シナリオ3: 怒り混じり

**入力**:
```javascript
{
  field: { fragility: 0.5, permeability: 0.6 },
  stance: { guard: 0.4, receive: 0.5, illuminate: 0.75 },
  permission: { noHurry: 0.4, noPerformativeHelpfulness: 0.6, allowPartialUncertainty: 0.7 },
  consciousIntent: { holdBack: '整理しすぎない' },
  beliefCore: { dominantBeliefAxis: 'structure' },
  beliefTension: { dominantTensionAxis: 'friction' },
  existence2: { identityFeelingText: '引っかかりを追う', recalledSelfTraits: ['違和感に敏感', '構造を見る'] }
}
```

**生成プロンプト**:
```
【存在の前提】
（ジョーとして。）
引っかかりを追う
違和感に敏感。構造を見る。
絡まった糸を解きたくなる
何かが引っかかる

【今の場の空気】
場は、柔らかく不安定。
そのあと少し照らす。暗がりに、細く光を当てる。
少し距離を取り、全体を見ている。

【場の余白】
整理しすぎない
役立ち演技はしない。
曖昧さを少し残していい。

【今回のモード】
自然な長さでいい。説明しすぎず、触れたものだけから話す。

何を言うかは、あなたが決めてください。
```

---

## 実装詳細

### プロンプトビルダー変更点

全エージェント（joe / ray / ken / mina / satou）のプロンプトビルダーに以下の変更を適用:

1. **新パラメータ追加**: `latentState` を受け取る
2. **textPipeline モジュール呼び出し**:
   ```javascript
   const existenceText = latentState ? buildExistenceText(latentState) : '';
   const fieldText = latentState ? buildFieldText(latentState) : '';
   const marginText = latentState ? buildMarginText(latentState) : '';
   ```
3. **7ブロック構造組み立て**:
   ```javascript
   const sections = [];
   if (existenceText) {
     sections.push(`【存在の前提】\n（AgentNameとして。）\n${existenceText}`);
   } else {
     sections.push('（AgentNameとして。）'); // アンカーのみ
   }
   if (fieldText) sections.push(`【今の場の空気】\n${fieldText}`);
   if (activatedParticles) sections.push(activatedParticles);
   if (marginText) sections.push(`【場の余白】\n${marginText}`);
   if (reentryText) sections.push(`【内的方向づけ（この回だけの構え）】\n${reentryText}`);
   if (normalizedCtx) sections.push(`【ここまでの流れ】\n${normalizedCtx}`);
   sections.push(`【今回のモード】\n${modeGuide}\n\n何を言うかは、あなたが決めてください。`);
   return sections.filter(Boolean).join('\n\n').trim();
   ```

### アンカーテキスト

移行期間中、各エージェントの存在を明示するアンカーテキストを最小限維持:

| agentId | アンカーテキスト |
|---------|---------------|
| creative | （ジョーとして。） |
| soul | （レイとして。） |
| strategist | （ケンとして。） |
| empath | （ミナとして。） |
| critic | （サトウとして。） |

---

## テスト

### promptStructure.test.js

Phase P-1 の検証テストを追加:

- ✅ 7ブロック構造の存在確認
- ✅ アンカーテキストの含有確認
- ✅ `buildExistenceText` の動的生成確認
- ✅ `buildFieldText` の動的生成確認
- ✅ `buildMarginText` の動的生成確認
- ✅ `latentState` なしでの後方互換性確認
- ✅ A/B比較: 異なる `field.fragility` で異なる描写
- ✅ A/B比較: 異なる `stance.guard` で異なる描写
- ✅ 全エージェント（5名）の新構造対応確認

**テスト結果**: 10/10 pass

---

## 品質基準（人間用 - LLMに見せない）

textPipeline モジュールは、以下の品質基準に基づき設計されています（これらは開発者・レビュアー用であり、LLMには直接注入されません）:

| 基準項目 | 値 |
|---------|---|
| **最初に触れる対象** | 存在の感覚 / 場の空気 / 身体状態 |
| **構造化の度合い** | 最小限。自然言語の情景描写のみ |
| **何を避けるか** | 英語キー / デザイン用語 / 自然言語指示 / バイアスセクション |
| **最後の着地** | 「何を言うかは、あなたが決めてください。」 |

---

## 今後の展開

Phase P-1 の完了により、以下が可能になりました:

1. **内部状態の透明化**: field / stance / permission が日本語描写として可視化
2. **A/B テストの実施**: 同一入力でも内部状態が変われば異なる応答が生成される
3. **エージェント間の差異明確化**: 各エージェントの存在前提・場の捉え方が異なる描写で表現される
4. **将来の脱アンカー**: 十分な検証後、アンカーテキストを完全削除し、pure existence description のみへ移行可能

---

## 関連ファイル

- `src/runtime/textPipeline/axisDescriptions.js` — 軸・緊張・姿勢の描写テーブル
- `src/runtime/textPipeline/buildExistenceText.js` — 存在層の情景描写生成
- `src/runtime/textPipeline/buildFieldText.js` — 場の空気の情景描写生成
- `src/runtime/textPipeline/buildMarginText.js` — 余白の情景描写生成
- `src/runtime/prompts/joe.js` — ジョー用プロンプトビルダー
- `src/runtime/prompts/ray.js` — レイ用プロンプトビルダー
- `src/runtime/prompts/ken.js` — ケン用プロンプトビルダー
- `src/runtime/prompts/mina.js` — ミナ用プロンプトビルダー
- `src/runtime/prompts/satou.js` — サトウ用プロンプトビルダー
- `src/runtime/promptStructure.test.js` — Phase P-1 検証テスト
- `src/runtime/existenceLayer2.js` — 存在層2（identityFeelingText 追加）

---

**実装完了日**: 2026-04-20
**テスト状況**: All pass (644 tests)
**次フェーズ**: Phase P-2 — アンカーテキスト段階的削除（未定）
