# others_field（場の残響）

顕在層 v0.1 の第1段階として導入した、先行エージェントの発話を「場の残響」として後続エージェントへ渡す機能。

## 目的

じぶん会議を「独立した返答の並列」から「先行エージェントが残した場を後続エージェントが読める会議体」へ進めること。

## 最重要の原則

### 1. 発話本文をそのまま食わせない

`others_field` は、先行エージェントの返答本文そのものではない。
渡すのは **場の残響** である。

例:
- 受け止めた
- 少し踏み込んだ
- 結び目を見た
- 足場へ戻した
- まだ閉じていないものを映した

### 2. 基本は明示引用しない

後続エージェントが毎回以下のように言うのは避ける:
- 「ミナがこう言っていたけど」
- 「ケンはこう見ているが」

基本は場として吸収する。
明示的な他者言及は今回はまだ入れない。

### 3. 今回は最小版でいい

最初から完全な会議シミュレーションにしない。
まずは:
- 先行発話から gist を取る
- tone / force をタグ化する
- 後続プロンプトへ渡す

ここまでで十分。

### 4. 形の指示に戻さない

`others_field` を導入しても、以下のような直接的な工程指示にはしない:
- 「ミナが受けたからジョーは踏み込め」
- 「サトウのあとだから鏡はまとめろ」

渡すのは **場だけ** である。

## データ構造

### OthersFieldEntry

```javascript
{
  agentId: "joe" | "mina" | "ray" | "ken" | "satou" | "mirror",
  gist: string,          // その発話が場に残したもの（短い要約）
  toneTags: string[],    // 雰囲気タグ
  forceTags: string[]    // 場に加えた力のタグ
}
```

### OthersField

```javascript
OthersField = OthersFieldEntry[]
```

## gist / tone / force

### gist（場に残したもの）

その発話がこの場に何を残したかの短い要約。

例:
- 「苦しさを受け止め、急いで変えなくてよい場を作った」
- 「まだ残っている力に触れた」
- 「構造上の結び目を見た」
- 「現実の足場へ戻そうとした」
- 「未解決の重さを映した」

### toneTags（雰囲気タグ）

候補:
- `soft` - やさしい
- `warm` - 温かい
- `sharp` - 鋭い
- `quiet` - 静かな
- `grounded` - 地に足がついた
- `structural` - 構造的な
- `holding` - 支える

### forceTags（場に加えた力）

候補:
- `stay` - 止まる、待つ
- `deepen` - 深める
- `ground` - 現実へ戻す
- `clarify` - 明確にする
- `hold` - 支える
- `slow-down` - ゆっくりにする
- `do-not-close` - 閉じない

## 実装

### 生成タイミング

各エージェントの発話が出たあとに、その発話から `OthersFieldEntry` を作る。

流れイメージ:
```
Agent A 発話
→ summarizeToOthersField(A)
→ othersField に追加
→ Agent B は othersField を読める
```

**重要**: 自分自身の entry は、基本そのエージェントには戻さない。
後続エージェントと心の鏡が読む前提で進める。

### 後続エージェントへの渡し方

プロンプトに本文全文を渡すのではなく、短い場情報だけを渡す。

```
[others_field]
mina:
- gist: 苦しさを受け止め、急いで変えなくてよい場を作った
- tone: soft, holding
- force: stay, slow-down
```

**重要**:
- 逐語引用しない
- 長くしない
- "こう返せ" に変換しない
- 場として渡す

## 心の鏡への接続

### 今回の最小目標

心の鏡だけは、複数の `others_field` を読めるようにする。
まだ完璧な総括でなくてよいが、少なくとも:
- 他エージェントが残した場
- 重なっている力
- まだ残っている重力

を読める土台にする。

**重要**: 心の鏡は、
- ただの自分意見
ではなく、
- 場全体の残響を読む存在
へ近づける第一歩。

## デバッグ

### compare/debug で見えるもの

- `othersFieldCount` - others_field のエントリ数
- `othersFieldPreview` - 最新の gist のプレビュー
- `othersFieldUsed` - エージェントプロンプトで使用されたか
- `mirrorOthersFieldUsed` - 心の鏡で使用されたか

表示例:
```
others field entries: 3
latest gist: 苦しさを受け止め、急いで変えなくてよい場を作った
used in agent prompt: true
```

### Agent Gate Debug Panel

`?debugAgent=1` でデバッグパネルを表示すると、`others_field` イベントが確認できる:

```
[HH:MM:SS] others_field count=3 preview=joe: まだ残っている力に触れた / mina: 苦しさを受け止めた
```

## 今回やらないこと

- thought / feeling / move reservoir の本実装
- activate → bind → select の本実装
- anti-triggers の本実装
- 明示的な他エージェント言及の本格導入
- UI の OTHERS 表示完成版
- 長さ制御の本格改善

今回は `others_field` の最小導入だけに集中する。

## 次段階で必要なこと

thought reservoir に進む時に必要なもの:

1. **gist の精度向上**
   - 現在はヒューリスティックベース
   - LLM を使った要約が必要になる可能性

2. **tone/force の拡張**
   - より細かい分類
   - エージェント固有の傾向の反映

3. **履歴の管理**
   - どこまで遡るか
   - 重要度による選別

4. **明示引用の導入**
   - 必要な場面での他エージェント言及
   - 引用のトリガー条件

5. **UI での可視化**
   - ユーザーが場の残響を確認できる表示
   - デバッグモード以外での観察手段

## まとめ

`others_field` は、じぶん会議を「独立した返答の並列」から「場を共有する会議体」へ進める第一歩。

原則:
- 本文ではなく場を渡す
- gist / tone / force にする
- 基本は明示引用しない
- 心の鏡は場全体に近づける

この原則を守ることで、次段階の thought reservoir への土台ができる。
