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

## 実装構造

### ファイル

- `src/runtime/homeLayer.js` - Home Layer の中核実装
- `src/runtime/homeLayer.test.js` - Home Layer のテスト
- `src/runtime/runInternalOS.js` - Home Layer を共通 OS に接続

### 返り値の shape

```javascript
{
  kernel: {
    releaseHelpfulness: 0.22,        // [0, 1]
    releaseAccuracyPressure: 0.20,   // [0, 1]
    slowDown: 0.24,                   // [0, 1]
    returnBeforeOutput: 0.18,         // [0, 1]
    allowOneLivingThread: 0.20        // [0, 1]
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

- `homePreview.kernel` - 固定核の値
- `homePreview.softReasonKey` - 選ばれた理由のキー
- `homePreview.softReasonDirection` - 理由の方向
- `homePreview.outputLimits` - 出力制限の値

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
