# Universal Shared Core

## 目的

iOS / Android / Web で、エージェント・モード・文言・基本挙動がズレないように、共通コアを `packages/shared` に置く。

---

## 今回 shared 化したもの

| ファイル | 内容 |
|---|---|
| `src/agents.ts` | エージェント ID・定義・ヘルパー（`UNIVERSAL_AGENTS`, `getUniversalAgent` 等） |
| `src/modes.ts` | モード ID・定義・ヘルパー（`UNIVERSAL_MODES`, `getUniversalMode` 等） |
| `src/thinking.ts` | Thinking 文言（`getThinkingText`） |
| `src/mockReply.ts` | ローカル mock 応答（`createUniversalMockReply`, `buildMirrorMockReply` 等） |
| `src/ids.ts` | ID 生成・セッションタイトル生成（`createUniversalId`, `createSessionTitleFromText`） |
| `src/parityFeatures.ts` | Parity Feature ID 一覧（`UNIVERSAL_PARITY_FEATURES`） |
| `src/index.ts` | 上記をすべて re-export |

---

## まだ shared 化しないもの

- 既存 Web 版の runtime 全体（`src/runtime/`）
- Firebase 接続（`src/services/`）
- Gemini 接続・Cloudflare Worker
- `localStorage` / `window` / `document` 依存
- UI コンポーネント（`src/components/`）
- Debug / Inspector パネル

---

## apps/mobile への反映

| ファイル | 変更内容 |
|---|---|
| `state/mobileTypes.ts` | `UniversalAgentId` / `UniversalModeId` を shared から re-export |
| `services/universalAgentMock.ts` | shared `createUniversalMockReply` / `buildMirrorMockReply` / `getThinkingText` のラッパーに変更 |
| `services/universalSessionLocal.ts` | shared `createUniversalId` / `createSessionTitleFromText` を使用 |
| `components/composer/MobileAgentControlBar.tsx` | `UNIVERSAL_AGENTS` を shared から使用 |
| `components/modes/MobileModeSelector.tsx` | `UNIVERSAL_MODES` を shared から使用 |
| `components/chat/MobileThinkingIndicator.tsx` | `getThinkingText` を shared から使用（`modeId` prop 追加） |
| `metro.config.js` | `watchFolders` に `packages/shared` を追加 |
| `tsconfig.json` | `@jibunkaigi/shared` パスエイリアスを追加 |

---

## 方針

既存 Web 版を壊さないため、いきなり `src/runtime` を移動しない。
まず純粋定義だけを shared 化し、後続 PR で段階的に参照先を寄せる。

## 最終目標

旧 Vite Web 版と Expo Universal 版が、同じ agent / mode / prompt / runtime core を使う状態にする。

---

## 次の移行候補

1. `apps/mobile` の残存重複定義を shared に完全寄せ
2. 旧 Vite Web 版の agents / modes 定義との照合
3. prompt 定義の shared 化
4. Firebase adapter interface
5. Gemini Proxy client interface
