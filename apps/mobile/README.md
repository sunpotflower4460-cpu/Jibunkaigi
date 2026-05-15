# jibunkaigi-mobile

じぶん会議の Expo 版（iOS / Android / Expo Web）の基盤です。

---

## 重要な位置づけ

| 用途 | 場所 | 技術 |
|---|---|---|
| **本番 Web（現行）** | リポジトリルート `src/` | Vite + Cloudflare Workers |
| **iOS / Android / Expo Web** | この `apps/mobile/` | Expo + React Native |

**既存 Web 版（ルートの `src/` / `package.json`）は本番環境です。このディレクトリは触りません。**

---

## セットアップ

```bash
cd apps/mobile
npm install
```

## 起動

```bash
npm run web       # Expo Web で確認
npm run ios       # iOS シミュレーター（要 Xcode）
npm run android   # Android エミュレーター（要 Android Studio / SDK）
```

## Lint / 型チェック

```bash
npm run lint      # expo lint
npx tsc --noEmit  # TypeScript 型チェック
```

---

## ディレクトリ構成

```
apps/mobile/
  app/
    _layout.tsx       # Expo Router ルートレイアウト
    index.tsx         # メイン画面
  components/
    chat/             # MobileMessageBubble / MobileChatTimeline / MobileEmptyState
    composer/         # MobileComposer / MobileAgentControlBar
    intro/            # MobileIntroScreen
    layout/           # MobileAppShell / MobileBackground
  theme/
    tokens.ts         # カラー / スペーシング / タイポ定数（design-tokens.css の RN 版）
  assets/             # アイコン・スプラッシュ等（今後追加）
```

---

## Gemini API Key について

**モバイルアプリに Gemini API Key を直埋めしてはいけません。**

推奨構成：

```
Expo App
  ↓
Cloudflare Worker (API Proxy)
  ↓
Gemini API
```

API Key はサーバー側（Cloudflare Worker）の環境変数で管理してください。
詳細は `docs/expo-universal-plan.md` を参照してください。

---

## Firebase について

Firestore のデータ構造は既存 Web 版と揃えます：

```
artifacts/{appId}/users/{uid}/sessions/{sessionId}
artifacts/{appId}/users/{uid}/sessions/{sessionId}/messages/{messageId}
```

開発中は `appId` を `self-conf-v10-mobile-dev` など別値にしてよいです。

---

## Universal方針

この `apps/mobile` は名前上 mobile だが、今後は iOS / Android / Expo Web を同じUI・同じ機能で提供する Expo Universal App として育てる。
App Store版を主戦場としながら、Android / Web でも同じ体験を提供する。
旧Vite Web版は、Expo Universal版が完全に追いつくまでの比較元・移行元・保険として扱う。

詳細な方針・チェックリスト・UI対応表・デザイントークン対応は `docs/` を参照してください。

- `docs/universal-parity-contract.md` — Universal方針の憲法
- `docs/universal-feature-parity-checklist.md` — 機能パリティチェックリスト
- `docs/universal-ui-map.md` — Web UIとExpo UIの対応表
- `docs/universal-design-tokens.md` — デザイントークン対応表

---

## 現状（未実装）

- Firebase / Firestore 接続
- Gemini API Proxy 経由の実接続
- セッション同期
- App Store / EAS Build / Google Play 対応
- OTHERS / Debug / Compare / Inspector

まずは **iOS / Android / Expo Web で動く最小 UI の器** として使ってください。
