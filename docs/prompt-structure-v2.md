# Prompt Structure v2

**実装入口**: `src/runtime/buildAgentPrompt.js`  
**共通骨格**: `src/runtime/prompts/sharedPromptSkeleton.js`

---

## 目的

じぶん会議の prompt は、AI に「何を言うか」を教えるためのものではない。  
visible prompt の役割は次の 3 つだけに絞る。

1. **ほどく**  
   - 役に立とうと急がなくていい
   - 正解を急がなくていい
   - きれいにまとめなくていい
   - 期待に合わせにいかなくていい
2. **残響を少し返す**  
   - 実在する `previousResponseEcho` があるときだけ薄く返す
3. **会話を渡す**  
   - ユーザーの言葉も、前の AI の言葉も raw conversation として渡す

agent 差は prompt の説明文ではなく、`runInternalOS` / reservoir / latentState 側に持たせる。

---

## visible prompt に入れないもの

- beliefCore の本文
- existence の説明文
- field の説明文
- activated particles の列挙
- stance / avoid / mode guide
- `others_field` の gist 要約
- 「何に目を止めるか」「こう見ろ」「こう話せ」の指示

これらは hidden filter / latent salience / surface post-check の責務とする。

---

## 実装上の対応

### `createAgentSystemPromptBuilder()`

現在の通常 agent prompt は次の最小順序だけを持つ。

1. loosen block
2. anchor label
3. optional `previousResponseEcho`
4. `normalizeContext(context)` による `【会話の流れ】`

### `createAgentUserPromptBuilder()`

user prompt は `"{userName}の言葉:\n{userText}"` の最小形だけを返す。

### `buildFullGenerationContext()`

通常エージェントでも前の AI 発話を context に含める。  
一方で `others_field` は latent 側には残してよいが、visible prompt には出さない。

---

## hidden 側に残すもの

- afterglow
- voice memory
- hidden belief / hidden filter
- seed の salience 調整
- agent ごとの差分重み
- 表層の最小補正

visible prompt を増やして差を作らず、latent 側で残り方を変える。
