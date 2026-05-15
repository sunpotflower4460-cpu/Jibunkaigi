# Universal Local Conversation MVP

## 概要

Expo Universal版（`apps/mobile`）に、Firebase/Gemini未接続のままローカル会話MVPを実装。

iOS / Android / Expo Web で同じUI・同じ機能・同じ導線を提供するための、
じぶん会議としての最初の会話体験実装です。

これは「スマホ簡易版」ではありません。
最終的にすべてのプラットフォームで同じじぶん会議を提供するための、最初の会話体験実装です。

---

## 今回やったこと（Phase 2-2）

### 型定義の拡張 (`state/mobileTypes.ts`)

- `UniversalAgentId` — エージェントID型（Mobile* の正規名）
- `UniversalModeId` — `'flash' | 'dialogue' | 'deep'` モード型（新規）
- `UniversalMessageRole` — メッセージロール型
- `UniversalMessage` — `modeId` を含む拡張メッセージ型
- `UniversalSession` — `pinned?` を含む拡張セッション型
- `Mobile*` は `Universal*` への後方互換エイリアスとして維持

### 疑似エージェント応答（`services/universalAgentMock.ts`）

- モード（一閃 / 対話 / 深淵）ごとに異なる応答を返す
- 各エージェント（レイ / ジョー / ケン / ミナ / サトウ / 心の鏡）に対応
- 委ねるは実エージェントに委譲（`pickUniversalDelegatedAgent`）
- 心の鏡はメッセージ履歴を使った要約応答（`createMirrorSummaryReply`）
- mock であることはコードコメントに明記

### ローカルセッション管理（`services/universalSessionLocal.ts`）

- `createLocalSession(title?)` — 新規セッション生成
- `clearSessionMessages(session)` — 会話クリアヘルパー
- Phase 3 で Firestore 書き込みに差し替えポイント

### 会話フック（`state/useUniversalConversation.ts`）

- `selectedMode: UniversalModeId` — 選択中モード状態
- `selectMode(modeId)` — モード変更
- メッセージに `modeId` を付与
- それ以外は `useMobileConversation` を継承・強化

### モード選択UI（`components/modes/MobileModeSelector.tsx`）

- 一閃（⚡）/ 対話（💬）/ 深淵（🌊）の3モード
- 選択状態をハイライト
- iOS / Android / Web 共通レイアウト

### 画面統合（`app/index.tsx`）

- `useUniversalConversation` に切り替え
- `MobileModeSelector` を エージェントバー上部に配置

---

## モードの定義

| モードID | 表示 | 方向性 |
|---|---|---|
| `flash` | 一閃 ⚡ | 短く・直接に |
| `dialogue` | 対話 💬 | じっくり・反射的に |
| `deep` | 深淵 🌊 | 深く・内省的に |

---

## Firebase/Geminiは未接続

今回は意図的に未接続。

| 今のmock | 将来の実装 |
|---|---|
| `createUniversalAgentReply()` | Gemini Proxy API 呼び出し |
| `createMirrorSummaryReply()` | 要約 AI プロンプト |
| `pickUniversalDelegatedAgent()` | `pickContextualAgent`（Web版ロジック活用） |
| `useUniversalConversation` の `sendMessage` | Firebase Firestore 保存 + Gemini API |

---

## ファイル構成（Phase 2-2 追加分）

```
apps/mobile/
  state/
    mobileTypes.ts            — Universal* 型定義 + Mobile* エイリアス
    useUniversalConversation.ts — モード対応会話フック（新規）
  services/
    universalAgentMock.ts     — モード対応疑似応答（新規）
    universalSessionLocal.ts  — ローカルセッション管理（新規）
  components/
    modes/
      MobileModeSelector.tsx  — 一閃/対話/深淵 モード選択UI（新規）
    chat/
      MobileThinkingIndicator.tsx — universalAgentMock に更新
  app/
    index.tsx                 — useUniversalConversation + MobileModeSelector に更新
```

---

## Web版への影響

なし。`src/` の Web版は一切変更していない。

---

## 次フェーズ案（Phase 3）

1. Cloudflare Worker API Proxy の実装
2. Gemini API をモバイルから安全に呼ぶ構造を作る
3. Firebase Firestore へのセッション保存
4. `useUniversalConversation` の `sendMessage` を Proxy 経由に差し替え
5. EAS Build / App Store / Google Play 設定
