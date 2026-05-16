# Universal Prompt Runtime

## 目的

iOS / Android / Web で、エージェントの立ち方・モード・返答方針がズレないように、Prompt 生成を `packages/shared` に集める。

## 今回 shared 化したもの

| ファイル | 内容 |
|---|---|
| `src/prompt/promptTypes.ts` | Prompt 生成に使う型定義 |
| `src/prompt/agentPromptProfiles.ts` | Agent Prompt Profiles（エージェントの核・見るもの・避けるもの・声の温度） |
| `src/prompt/modePromptProfiles.ts` | Mode Prompt Profiles（一閃・対話・深淵の方針・長さガイド） |
| `src/prompt/responsePolicy.ts` | 全媒体共通返答方針 |
| `src/prompt/promptSanitizer.ts` | 会話履歴の長さ制限・テキスト正規化 |
| `src/prompt/conversationPromptBuilder.ts` | Universal Conversation Prompt Builder（上記すべてを組み合わせる） |

## なぜ必要か

Gemini Proxy が入ると、Worker 側の prompt が実際の AI 応答品質を決める。
ここが簡易版のままだと、App Store 版だけ Web 版と違うじぶん会議になる。

Worker 側に直書きしていたエージェント説明・モード説明・返答方針を `packages/shared` に寄せることで、
iOS / Android / Web / Worker のすべてが同じ Prompt 生成核を使えるようにする。

## エージェント Prompt Profile

| エージェント | 核 |
|---|---|
| 心の鏡 (mirror) | ここまでの話と各視点の声を、助言としてではなく静かな観測面として映す |
| 委ねる (delegate) | 場に合う視点を選び、その視点として自然に返す |
| レイ (ray) | まだ言葉になっていないものの気配に触れる |
| ジョー (joe) | まだ消えていないものを見つける |
| ケン (ken) | もつれの位置と隠れた前提を見る |
| ミナ (mina) | こぼれそうなものを抱えていられる場を作る |
| サトウ (satou) | 足場を失いそうな時に地面へ戻す |

## モード Prompt Profile

| モード | 方針 | 長さ |
|---|---|---|
| 一閃 (flash) | 短く、核心だけを見る。説明を広げすぎない。 | 1〜3 文程度 |
| 対話 (dialogue) | 自然な会話として、相手の言葉から離れずに一緒に見る。 | 短い段落で 1〜3 段落程度 |
| 深淵 (deep) | 急がず、奥にある感覚・前提・構造まで少し深く潜る。 | 2〜5 段落程度（冗長にしない） |

## Worker 側の構造

```
request 受け取り
  ↓
agentId / modeId 正規化
  ↓
buildUniversalConversationPrompt() (packages/shared)
  ↓
Gemini API 送信
  ↓
response 返却
```

Worker 側には CORS・バリデーション・Gemini fetch・error handling のみを置く。
エージェント思想・モード方針・返答ポリシーは shared に任せる。

## まだやらないこと

- 旧 Vite Web 版の runtime 全面移行
- OTHERS 本実装
- streaming
- quota
- production rate limit

## 最終目標

旧 Vite Web 版・Expo Universal 版・Worker が、同じエージェント / モード / Prompt 方針を共有する。
