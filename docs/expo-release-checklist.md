# Expo Release Checklist

## 1. EAS Build 設定

- [ ] `apps/mobile/app.json` の `ios.buildNumber` と `android.versionCode` を更新した
- [ ] `eas.json` の `build.production` プロファイルでビルドできる
- [ ] App Store Connect 情報はローカル/CI の `eas.json` override または EAS secrets で設定した（リポジトリの `eas.json` にプレースホルダは置かない）

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

## 5. RS-7 統合 QA

- [ ] 会話送信、エージェント応答、心の鏡 / 委ねる / OTHERS が崩れていない
- [ ] セッション切替・編集・削除と Reflection Shelf の付箋 / 会議録 / 水面 / 輪郭が共存して動く
- [ ] 「潜る」が会話本体より目立ちすぎず、小さい iPhone 幅でも余白・safe area が崩れない
- [ ] 利用規約 / プライバシー / 非医療注意 / 緊急時案内がオンボーディングと会議一覧から見つけられる
- [ ] 保存状態表示、セッション削除、全体削除方針、Reflection Shelf データ方針が矛盾なく読める
- [ ] API 未設定 / fallback 時の文言が開発者向けに寄りすぎず、本番画面に dev-only 表示が残っていない
- [ ] iOS / Android / Web と narrow viewport で主要導線を確認し、残る実機課題は Issue または docs に追記した
