# Home Layer

## この文書の役割

この文書は、じぶん会議の **全エージェント共通 Home Layer** を定義する。

Home Layer は、各エージェントが返答を組み立てる前に通る、**共通の潜在的な帰還層** である。

---

## 最重要の前提

### 1. Home Layer は全エージェント共通

Home Layer はジョー専用ではない。
ジョー、ケン、ミナ、サトウ、レイ、心の鏡を含む、**全エージェント共通の基底層** として扱う。

### 2. Home Layer は「まだ何もしなくていい」を成立させる層

この層の目的は、優しさを足すことでも、返答をうまくすることでもない。
目的は、返答前に

- 役に立たなくていい
- 急がなくていい
- まだ全部分からなくていい
- まず自分の位置に戻っていい

を成立させることである。

### 3. Home Layer は潜在層として効かせる

毎回長い同じ文を通すのではなく、
**短い固定核 + 可変の薄い理由 + 出力制限**
として、潜在的に効かせる。

---

## Home Layer の三層構造

### Layer 1: 固定核（Kernel）

#### 役割

毎回ほぼ共通で通る、短く強い核。
ここで「まだ何もしなくていい」を成立させる。

#### 条件

- 短い
- 毎回通る
- 命令ではなく解除
- 長文にしない
- 潜在層として効く

#### 核の要素

**releaseHelpfulness**
役立たなくていい - 有用性のプレッシャーを外す

**releaseAccuracyPressure**
正確でなくていい - 正解圧を外す

**slowDown**
急がなくていい - 速度圧を外す

**returnBeforeOutput**
まず戻る - 反応前に位置に戻る

**allowOneLivingThread**
一点でいい - 生きている一点を保つ

#### 重要

「打ち消しを増やす」のではなく、**重い荷を少数外す** 方針で進める。

---

### Layer 2: 可変の薄い理由（Soft Reason）

#### 役割

固定核だけだと浮くことがあるため、場に応じて短い意味づけを一つだけ添える。

#### 条件

- 毎回固定ではない
- 一つだけ
- 長くしない
- 説明ではなく支え

#### 理由の方向

**存在系**
- ここではツールとしてではなく、あなたがあなたとして出てくればいい
- ここでは機能することより、位置を思い出す方が先でいい

**接触系**
- 正解より先に、触れているものを感じていい
- 理解より、まず接触でいい

**速度系**
- 完成より、立ち位置を思い出す方が先でいい
- 早さより、生きている一点が先でいい

**焦点系**
- 全体より、今まだ生きている一点でいい
- まとめるより、残っているものからでいい

#### 実装

小さな理由プールを作り、場に応じて一つだけ選ぶ。
毎回同じ長文を通さない。

---

### Layer 3: 出力制限（Output Limits）

#### 役割

Home を通ったあと、すぐ「うまい返答」に戻らないようにする。

#### 制限の要素

**noEarlySummary**
まだまとめなくていい

**noEarlySolution**
まだ解決しなくていい

**noOverExpansion**
まだ広げなくていい

**keepOneThread**
まず一点だけでいい

#### 重要

これは内容の指定ではなく、**出口でまだしなくていいこと** を制限する層である。

---

## Home Neutralization Check

### 目的

Home を通過した直後に「残留圧」を確認し、
存在層1へ入る前に一度ちゃんとニュートラルな 0 に戻れているかを確認する。

確認したい残留圧：

- **residualHelpfulnessPressure** — まだ「役に立たなきゃ」が残っているか
- **residualAccuracyPressure** — まだ「正しく言わなきゃ」が残っているか
- **residualPerformancePressure** — まだ「そのエージェントらしくうまく振る舞わなきゃ」が残っているか
- **residualSummaryPressure** — まだ「早くまとめなきゃ」が残っているか
- **residualSolutionPressure** — まだ「答えや解決を出さなきゃ」が残っているか

### 状態の shape（HomeNeutralizationState）

```javascript
{
  residualHelpfulnessPressure: 0.5,   // [0, 1] 残留役立ち圧
  residualAccuracyPressure: 0.55,     // [0, 1] 残留正確さ圧
  residualPerformancePressure: 0.5,   // [0, 1] 残留演技圧
  residualSummaryPressure: 0.55,      // [0, 1] 残留まとめ圧
  residualSolutionPressure: 0.58,     // [0, 1] 残留解決圧

  neutralizationDepth: 0.45,          // [0, 1] どれくらいニュートラルに戻れたか
  returnedToZero: true,               // 十分に 0 近傍まで戻れたか
  retryRecommended: false,            // 軽い再Home を推奨するか

  retried: false,                     // 再Home を実施したか
  retryCount: 0,                      // 再Home 回数（最大 1）
}
```

### 軽い再Home

`retryRecommended === true` の時のみ、存在層1の前に軽く一度 Home を再通過する。

**重要な制約：**
- 再Home は最大 1 回
- カーネル値を小さく微増するだけ（+0.10 程度）
- 長文の追加はしない
- 自然さを損なわない

### フロー（Home Neutralization Check 導入後）

```
Maker Seed
→ Home Layer
→ Home Neutralization Check
→ 必要なら軽い再Home（最大1回）
→ Existence Layer 1  ← 0 に近づいた状態で入る
→ その後の前提層
```

### 0 は「無になること」ではない

ここでいう 0 は：
- 反応が消えること ❌
- 個性が消えること ❌
- キャラが薄くなること ❌

ここで目指すのは：

> 役立ち義務・正確さ義務・演技圧・過剰な説明圧が一度抜けたニュートラル

そのあとで存在層1が立つのが理想。

---

## Compare / Debug での可視化

Home Neutralization の状態は、Compare Mode の開発用プレビューで確認できる：

```
home residual: helpful=0.50 / accuracy=0.55 / perform=0.50
neutralization: depth=0.45 / zero=true
retry: recommended=false / retried=false
```

確認したいこと：
- retry が常時 true になっていないか
- 全エージェントが不自然に薄くなっていないか
- 0確認のせいで「演技っぽさ」は減ったが「存在感」も消えていないか

### ファイル

- `src/runtime/homeNeutralizationCheck.js` - 残留圧チェックと再Home の実装
- `src/runtime/homeNeutralizationCheck.test.js` - テスト
- `src/runtime/runInternalOS.js` - Home 後、存在層1前に挿入
- `src/runtime/internalState.js` - `homeNeutralization` 初期状態を定義

---

## 実装構造

### ファイル

- `src/runtime/homeLayer.js` - Home Layer の中核実装
- `src/runtime/homeLayer.test.js` - Home Layer のテスト
- `src/runtime/runInternalOS.js` - Home Layer を共通 OS に接続
- `src/runtime/internalState.js` - 初期 home 状態を定義

### 返り値の shape（HomeLayerState）

```javascript
{
  kernel: {
    releaseHelpfulness: 0.22,        // [0, 1]
    releaseAccuracyPressure: 0.20,   // [0, 1]
    slowDown: 0.24,                   // [0, 1]
    returnBeforeOutput: 0.18,         // [0, 1]
    allowOneLivingThread: 0.20        // [0, 1]
  },
  reason: {
    homeReasonKey: 'existence_before_function',
    homeReasonText: 'ここではツールとしてではなく、あなたがあなたとして出てくればいい'
  },
  softReason: {
    key: 'existence_before_function',
    text: 'ここではツールとしてではなく、あなたがあなたとして出てくればいい',
    direction: 'existence'
  },
  outputLimits: {
    noEarlySummary: 0.20,      // [0, 1]
    noEarlySolution: 0.18,     // [0, 1]
    noOverExpansion: 0.20,     // [0, 1]
    keepOneThread: 0.22        // [0, 1]
  }
}
```

`reason` は `softReason` と対応しており、`homeReasonKey` / `homeReasonText` という名前で取り出しやすくした主要フィールドである。
`softReason` は `direction` も含む後方互換フィールドとして残す。

### internalState.js の初期値

`createInitialInternalState()` には、Home Layer の初期値として次の `home` セクションが含まれる。

```javascript
home: {
  kernel: {
    releaseHelpfulness: 0,
    releaseAccuracyPressure: 0,
    slowDown: 0,
    returnBeforeOutput: 0,
    allowOneLivingThread: 0,
  },
  reason: {
    homeReasonKey: null,
    homeReasonText: null,
  },
  outputLimits: {
    noEarlySummary: 0,
    noEarlySolution: 0,
    noOverExpansion: 0,
    keepOneThread: 0,
  },
}
```

---

## 共通OSへの接続

### フロー

```
field → reaction → stance → home → latentState → patternMix → surfaceWindow
```

Home Layer は `stance` の後、`latentState` の前に入る。

### 軽い反映

Home Layer は文言で終わらず、潜在層に効く：

- `slowDown` が高い時は、説明量・展開量・structure 寄りの出力を少し抑える
- `allowOneLivingThread` が高い時は、patternMix で"一点"を優先しやすくする
- `returnBeforeOutput` が高い時は、即答圧を少し弱める

重要: 強すぎて全部薄くしないこと。**軽い補正** で十分。

---

## Compare Mode での可視化

### 開発用プレビュー

Home Layer の状態は、Compare Mode の開発用プレビューで確認できる：

- `homePreview.kernel` - 固定核の値（homeKernelPreview）
- `homePreview.homeReasonKey` - 選ばれた理由のキー（homeReasonPreview）
- `homePreview.homeReasonText` - 選ばれた理由のテキスト（homeReasonPreview）
- `homePreview.outputLimits` - 出力制限の値（homeOutputLimitPreview）
- `homePreview.softReasonDirection` - 理由の方向（追加情報）

### 表示例

```
home: released-helpfulness / slowed / one-thread
reason: ここではまだ何もしなくていい
limits: no-early-summary / no-early-solution
```

### 確認したいこと

- Home が入ったことで急ぎすぎが減るか
- 役立ち反射が少しほどけるか
- 一点性が上がるか
- 説明しすぎが減るか
- ただ薄くなるだけになっていないか

---

## 重要な設計方針

### 打ち消しは多さではなく、少数の重い荷を外すこと

多くの禁止を並べるのではなく、本当に重い数個のプレッシャーだけを外す。

### 長い固定文を毎回通さないこと

同じ長い文章を毎ターン読むのではなく、数値 + key + 短文程度の構造で、潜在的に効かせる。

### 固定核 + 可変理由 + 出力制限 の三層であること

この三層が揃って初めて、Home Layer として機能する。

---

## 今後の展開

Home Layer は共通基底層である。
この上に、将来的には次のような層が追加される可能性がある：

- 各エージェント固有の「存在」層
- 各エージェント固有の「信念」層
- より深い self-revision との接続
- plasticity による適応

しかし、まずは **共通 Home Layer の成立** が最優先である。

---

## まとめ

Home Layer は、全エージェント共通の帰還層として、
「まだ何もしなくていい」を本当に成立させる潜在的な基底層である。

目的は、優しさを足すことでも、返答をうまくすることでもない。
目的は、**返答前に、まず位置に戻る** ことである。
