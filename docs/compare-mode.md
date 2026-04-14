# Compare Mode (開発用)

Compare Mode は、返答を「見比べるだけ」で終わらせず、品質改善に直接つなげるための開発ビューです。通常の UX には影響しません。

## 有効化
- クエリ: `?compareMode=1`
- もしくはブラウザコンソール等で: `localStorage.setItem("jibunkaigi:compareMode","1")`

## 何のために使うか
- Baseline と Current の差分を、感覚ではなく固定観点で見直す
- Outer Guide のコメントを、そのまま次の調整メモに変える
- 特にジョーの「自然さは上がったが薄くなった」ような変化を追う

## 3つの出力の役割
- **Baseline**: 初期のシンプルな人格指示だけで返す経路。internalOS/afterglow/surfaceFrame は使わず、基準となる「昔の強さ」を見るためのもの。
- **Current**: 現行の本命パイプライン（internalOS / afterglow / surface translator / current builder そのもの）。
- **Outer Guide**: Baseline と Current を見比べて「何を得て、何を失ったか」「改善提案を 1 つ」を短く言語化する比較コーチ。採点や勝敗はつけない。

## Compare で何を見るか
Compare Result では、最低限次の品質観点を固定フレームとして扱います。

- 自然さ（naturalness）
- 具体性（specificity）
- キャラの輪郭（characterPresence）
- 押しつけの少なさ（pressure）
- 余白（spaciousness）
- ジョーらしさ（joeNess / ジョー比較時）
- 受け取りやすさ（receivability）

Outer Guide は次の 3 行に寄せて返す前提です。

- `得たもの: ...`
- `失ったもの: ...`
- `提案: ...`

ここでは長文講評ではなく、Current が何を得て何を失ったかだけを短く拾います。

## ジョー比較で特に見ること
ジョー比較では、次の点を重点観察します。

- まず一点に触れているか
- その一点が入力に接地しているか
- まだ死んでいないものを拾えているか
- 明るさを足しすぎていないか
- 説明しすぎていないか
- キャラの密度が薄くなっていないか
- 「良いことを言う人」に崩れていないか

Compare Result では `joeFocusStrength / joeGrounding / joeOverSoftened / joeTooExplanatory` を軽い観察フラグとして使います。

## Revision labels の使い方
Compare Panel では開発用の軽量ラベルをその場で付けられます。Firestore には保存せず、local only のメモとして扱います。

例:

- `keep`
- `soften`
- `too-thin`
- `too-explanatory`
- `too-generic`
- `good-joe`
- `good-character`
- `good-specificity`
- `too-flat`

このラベルは「次にどこを調整するか」の目印です。正式な memory / revision システムではなく、比較の見返し用メモとして使います。

## Compare summary / copy
Compare Panel には短い summary を表示します。

- `Current gained`
- `Current lost`
- `Guide hint`

また、Compare Mode では次をまとめてコピーできます。

- user input
- baseline reply
- current reply
- outer guide
- compare summary
- revision labels

## OTHERS 表示の安定化（Phase 2）

Compare Mode 中は、OTHERS（他エージェントの反応）の表示が安定化されています：

- OTHERS セクションは reactions データがなくても表示される
- 表示されない理由が明確に示される（例: "まだ比較対象がありません"）
- デバッグ情報で OTHERS の状態が確認できる

詳細は [others-visibility.md](./others-visibility.md) を参照してください。

## 用途
- 本番公開ではなく開発観察専用。
- Baseline ↔ Current の得失を言語化して、感覚ではなく比較から品質を詰めるためのモード。
- 特にジョーの「自然さを保ちながら、薄くしすぎず、一点の強さを戻す」調整の足場として使います。
