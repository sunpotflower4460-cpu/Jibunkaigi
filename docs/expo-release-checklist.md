# Expo Release Checklist

## 1. EAS Build 設定

- [ ] `apps/mobile/app.json` の `ios.buildNumber` と `android.versionCode` を更新した
- [ ] `eas.json` の `build.production` プロファイルでビルドできる
- [ ] `eas.json` の `submit.production.ios` に App Store Connect 情報を設定した

## 2. 環境変数

- [ ] `EXPO_PUBLIC_JIBUNKAIGI_APP_ID` を設定した
- [ ] Firebase 用 `EXPO_PUBLIC_FIREBASE_*` を設定した
- [ ] Gemini API Key を `EXPO_PUBLIC_*` に入れていない（Worker secretのみ）

## 3. リリース検証

- [ ] `cd packages/shared && npm run typecheck` が通る
- [ ] `cd apps/mobile && npm run lint && npm run typecheck` が通る
- [ ] `cd apps/mobile && npm run build:check` が通る

## 4. App Store Connect

- [ ] App 情報（名前、SKU、Bundle ID）が一致している
- [ ] スクリーンショット、説明文、年齢区分を更新した
- [ ] TestFlight で実機確認した
