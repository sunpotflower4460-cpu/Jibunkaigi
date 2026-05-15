# Jibunkaigi Expo Universal Plan

じぶん会議を iOS / Android / Expo Web に対応させるための方針書。
既存の Vite + Cloudflare Web 版は維持しつつ、Expo 版を `apps/mobile` に安全に併設する。

---

## 全体構成

```
Jibunkaigi/
  src/                    # 既存 Web 版（Vite + Cloudflare）。触らない
  apps/
    mobile/               # Expo 版 (iOS / Android / Expo Web)
  packages/
    shared/               # 共通ロジック（段階的に移行）
  docs/
    expo-universal-plan.md
```

---

## 対応プラットフォーム方針

| プラットフォーム | 方針 |
|---|---|
| 現行 Web | Vite + Cloudflare Workers で維持。本番はこれ |
| iOS | Expo / React Native で新規対応 |
| Android | Expo / React Native で新規対応 |
| Expo Web | `apps/mobile` 内で確認用に対応。将来の統合検証用 |

---

## Gemini API 方針

### ❌ やってはいけないこと

**モバイルアプリに Gemini API Key を直埋めしない。**

理由：
- アプリバイナリから API Key が抽出される可能性がある
- 利用量制御（レート制限・コスト管理）が難しくなる
- App Store / Google Play 公開後のキーローテーションが困難

### ✅ 推奨構成

```
Expo App (iOS / Android / Web)
  ↓  HTTPS リクエスト
Cloudflare Worker (API Proxy)
  ↓  サーバー側で API Key を付与
Gemini API
```

### 実装イメージ

```typescript
// apps/mobile/lib/api.ts（例）
const API_BASE = 'https://api.jibunkaigi.workers.dev';

export async function sendMessage(sessionId: string, text: string, agent: string) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, text, agent }),
  });
  return res.json();
}
```

Cloudflare Worker 側で `GEMINI_API_KEY` を環境変数として管理し、
クライアントには公開しない。

---

## Firebase / Firestore 方針

### データ構造

Web 版と同じ Firestore 構造を使用する：

```
artifacts/{appId}/users/{uid}/sessions/{sessionId}
artifacts/{appId}/users/{uid}/sessions/{sessionId}/messages/{messageId}
```

### 開発中の appId

開発中はデータ汚染を避けるため appId を分けてよい：

```
# 開発用
self-conf-v10-mobile-dev

# 本番統合時
self-conf-v10  ← 既存 Web 版と同じ
```

本番統合時には appId を既存 Web 版に揃え、セッションを共有できるようにする。

### SDK について

- 現行 Web 版：`firebase/app` + `firebase/firestore`（Web SDK）
- React Native / Expo 版：将来的に `@react-native-firebase` へ移行推奨
  - または Firebase JS SDK v9+ を React Native でも使う方法もある（軽量）
- 初期は Firebase 未接続でダミーデータで動作確認してよい

---

## UI 分離方針

Web 版と Native 版で UI は **別実装** にする。

```
Web 版 (src/components/)
  └── React DOM + CSS + Tailwind v4
      └── backdrop-filter blur / CSS 変数 / flex / grid

Expo 版 (apps/mobile/components/)
  └── React Native StyleSheet + テーマ定数
      └── View / Text / ScrollView / StyleSheet
      └── blur は避ける（重い）
```

「同じロジック、異なる身体」が目標。

---

## ロジック共有方針

以下のロジックは将来 `packages/shared` に段階移行する：

| 対象 | 共有方法 |
|---|---|
| エージェントプロンプト | そのままコピー可能（純粋文字列） |
| agentIdentity | そのままコピー可能（純粋ロジック） |
| weightedSample | そのままコピー可能（純粋ロジック） |
| runtime (一部) | Web 依存を抽象化レイヤで包む |
| Firebase 接続 | インターフェースを揃えて実装を差し替え |

詳細は `packages/shared/README.md` 参照。

---

## 起動コマンド

### 既存 Web 版（ルートで実行）

```bash
npm run dev       # 開発サーバー
npm run build     # ビルド
npm run deploy    # Cloudflare Workers にデプロイ
```

### Expo 版（apps/mobile で実行）

```bash
cd apps/mobile
npm install
npm run web       # Expo Web で確認
npm run ios       # iOS シミュレーター
npm run android   # Android エミュレーター
```

---

## 進捗フェーズ

| フェーズ | 状態 | 内容 |
|---|---|---|
| Phase 0 | ✅ 完了 | 既存 Web 版の動作確認 |
| Phase 1 | ✅ 完了 | `apps/mobile` に Expo 基盤を追加 |
| Phase 2 | ✅ 完了 | `apps/mobile/theme/tokens.ts` を作成 |
| Phase 3 | ✅ 完了 | 最小 UI（ヘッダー・Intro・Composer・AgentBar）を作成 |
| Phase 4 | ✅ 完了 | MobileComposer を作成 |
| Phase 5 | ✅ 完了 | MobileAgentControlBar を作成 |
| Phase 6 | ✅ 完了 | MobileMessageBubble を作成 |
| Phase 7 | ✅ 完了 | MobileIntroScreen / MobileEmptyState を作成 |
| Phase 8 | ✅ 完了 | `packages/shared/README.md` を作成 |
| Phase 9 | ✅ 完了 | この docs ファイルを作成 |
| Phase 10 | 🔜 今後 | Firebase 実接続（Firestore） |
| Phase 11 | 🔜 今後 | Gemini API Proxy 経由の実接続 |
| Phase 12 | 🔜 今後 | EAS Build / App Store / Google Play 対応 |
| Phase 13 | 🔜 今後 | `packages/shared` へのロジック段階移行 |

---

## 未実装（今後の課題）

- Firebase / Firestore 接続
- Gemini API Proxy 経由の実接続
- OTHERS モード
- Debug / Compare / Inspector パネル
- App Store / EAS Build / Google Play 対応
- Sidebar / ナビゲーション本実装
- プッシュ通知
- オフライン対応
