# Universal Shared Core

## 目的

iOS / Android / Web で、エージェント・モード・文言・基本挙動がズレないように、共通コアを `packages/shared` に置く。

## 今回 shared 化したもの

| モジュール | 内容 |
|---|---|
| `src/agents.ts` | Universal Agents（ID・表示名・説明・姿勢） |
| `src/modes.ts` | Universal Modes（一閃・対話・深淵） |
| `src/thinking.ts` | Thinking 文言生成（エージェント×モード） |
| `src/mockReply.ts` | ローカル mock 応答（iOS/Android/Web 共通） |
| `src/ids.ts` | ID 生成・セッションタイトル生成 |
| `src/parityFeatures.ts` | Parity Feature ID 定義 |

## まだ shared 化しないもの

- 既存 Web 版の runtime 全体（`src/runtime/`）
- Firebase 接続
- Gemini 接続
- localStorage 依存
- window / document 依存
- UI コンポーネント
- Debug / Inspector パネル

## 方針

既存 Web 版を壊さないため、いきなり `src/runtime` を移動しない。  
まず純粋定義（型・定数・純粋関数）だけを shared 化し、後続 PR で段階的に参照先を寄せる。

## apps/mobile からの参照

Metro の `watchFolders` に `packages/shared` を追加し、相対パスで import している。

```ts
import { UNIVERSAL_AGENTS, getThinkingText } from '../../../packages/shared/src';
```

現時点で参照しているファイル：

- `apps/mobile/services/universalAgentMock.ts` — shared mockReply を使用
- `apps/mobile/components/composer/MobileAgentControlBar.tsx` — UNIVERSAL_AGENTS を使用
- `apps/mobile/components/chat/MobileThinkingIndicator.tsx` — getThinkingText を使用
- `apps/mobile/state/mobileTypes.ts` — MobileAgentId を UniversalAgentId として re-export

## 既存 Web 版との文言差について

エージェント・モードの文言は `packages/shared` を正としている。  
既存 Web 版（`src/` 以下）との文言照合は後続 PR で行う。

## 最終目標

旧 Vite Web 版と Expo Universal 版が、同じ agent / mode / prompt / runtime core を使う状態にする。

## 今後の移行順

1. **Phase 3（本 PR 完了後）**：Firebase Auth / Firestore Universal Adapter
2. **Phase 4**：Gemini Proxy 接続・本物の AI 応答
3. **Phase 5 以降**：既存 Web 版 runtime の段階的 shared 化
