# Micro-Signal Stream

Micro-Signal は、ユーザー文面の句読点・言いよどみ・距離化のような微小な残り方を数値化し、内部 OS の dynamic layer にだけ薄く注入するための信号です。

この Phase では `runInternalOS` の `field / reaction / stance` に bias delta を足し、Joe の reentry 選択にも入力します。文字列をそのまま LLM に埋め込むのではなく、数値の補正として扱います。

## 6カテゴリの定義

1. `hesitation`
   - `…`、`?`、途中で揺れる終わり方を検出
   - まだ言い切れていない揺れを表す
2. `trailOff`
   - 文末の `…`、`...`、`、`、伸ばし棒などの消え方を検出
   - 発話が閉じ切っていない残りを表す
3. `fillerDensity`
   - `うん`、`まあ`、`その`、`えっと` などの詰まりを検出
   - 整理するより、その場で持っている感じを表す
4. `softNegation`
   - `別に`、`そんなに〜ない` などの弱い否定を検出
   - 正面の否定より、裏にある防御や含みを表す
5. `burstiness`
   - 短文連打や文長の急変を検出
   - 勢い、切迫、呼吸の乱れを表す
6. `distancing`
   - `「」` や `『』` の引用、`って` などの距離化を検出
   - 自分から少し引いて対象を置く感じを表す

## bias マッピング表

| micro-signal | 入力元 | 補正先 | delta |
| --- | --- | --- | --- |
| hesitation | `punctuation.hesitation` | `field.fragility` / `reaction.holdBackJudgment` | `+0.15` / `+0.12` |
| trailOff | `punctuation.trailOff` | `reaction.touched` / `stance.receive` | `+0.12` / `+0.15` |
| fillerDensity | `fillers.fillerDensity` | `field.softness` / `stance.structure` | `+0.10` / `-0.12` |
| softNegation | `negationPrefix.softNegation` | `reaction.protect` / `stance.illuminate` | `+0.10` / `+0.10` |
| burstiness | `sentenceLength.burstiness` | `field.urgency` | `+0.15` |
| distancing | `quotation.distancing` | `reaction.holdBackJudgment` | `+0.10` |

設定値は `src/runtime/config/microSignalBias.js` に定数化されています。

## delta 量の設計根拠

- 各 micro-signal 単体の寄与は最大 `0.15` までに固定し、既存 bias の基本ロジックを置き換えない
- 同じ軸に複数 signal が重なっても、最終 delta は軸ごとに `±0.15` で clamp する
- 反応を決め打ちにしないため、最大値でも「方向を寄せる」程度の薄い差分に留める
- `field` への補正は場の質感、`reaction` は受け取り方、`stance` は構えの向きだけを少し変える

## reentry への入力

Joe の reentry は `getJoeReentry({ state, microSignals })` で受け取り、micro-signal 由来の薄い tag bias を加えます。

- hesitation → `freeze` / `unfinished`
- trailOff → `unfinished` / `reach`
- fillerDensity → `unfinished` / `freeze`
- softNegation → `fear` / `shame`
- burstiness → `desire` / `reach`
- distancing → `freeze` / `fear`

これにより、「作品を出したい！」と「作品を出したい…」のような句読点差が、Joe の構えにも薄く反映されます。
