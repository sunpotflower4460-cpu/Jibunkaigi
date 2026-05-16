# packages/shared

共通ロジックの将来の共有先です。現時点では Web 版の `src/` からのコピーは行っていません。
まずはどこが共有できるかを整理します。

---

## 現在の実装

Phase 2-3 で `packages/shared/src` が追加され、以下の純粋定義が入りました。

| ファイル | 内容 |
|---|---|
| `src/agents.ts` | エージェント ID・定義・ヘルパー |
| `src/modes.ts` | モード ID・定義・ヘルパー |
| `src/thinking.ts` | Thinking 文言（mode-aware） |
| `src/mockReply.ts` | ローカル mock 応答ロジック |
| `src/ids.ts` | ID 生成・セッションタイトル生成 |
| `src/parityFeatures.ts` | Parity Feature ID 一覧 |
| `src/index.ts` | 上記をすべて re-export |

まだ既存 Web 版の runtime 全体は移動していません。
Firebase / Gemini 接続も含みません。

---

## 次の移行候補

1. `apps/mobile` の重複定義を shared に完全寄せ
2. 旧 Vite Web 版の agents / modes 定義との照合
3. prompt 定義の shared 化
4. Firebase adapter interface
5. Gemini Proxy client interface

---

## 共有候補の分類

### ✅ 共有できるもの（ブラウザ / React Native 両対応可能）

| パス | 内容 | 注意点 |
|---|---|---|
| `src/runtime/prompts/` | エージェントプロンプト定義 | Gemini API 呼び出しは含まない |
| `src/runtime/agentIdentity.js` | エージェント ID 変換 (UI ↔ canonical) | 純粋ロジック |
| `src/runtime/weightedSample.js` | 重み付きサンプリング | 純粋ロジック |
| `src/agents/registry.js` | エージェント定義レジストリ | 純粋データ |
| `src/agents/beliefCore.js` | 信念コア | 純粋ロジック |
| `src/utils/id.js` | ID 生成ユーティリティ | 要 `crypto.randomUUID` 確認 |
| `src/utils/safeParseJson.js` | JSON パース | 純粋ロジック |

### ⚠️ Web 依存があるもの（要置き換え）

| パス | 内容 | 依存先 |
|---|---|---|
| `src/runtime/context.js` | セッションコンテキスト | `localStorage` / `window` |
| `src/runtime/trace/` | トレース履歴 | `localStorage` |
| `src/runtime/debug/` | デバッグパネル | `window` |
| `src/services/` | Firebase 接続 | `firebase/firestore` (Web SDK) |
| `src/modes/responseModes.jsx` | モード定義 | JSX / React Web |

### 🔴 React Native 側で別実装が必要なもの

| パス | 内容 | 理由 |
|---|---|---|
| `src/components/` | UI コンポーネント全般 | `react-dom` / CSS 依存 |
| `src/styles/` | デザイントークン CSS | CSS 変数は RN 非対応 |
| `src/runtime/textPipeline/` | テキスト整形 | DOM 操作の可能性あり |

---

## localStorage / window / document / crypto 依存の確認

| モジュール | localStorage | window | document | crypto |
|---|---|---|---|---|
| `src/runtime/context.js` | ✅ あり | ✅ あり | — | — |
| `src/runtime/trace/traceHistoryStore.js` | ✅ あり | — | — | — |
| `src/utils/id.js` | — | — | — | ✅ あり (`crypto.randomUUID`) |
| その他 runtime | — | 一部 | — | — |

> `crypto.randomUUID` は React Native 0.73 以降で対応済み。Expo でも利用可能。

---

## Firebase / Gemini 接続の注意点

### Firebase

- Web 版は `firebase/app` + `firebase/firestore` (Web SDK) を使用
- React Native では **`@react-native-firebase`** への移行が必要
- Firestore のデータ構造は共通にする：
  ```
  artifacts/{appId}/users/{uid}/sessions/{sessionId}
  artifacts/{appId}/users/{uid}/sessions/{sessionId}/messages/{messageId}
  ```
- 開発中は `appId` を `self-conf-v10-mobile-dev` など別値にしてよい

### Gemini API

- **モバイルアプリに Gemini API Key を直埋めしない**
- 推奨構成：Expo App → Cloudflare Worker (API Proxy) → Gemini API
- 詳細は `docs/expo-universal-plan.md` を参照

---

## 移行フェーズ

| フェーズ | 内容 |
|---|---|
| Phase 0（完了） | この README のみ。コピーなし |
| Phase 1（完了） | 純粋定義（agents, modes, thinking, mockReply, ids, parityFeatures）を shared 化 |
| Phase 2-6（完了） | Prompt / Agent Runtime の第一層を追加 |
| Phase 2 | Web 依存のあるモジュールを抽象化レイヤで包む |
| Phase 3 | Firebase を抽象化し Web / Native で差し替え可能に |
| Phase 4 | Gemini API Proxy を介した実接続 |

---

## Prompt Runtime

Phase 2-6 で Prompt / Agent Runtime の第一層を追加。

- `prompt/agentPromptProfiles` — エージェントの核・見るもの・避けるもの・声の温度
- `prompt/modePromptProfiles` — 一閃・対話・深淵の方針・長さガイド
- `prompt/responsePolicy` — 全媒体共通返答方針
- `prompt/promptSanitizer` — 会話履歴の長さ制限・テキスト正規化
- `prompt/conversationPromptBuilder` — Universal Conversation Prompt Builder

これは Worker 側の Gemini prompt と、将来の Web / Expo 共通 prompt の基礎になる。

---

## ディレクトリ構成

```
packages/shared/
  src/
    agents.ts         # エージェント定義
    modes.ts          # モード定義
    thinking.ts       # Thinking 文言
    mockReply.ts      # ローカル mock 応答
    ids.ts            # ID 生成ユーティリティ
    parityFeatures.ts # Parity Feature ID 一覧
    prompt/
      promptTypes.ts              # Prompt 型定義
      agentPromptProfiles.ts      # Agent Prompt Profiles
      modePromptProfiles.ts       # Mode Prompt Profiles
      responsePolicy.ts           # 共通返答方針
      promptSanitizer.ts          # テキスト正規化・長さ制限
      conversationPromptBuilder.ts # Universal Prompt Builder
    index.ts          # re-export
  package.json
  tsconfig.json
  README.md
```

