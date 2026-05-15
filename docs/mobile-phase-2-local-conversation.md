# Mobile Phase 2 — Local Conversation MVP

## 概要

Expo版（`apps/mobile`）に、Firebase/Gemini未接続のままローカル会話MVPを追加。

スマホ版の入力・会話体験・エージェント選択・Thinking表示・セッション管理を安全に固めるフェーズ。

---

## 今回やったこと

- **型定義** (`state/mobileTypes.ts`) — `MobileMessage`, `MobileSession`, `MobileAgentId` など
- **疑似エージェント応答** (`services/mobileAgentMock.ts`) — agentIdごとに異なる応答、委ねる・心の鏡ロジック
- **会話フック** (`state/useMobileConversation.ts`) — `sendMessage`, `selectAgent`, `clearConversation`, `createNewSession`, `startFromHint`
- **Thinkingインジケーター** (`components/chat/MobileThinkingIndicator.tsx`) — エージェント別テキスト表示
- **セッションヘッダー** (`components/session/MobileSessionHeader.tsx`) — セッションタイトル・新規/クリアボタン
- **MobileChatTimeline強化** — 自動スクロール・Thinking表示対応
- **MobileComposer強化** — `isThinking` propでの送信抑制・placeholder変更
- **index.tsx整理** — 状態を `useMobileConversation` に移譲、UIは props渡しのみ

---

## Firebase/Geminiは未接続

今回は意図的に未接続。

mock replyの目的：

- UIの入力・表示・スクロール・エージェント切替の違和感を先につぶす
- バグの原因が「UI」なのか「通信」なのかが混ざらないようにする
- 将来の差し替えポイントを明確にする

---

## 将来への差し替えポイント

| 今のmock | 将来の実装 |
|---|---|
| `createMockAgentReply()` | Gemini Proxy API呼び出し |
| `createMirrorSummaryReply()` | 要約AIプロンプト |
| `pickMockDelegatedAgent()` | `pickContextualAgent` (Web版ロジック活用) |
| `useMobileConversation` の `sendMessage` | Firebase Firestore保存 + Gemini API |

---

## 現在のファイル構成（apps/mobile）

```
apps/mobile/
  state/
    mobileTypes.ts           — 型定義
    useMobileConversation.ts — 会話フック
  services/
    mobileAgentMock.ts       — 疑似応答ロジック
  components/
    chat/
      MobileChatTimeline.tsx         — タイムライン（自動スクロール）
      MobileThinkingIndicator.tsx    — Thinking表示
      MobileMessageBubble.tsx        — メッセージバブル
      MobileEmptyState.tsx           — 空状態
    composer/
      MobileComposer.tsx             — 入力コンポーザー
      MobileAgentControlBar.tsx      — エージェント選択バー
    session/
      MobileSessionHeader.tsx        — セッションヘッダー
    intro/
      MobileIntroScreen.tsx          — イントロ画面
    layout/
      MobileAppShell.tsx
      MobileBackground.tsx
  app/
    index.tsx                — メイン画面（フック使用）
    _layout.tsx
```

---

## Web版への影響

なし。`src/` の Web版は一切変更していない。

---

## 次フェーズ案（Phase 3）

1. Cloudflare Worker API Proxy の実装
2. Gemini API をモバイルから安全に呼ぶ構造を作る
3. Firebase Firestore へのセッション保存
4. `useMobileConversation` の `sendMessage` をProxy経由に差し替え
5. EAS Build / App Store / Google Play 設定

焦らず、壊さず、でも確実に前へ。
