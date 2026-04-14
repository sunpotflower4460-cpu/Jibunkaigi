# Compare Mode (開発用)

Compare Mode は開発者が返答の得失を観察するためのビューです。通常の UX には影響しません。

## 有効化
- クエリ: `?compareMode=1`
- もしくはブラウザコンソール等で: `localStorage.setItem("jibunkaigi:compareMode","1")`

## 3つの出力
- **Baseline**: 初期のシンプルな人格指示だけで返す経路。internalOS/afterglow/surfaceFrame は使わず、基準となる「昔の強さ」を見るためのもの。
- **Current**: 現行の本命パイプライン（internalOS / afterglow / surface translator / current builder そのもの）。
- **Outer Guide**: Baseline と Current を見比べて「何を得て、何を失ったか」を短く言語化する観察ガイド。採点や勝敗はつけない。

Outer Guide が見る観点の例: 自然さ / 具体性 / キャラの立ち方 / 押しつけの少なさ / 余白 / ジョーらしさ / 受け取りやすさ。
助言は1〜2個で止め、点数化や「どちらが優秀か」の断定を避けます。

## 用途
- 本番公開ではなく開発観察専用。
- Baseline ↔ Current の得失を言語化して、感覚ではなく比較から品質を詰めるためのモード。
