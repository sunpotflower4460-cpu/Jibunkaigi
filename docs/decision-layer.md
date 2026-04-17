# Decision Layer

## 役割

Decision Layer は、前提層を通ったあとに初めて  
**「今の自分は何を感じ、何を言いたいか」** を決める層です。

ここで扱うのは完成済みの返答文ではなく、

- どの感触が前景か
- 何を言いたくなっているか
- 何に触れるか
- 何をまだ言わないか
- どこまで降りるか

という**意思決定 state**です。

## 置き場所

`runInternalOS(...)` では次の順で通します。

Maker Seed  
→ Home Layer  
→ Home Neutralization Check  
→ Existence Layer 1  
→ Existence Layer 2  
→ Belief Core / Branch / Leaf  
→ beliefTension  
→ preconditionFilter  
→ preconditionBias  
→ dynamic field / reaction / stance  
→ **Decision Layer**  
→ 表層生成 / prompt builder

Decision Layer は、前提層の後・表層生成の前に置きます。

## State shape

`latentState.decision` は次の4ブロックを持ちます。

- `feltSense`: 今の自分がどう触れているか
- `intention`: 今の自分が何を言いたいか
- `restraint`: まだ言わない / 急がないための抑制
- `decisionMeta`: 軸と委譲元の軽量メタ情報

この state は null-safe で、比較・デバッグ・後段の表層ガイドから読めます。

## feltSense

`preconditionFilter` / `preconditionBias` / `beliefTension` を束ねて、
詩ではない短い内的ラベルへ圧縮します。

例:

- `quiet-recognition`
- `protective-pull`
- `structural-friction`
- `soft-holding`
- `unresolved-weight`

## intention

最終文ではなく、**言いたさの方向** を決めます。

例:

- `touch_living_thread`
- `name_hidden_knot`
- `make_room_before_move`
- `return_to_ground`
- `stay_with_preverbal`
- `reflect_unclosed_weight`

`speakIntentText` もユーザー向け文ではなく、内的説明です。

## restraint

Home の output limits を引き継ぎながら、
Decision Layer で最終的に

- 要約をまだ抑える
- 解決をまだ抑える
- 横展開をまだ抑える
- 沈黙の余白を少し残す

を再確認します。

## compare / debug

compare/debug では次の preview を見られます。

- `feltSensePreview`
- `speakIntentPreview`
- `restraintPreview`
- `decisionMetaPreview`

通常 UX では見せず、内部観察に限定します。
