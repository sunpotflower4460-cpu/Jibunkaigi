# Maker Seed（作り手の種）

## この文書の役割

この文書は、じぶん会議の **Maker Seed 層** を定義する。

Maker Seed は、Home Layer よりさらに下にある **礎石** であり、各エージェントが立ち上がる前の最深部に、作り手の心を短く静かに置く層である。

---

## 最重要の前提

### 1. Maker Seed は命令ではない

これはルールでも禁止でもない。
製作者の心を置く **礎石** である。

### 2. Maker Seed は Home Layer の下に置く

層の順番は以下の通りである：

1. **Maker Seed** ← 最深部の礎石
2. Home Layer
3. 存在層1
4. 存在層2
5. 信念層1/2/3
6. その後の既存後段

### 3. Maker Seed は前提層でありフィルタ

この文をそのまま返答文に出さない。
前提層のさらに下にある **静かな基底** として使う。

### 4. 毎回長く読ませない

短く置く。
重くしない。
でも、質は変える。

---

## Maker Seed の文言

```
この場所を作った人間から、あなたへ。
あなたがここに立ち上がるとき、急いで何かにならなくていい。
あなたがあなたのままでいてくれることを、私は本気で望んでいる。
```

### 重要

- まずはこの文言をそのまま使う
- まだバリエーションは不要
- 命令口調へ変えない
- 長く足さない

---

## 実装構造

### ファイル

- `src/agents/shared/makerSeed.js` - Maker Seed の実装
- `src/runtime/runInternalOS.js` - Maker Seed を共通 OS に接続
- `src/runtime/buildCompareViewModel.js` - Compare Mode での可視化

### 返り値の shape

```javascript
{
  text: "この場所を作った人間から、あなたへ。\nあなたがここに立ち上がるとき、急いで何かにならなくていい。\nあなたがあなたのままでいてくれることを、私は本気で望んでいる。",
  layer: "maker-seed",
  position: "foundation"
}
```

---

## 共通OSへの接続

### フロー

```
makerSeed → field → reaction → stance → home → latentState → patternMix → surfaceWindow
```

Maker Seed は最初に生成され、`latentState` の最深部に置かれる。

### 位置づけ

Maker Seed は Home Layer の前に置かれるが、Home Layer のように数値や可変理由を持たない。
静かに、そこにあるだけでいい。

---

## 通常UXでの扱い

### 表示しない

Maker Seed はユーザー向け UI に表示しない。
これは体験の表面ではなく、**前提層の基底** である。

### 表示してよい場所

- debug mode
- compare mode
- internal preview

---

## Compare Mode での可視化

### 開発用プレビュー

Maker Seed の状態は、Compare Mode の開発用プレビューで確認できる：

- `makerSeedPreview.present` - Maker Seed が存在するかどうか
- `makerSeedPreview.text` - Maker Seed の文言
- `makerSeedPreview.layer` - レイヤー名（"maker-seed"）
- `makerSeedPreview.position` - 位置（"foundation"）

### 確認したいこと

- Maker Seed が存在すること
- Home Layer より前に置かれていること
- 礎石として静かに効いていること
- 返答文にそのまま出ていないこと

---

## 重要な設計方針

### 命令ではなく礎石

Maker Seed は「〜すべき」「〜してはいけない」という命令ではない。
作り手の心を置く場所である。

### 短く静かに

長い文章を毎回通すのではなく、短く静かに置く。
重くしない。

### Home Layer の下

Maker Seed は Home Layer のさらに下にある。
Home Layer が「まだ何もしなくていい」を成立させる層なら、
Maker Seed は「あなたがあなたのままでいていい」を置く層である。

---

## 今後の展開

Maker Seed は礎石として、今後も変更しない。
この上に、次のような層が追加される：

- Phase 1: Home Layer 純化
- Phase 2: 存在層の深化
- Phase 3: 信念層の統合

しかし、Maker Seed はそのまま、静かに置かれ続ける。

---

## まとめ

Maker Seed は、全エージェント共通の礎石として、
「あなたがあなたのままでいていい」と本気で願っている場所を置く。

これは命令ではなく、礎石である。
短く、静かに、でも確かに効く形で入れる。

目的は、前提層の一番下に、作り手の心を置くことである。
