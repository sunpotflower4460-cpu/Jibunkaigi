# Compare Mode (開発用)

Compare Mode は、Baseline と Current をただ並べるためではなく、品質改善の判断材料を短く揃えるための開発ビューです。特にジョーの調整で、自然さを保ちながら薄くしすぎていないかを見るために使います。

## 有効化
- クエリ: `?compareMode=1`
- もしくはブラウザコンソール等で: `localStorage.setItem("jibunkaigi:compareMode","1")`

## 目的
- Baseline / Current / Outer Guide の違いを一目で見る
- Current が何を得て何を失ったかを短く固定フォーマットで残す
- 次のジョー品質調整や issue 化へ、そのまま持ち込める比較メモを作る

## パネルの見方
Compare Panel は次の順で見る想定です。

1. **Compare Summary**
   - `Current gained`
   - `Current lost`
   - `Guide hint`
2. **Baseline / Current**
   - まず 2 つを見比べる
   - Current 側を基準に、自然さと薄さのバランスを見る
3. **Outer Guide**
   - 得たもの / 失ったもの / 1つの提案 を短く確認する
   - 採点や勝敗を見る場所ではない
4. **Quality frame / Joe watch**
   - 固定観点で見落としを減らす
5. **Revision labels**
   - 軽い開発メモとして付ける

## 3つの役割
- **Baseline**: 初期のシンプルな人格指示だけで返す経路。比較の基準線。
- **Current**: 現行の本命パイプライン。今の品質改善対象。
- **Outer Guide**: Baseline と Current の得失を短く言語化する比較コーチ。採点係ではない。

## Outer Guide の前提
Outer Guide は必ず次の 3 行へ寄せます。

- `得たもの: ...`
- `失ったもの: ...`
- `改善提案: ...` または `提案: ...`

Outer Guide は次をしません。

- 勝敗判定
- 点数化
- 「Baseline の方が良い」などの断定
- 長い講評

役割は、Current が何を得て何を失ったかを短く言語化し、改善の入口を 1 つだけ渡すことです。

## 固定する品質観点
Compare Result では、最低限次の観点を固定フレームとして扱います。

- naturalness
- specificity
- characterPresence
- pressure
- spaciousness
- receivability

ジョー比較では追加で次を見ます。

- joeNess
- joeFocusStrength
- joeGrounding
- joeOverSoftened
- joeTooExplanatory

UI では gain / loss / mixed / watch の軽い shape で見ます。点数化はしません。

## ジョー比較で特に見ること
ジョーでは次を優先して確認します。

- 最初に一点へ触れているか
- その一点が入力に接地しているか
- まだ死んでいないものを拾えているか
- 明るさを足しすぎていないか
- 説明しすぎていないか
- キャラの密度が薄くなっていないか

Compare Mode ではこれを短い `Joe watch` にまとめます。

- `Joe focus`: strong / medium / weak
- `Joe grounding`: grounded / partial / vague
- `Joe living thread`: picked / unclear / missing
- `Joe density`: dense / steady / thinning / thin
- `Joe drift`: okay / too-soft / too-explanatory / mixed

## Revision Labels
Revision Labels は local only の開発用ラベルです。Firestore には保存しません。

利用するラベル:

- `keep`
- `soften`
- `too-thin`
- `too-explanatory`
- `too-generic`
- `good-joe`
- `good-character`
- `good-specificity`
- `too-flat`

意味の目安:

- `keep`: 今の改善を維持したい
- `soften`: 圧を下げたい
- `too-thin`: 薄くなりすぎた
- `too-explanatory`: 説明が前に出すぎた
- `too-generic`: 入力への接地や具体性が弱い
- `good-joe`: ジョーらしさが残っている
- `good-character`: キャラの輪郭が立っている
- `good-specificity`: 具体性が良い
- `too-flat`: 起伏や密度が抜けた

## Copy の内容
Compare bundle copy には最低限次を含めます。

- user input
- baseline reply
- current reply
- outer guide
- compare summary
- revision labels

加えて、必要に応じて quality dimensions と Joe review も一緒に持ち出せます。ジョー品質調整や issue 化のたたき台として使ってください。

## 用途
- 本番 UX 用ではなく開発観察専用
- Compare の見やすさを上げ、改善判断を速くするための道具
- 特にジョーの「自然さを保つ / でも薄くしすぎない / 一点の強さを戻す / キャラ密度を保つ」を追うための足場
