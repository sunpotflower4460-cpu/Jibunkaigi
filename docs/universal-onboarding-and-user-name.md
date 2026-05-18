# Universal Onboarding and User Name

## 目的
旧Vite Web版の初回体験とユーザー名設定を、Expo Universal版へ同等の導線として移植する。

## 旧Vite Web版で確認したこと
- `src/components/dialogs/IntroOverlay.jsx` はフルスクリーン導入で、「導かない。照らすだけ。歩くのは、あなた自身。」を主役にしつつ、`問いを書く / 視点を呼ぶ / 心の鏡で映す` と CTA `会議をはじめる` を並べている。
- `src/App.jsx` は `localStorage` の `jibunkaigi_intro_seen` で初回表示を判定し、開始後は再表示しない。
- `src/components/dialogs/UserNameDialog.jsx` は `お名前を教えてください` と 24文字上限を持ち、会議メンバーからの呼ばれ方として保存する。
- `src/App.jsx` は Firestore `artifacts/{appId}/users/{uid}/profile/settings` の `displayName` を読み書きしている。

## 方針
- 初回オンボーディングを簡易説明にしない。
- userName は会話の温度に関わるため、保存・復元・AI request 引き渡しまで含めて扱う。
- iOS / Android / Web で同じ導線にする。
- 差分は Feature Parity Checklist と Gap Register に残す。

## 実装内容
- `packages/shared/src/onboarding/` に onboarding content / types を追加し、旧Vite Web版の入口文言を Expo でも共通利用できるようにした。
- `packages/shared/src/user/` に user profile type / normalize utility を追加し、デフォルト名 `あなた` と 24文字制限を共通化した。
- `apps/mobile/services/userProfileRepository.ts` で AsyncStorage + Firestore profile/settings を使った userName 保存/復元を追加した。
- `apps/mobile/state/useUniversalOnboarding.ts` で onboarding 完了状態と userName を読み込み、初回導線を永続化した。
- `apps/mobile/components/onboarding/` に `MobileOnboardingScreen` / `MobileOnboardingStep` を追加し、Expo でもフルスクリーン導入を出せるようにした。
- `apps/mobile/components/user/` に `MobileUserNameSheet` / `MobileUserNameTrigger` を追加し、Header から名前変更を開けるようにした。
- `apps/mobile/app/index.tsx` で初回オンボーディングと既存 `MobileIntroScreen` を分離し、初回説明と会話前ヒントを混同しないようにした。
- `apps/mobile/state/useUniversalConversation.ts` と AI client 群で `userName` を reply / OTHERS request に渡すようにした。
- `workers/jibunkaigi-gemini-proxy/src/index.ts` で `userName` を trim したうえで prompt builder に渡すようにした。

## まだやらないこと
- Apple / Googleログイン
- アカウント削除
- ユーザーアイコン / プロフィール画像
- 複数端末間の正式ユーザーアカウント同期
- 課金
- Push通知
- AI実応答の本番env確認
