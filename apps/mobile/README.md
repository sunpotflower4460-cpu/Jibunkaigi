# jibunkaigi-mobile

じぶん会議の Expo 版（iOS / Android / Expo Web）の基盤です。

---

## 重要な位置づけ

| 用途 | 場所 | 技術 |
|---|---|---|
| **Web 版** | リポジトリルート `src/` | Vite + Cloudflare Workers |
| **ストア提出対象（主戦場）** | この `apps/mobile/` | Expo + React Native |

**ストア提出対象は `apps/mobile` です。Web版（ルート `src/`）は並行運用中のプロダクトです。**

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

## Manual Environment Gate

Firebase / Gemini Proxy の実接続は手動ゲートです。
実値やsecretはGitHubにコミットしません。

手順:
- `../../docs/environment-setup-gate.md`
- `../../docs/env-setup-guide.md`
- `../../docs/manual-environment-gate-checklist.md`
- `../../docs/universal-real-ai-firebase-qa.md`

---

## ディレクトリ構成

```
apps/mobile/
  app/
    _layout.tsx       # Expo Router ルートレイアウト
    index.tsx         # メイン画面
  components/
    chat/             # MobileMessageBubble / MobileChatTimeline / MobileEmptyState / MobileThinkingIndicator
    composer/         # MobileComposer / MobileAgentControlBar
    modes/            # MobileModeSelector（一閃 / 対話 / 深淵）
    intro/            # MobileIntroScreen
    layout/           # MobileAppShell / MobileBackground
    session/          # MobileSessionHeader
  state/
    mobileTypes.ts          # Universal* 型定義 + Mobile* エイリアス
    useUniversalConversation.ts  # モード対応会話フック
  services/
    universalAgentMock.ts   # モード対応疑似エージェント応答
    universalSessionLocal.ts # ローカルセッション管理
  theme/
    tokens.ts         # カラー / スペーシング / タイポ定数（design-tokens.css の RN 版）
  assets/             # アイコン・スプラッシュ等（今後追加）
```

---

## Gemini Proxy

Expo Universal版はGemini APIを直接呼びません。
AI応答は以下の流れで取得します。

```
Expo Universal App
  → Cloudflare Worker Proxy
  → Gemini API
```

Expo側には `EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL` だけを設定します。
Gemini API KeyはCloudflare Workerのsecretとして設定します。
Proxy未設定時はmock fallbackで動作します。

詳細は `../../docs/universal-gemini-proxy.md` を参照してください。

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
`apps/mobile/.env` や `EXPO_PUBLIC_*` に Gemini API Key を入れてはいけません。
詳細は `../../docs/expo-universal-plan.md` を参照してください。

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

## Full Parity Principle

`apps/mobile` は「モバイル用簡易版」ではありません。  
最終目標は、旧Vite Web版じぶん会議をUI・機能・文言・導線・挙動まで可能な限り100%そのままExpo Universal化することです。

- Web版にある導線を勝手に消さない
- UIを簡略化しない
- iOS / Android / Expo Webを別プロダクトとして扱わない
- 未実装や未確認を隠さず、Gap Registerへ残す

関連ドキュメント:

- `../../docs/full-parity-audit.md`
- `../../docs/full-parity-gap-register.md`
- `../../docs/full-parity-implementation-roadmap.md`
- `./docs/full-parity-notes.md`

詳細な方針・チェックリスト・UI対応表・デザイントークン対応は `../../docs/` を参照してください。

- `../../docs/universal-parity-contract.md` — Universal方針の憲法
- `../../docs/universal-feature-parity-checklist.md` — 機能パリティチェックリスト
- `../../docs/universal-ui-map.md` — Web UIとExpo UIの対応表
- `../../docs/universal-design-tokens.md` — デザイントークン対応表

---

## 現状

残タスクは「最小UIの器」ではなく、Full Parity基準で管理します。  
未一致 / 部分一致 / 未確認の項目は `../../docs/full-parity-gap-register.md` を基準に消し込みます。
