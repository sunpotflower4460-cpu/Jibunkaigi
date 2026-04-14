# Compare Mode

開発中に、同じ user input に対して

- **Baseline Reply** — Outer Guide（stateGuide / internalFrame / surfaceGuidance）を空にして生成した返答
- **Current Reply** — 現行の活性化パイプライン全部入りで生成した返答
- **Outer Guide** — 実際に systemInstruction に差し込まれたガイドテキスト

を並べて見比べるための **dev-only** モード。本番ユーザーには出ない。Firestore にも保存しない。

---

## 目的

Outer Guide が Current Reply に対して何を付加しているかを、返答レベルで観察できるようにする。特に Joe が「薄い」「説明しすぎ」「キャラが弱い」と感じた時、それが Outer Guide の影響か、それ以前の prompt 骨格の影響かを切り分けやすくする。

これ自体は「ラベルを付ける」機能ではない。次フェーズで入れる **self-revision**（AI メッセージ単位で keep / soften / too-thin / good-joe を付ける仕組み）を「何を基準に付けるか」がブレないようにするための土台。

---

## 有効化

- URL パラメータ: `?compareMode=1`
- または localStorage:
  ```js
  localStorage.setItem('jibunkaigi:compareMode', '1');
  ```

無効化:
```js
localStorage.removeItem('jibunkaigi:compareMode');
```

本番ビルド (`import.meta.env.DEV === false`) では上記設定を入れても有効にならない。

---

## 動作

Compare Mode が有効な時:

1. ユーザーがエージェントボタン（Joe / Ray / Ken / Mina / Satou / Mirror）を押す
2. 内部で LLM コールが **2 本並走**:
   - Current call: これまで通り、Outer Guide 全部注入 → 会話に表示
   - Baseline call: Outer Guide を空文字で注入 → 会話には出さず Compare Panel にだけ記録
3. 画面左下に `⚖ Compare` パネルが表示され、直近最大 8 件の entry を確認できる

Baseline と Current はそれぞれ独立で、片方が失敗してももう片方には影響しない（`Promise.allSettled` 的な並走）。

**API コストは倍になる** ので、常時有効にはしないこと。観察したい時だけ `?compareMode=1` を付ける運用を想定。

---

## Compare Panel の見方

各 entry を展開すると以下が表示される:

- `User` — 入力テキスト（冒頭 200 字にトリム）
- `Baseline Reply (Outer Guide 空)` — 比較基準の返答
- `Current Reply (full pipeline)` — 現行の返答
- `Outer Guide`
  - `stateGuide` — 推定状態に応じた応答指針
  - `internalFrame` — 共通 OS の薄い内部フレーム
  - `surfaceGuidance` — Surface Translator の表層ヒント

Joe の entry には 🎯 が付く（今の最優先改善対象）。

上部の `copy` ボタンで最新 entry を JSON でクリップボードへ、`clear` で entries を空にできる。

---

## 次フェーズ（self-revision）への接続

Compare entry の shape は、後で AI メッセージ単位の self-revision ラベルを紐付けやすいよう `id` / `agentId` / `userText` / `baselineReply` / `currentReply` / `outerGuide` を含む。

次フェーズでは:

- `messages` 配列の各 AI reply に対して `keep / soften / too-thin / too-explanatory / good-joe / good-character / good-specificity / too-flat` 等のラベルを chip で付けられるようにする
- `localStorage` key `jibunkaigi:self-revision` に保存
- Compare Panel の各 entry の下にもラベル chip を配置し、Baseline / Current を見比べながら「Current は too-thin」「Baseline の方が good-specificity」のような開発判断を残せるようにする

今回の Compare Mode は、そのラベル付け作業が **何を見て判断しているか** をブレさせないための土台。

---

## 制約

- dev-only: 本番 UX / 本番ビルドには一切出ない
- メモリ保持のみ: reload すると entries は消える
- Firestore には送らない
- API コールが倍になる: 本番キーを使う場合はコスト注意
