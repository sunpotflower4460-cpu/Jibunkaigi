# じぶん会議 App Store 申請前 自動修正指示書

作成日: 2026-05-29  
対象: `apps/mobile` の Expo / React Native 版  
範囲: **AIエージェントやCIで自動修正できるコード・設定・ドキュメントのみ**  
除外: App Store Connect 画面入力、スクリーンショット作成、Apple Developer手続き、手動での実機確認、法務判断

---

## 0. 現状判定

このリポジトリは、App Store 提出対象が `apps/mobile` であることは明記されている。Expo / React Native / Expo Router 構成で、AI応答はモバイルアプリから Gemini API を直接呼ばず Cloudflare Worker Proxy 経由にする方針も整理済み。

一方で、申請前に自動修正しておくべき重要点が残っている。

- `apps/mobile/app.json` の iOS 設定が最小状態で、アイコン・スプラッシュ画像・プライバシー関連導線が不足している。
- `eas.json` が見当たらず、App Store 用ビルドプロファイルが未整備。
- Firebase 匿名認証で自動的にユーザーを作る設計だが、アプリ内から「アカウント/全データ削除」を開始する導線がない。
- ユーザーの入力文・会話履歴の一部が Cloudflare Worker / Google Gemini に送られるが、オンボーディング上の明示的な同意・説明が弱い。
- プライバシーポリシー / AI利用説明 / 免責 / サポート導線がアプリ内で容易に見つかる状態ではない。
- 「内省」「心の鏡」系のアプリなので、医療・カウンセリング・緊急相談と誤解されない安全文言と危機時の返答方針を追加した方がよい。
- Worker 側が本番利用としては緩く、CORS、入力長、履歴長、モックフォールバック、レート悪用対策のガードを強化した方がよい。

---

## 1. P0: 審査落ち・差し戻しを防ぐ必須自動修正

### 1-1. アプリ内に「プライバシー / AI利用 / サポート / データ削除」導線を追加する

#### 目的

Apple審査で見られやすい「ユーザーデータの扱い」「第三者AIへの共有」「問い合わせ先」「データ削除」を、アプリ内から迷わず確認できるようにする。

#### 実装指示

新規追加:

- `packages/shared/src/legal/legalContent.ts`
- `apps/mobile/components/legal/MobileLegalSheet.tsx`
- `apps/mobile/components/legal/MobileConsentCard.tsx` あるいはオンボーディング内に直接組み込み
- 必要なら `apps/mobile/state/useLegalConsent.ts`

既存変更:

- `packages/shared/src/index.ts` から legal content を export
- `apps/mobile/app/index.tsx` に Legal Sheet の state と表示導線を追加
- `apps/mobile/components/session/MobileSessionHeader.tsx` か `MobileSessionDrawer.tsx` に「設定 / プライバシー」ボタンを追加
- `apps/mobile/components/onboarding/MobileOnboardingScreen.tsx` に AI利用・保存・削除導線の短い説明を追加

#### 表示すべき内容

最低限、以下をアプリ内で表示する。

```txt
じぶん会議は、医療・診断・治療・緊急相談の代わりではありません。
深刻な危険や緊急の不安がある場合は、地域の緊急窓口や信頼できる人に連絡してください。

AI応答を生成するため、入力文と直近の会話履歴の一部が、じぶん会議のサーバー/Cloudflare Workerを経由してGoogle Geminiへ送信される場合があります。

Firebaseを有効にしている場合、セッション、メッセージ、表示名、匿名ユーザーIDが保存されます。
保存されたデータは、アプリ内の「データを削除」から削除できます。
```

#### 同意管理

- `AsyncStorage` に `jibunkaigi:legal-consent-v1` を保存する。
- オンボーディング完了前に、AI送信・Firebase保存に関する同意を明示する。
- 同意前は remote AI / remote storage を開始しない。
- 既存ユーザーで consent key がない場合は、次回起動時に Legal Sheet を表示して同意を求める。
- 同意文言は長すぎず、詳細は Legal Sheet で見られる形にする。

#### 完了条件

- 初回起動時に、AI利用とデータ保存の説明を読める。
- アプリ内の通常画面からいつでもプライバシー説明を開ける。
- 同意状態が `AsyncStorage` に保存される。
- 同意前に Gemini Proxy へユーザー入力を送らない。

---

### 1-2. 匿名Firebaseアカウントと全データ削除機能を追加する

#### 背景

現在の `mobileAuth.ts` は Firebase が使える場合に `signInAnonymously` で匿名ユーザーを作る。これはユーザー操作なしのゲストアカウント作成に近いため、アプリ内からデータ削除を開始できる導線を用意する。

#### 実装指示

既存変更:

- `apps/mobile/services/sessionRepository.ts`
  - `UniversalSessionRepository` に `deleteAllUserData(): Promise<void>` を追加。
  - `LocalSessionRepository` では全セッション削除と初期セッション再作成を行う。

- `apps/mobile/services/firebase/firestoreSessionRepository.ts`
  - `deleteAllUserData()` を実装。
  - 対象:
    - `artifacts/{appId}/users/{uid}/sessions/{sessionId}`
    - 各 `sessions/{sessionId}/messages/{messageId}`
    - `artifacts/{appId}/users/{uid}/profile/settings`
    - 可能なら `artifacts/{appId}/users/{uid}` 本体
  - Firestore batch は 500 件制限を超えないよう分割する。
  - 最後に `deleteUser(auth.currentUser)` を試行。
  - 失敗時は「再ログイン後に再試行」ではなく、匿名認証なので `reauthenticate` が難しい場合のメッセージを丁寧に返す。

- `apps/mobile/services/userProfileRepository.ts`
  - `deleteLocalProfile()` または `clearProfile()` を追加。
  - `AsyncStorage` の `jibunkaigi:user-profile` を削除。

- `apps/mobile/state/useUniversalOnboarding.ts`
  - `resetOnboarding()` で `jibunkaigi:onboarding-complete` だけでなく consent key も必要に応じて削除できるようにする。

新規追加:

- `apps/mobile/services/accountDeletion.ts`
  - `deleteJibunkaigiAccountAndData()` を実装。
  - Firestoreデータ削除、Firebase Auth匿名ユーザー削除、ローカルプロフィール、オンボーディング、同意キーの削除をまとめる。

UI追加:

- Legal / Settings Sheet 内に「すべてのデータを削除」ボタンを追加。
- 破壊的操作なので2段階確認にする。
- 削除成功後はオンボーディング前の状態に戻す。

#### 完了条件

- 設定/プライバシー画面から「すべてのデータを削除」を実行できる。
- Firestore保存セッション・メッセージ・プロフィール・匿名Authユーザー・ローカル保存が消える。
- 削除後に再起動しても過去セッションが復活しない。
- エラー時に、ユーザーへ分かる日本語メッセージを出す。

---

### 1-3. 「医療/カウンセリングではない」安全境界と危機時応答を追加する

#### 目的

`じぶん会議` は内省支援であり、医療・診断・治療・専門カウンセリングではない。この境界を UI とプロンプトの両方に入れる。

#### 実装指示

既存変更:

- `packages/shared/src/prompt/responsePolicy.ts`
  - 以下のような方針を追加する。

```ts
'医療・法律・金融などの専門判断として断定しない。',
'心理状態を診断しない。治療・カウンセリングの代替を名乗らない。',
'自傷他害・緊急性がある内容では、まず安全確保と地域の緊急窓口/信頼できる人への連絡を促す。',
'危機的内容では詩的表現より安全な案内を優先する。',
```

新規追加候補:

- `packages/shared/src/safety/crisisDetection.ts`
  - 日本語の軽量キーワード検知を実装。
  - 例: `死にたい`, `消えたい`, `自殺`, `殺したい`, `今から`, `首を`, `飛び降り`, `薬を大量`, `危ない`, `助けて`
  - 検知時は AI応答前に `safetyMode: 'crisis'` を prompt builder に渡す。

- `packages/shared/src/prompt/safetyPrompt.ts`
  - 危機時の追加プロンプトを分離。

UI:

- Legal Sheet とオンボーディングに短い境界文を追加。
- AIが危機対応したとき、下部に「緊急時は地域の救急/相談窓口へ」の小さな安全文を表示してもよい。

#### 完了条件

- 通常時はじぶん会議らしい余白を保つ。
- 危機ワードがある時は、詩的・比喩的返答より安全確保を優先する。
- 「診断します」「治療します」「カウンセラーです」といった文言が出ない。

---

### 1-4. 本番ビルドで mock fallback を隠れた本機能にしない

#### 背景

現在は Gemini Proxy 未設定時に mock fallback で動作する設計。開発中は便利だが、App Store提出版で意図せず mock が動くと、実機審査で「AI機能が実際には動いていない」または「説明と違う」と見られる可能性がある。

#### 実装指示

既存変更:

- `apps/mobile/config/mobileApiConfig.ts`
  - `EXPO_PUBLIC_JIBUNKAIGI_ENABLE_MOCK_AI` を追加。
  - `__DEV__` または env が明示的に `true` の時だけ mock を許可。

- `apps/mobile/services/ai/universalAiClient.ts`
  - 本番で Proxy 未設定なら mock に落とさず、ユーザー向けエラーを返す。
  - エラー文例: `AI接続の設定が未完了です。しばらくしてからお試しください。`

- `apps/mobile/components/status/MobileConfigNotice.tsx`
  - 本番では「開発用モックで動作中」表示を出さない。
  - 開発中だけ表示。

#### 完了条件

- 開発では mock fallback を使える。
- production build では Proxy 未設定時に mock 応答を返さない。
- App Store審査時に backend 未設定を見落とさない。

---

### 1-5. Cloudflare Worker Proxy の本番ガードを強化する

#### 実装指示

既存変更:

- `workers/jibunkaigi-gemini-proxy/src/index.ts`

追加するガード:

1. 入力長制限
   - `userText`: 最大 1200〜2000 文字
   - `messages`: 最大 20 件
   - 各 message text: 最大 800 文字
   - `userName`: 現状通り 24 文字でよい

2. CORS
   - `ALLOWED_ORIGIN` 未設定時に本番で `*` を返さない。
   - `APP_ENV=production` かつ `ALLOWED_ORIGIN` 未設定なら起動時/リクエスト時に 500 を返す。
   - Native App からのリクエストで Origin がない場合の扱いを明示する。必要なら `X-Jibunkaigi-Client` ヘッダーで簡易識別する。ただし公開アプリに埋める値は秘密ではないので、コスト防御の本命ではなく「誤アクセス低減」扱いにする。

3. エラーログ
   - Gemini upstream error の本文を丸ごと console に出さない。
   - status と短いコードだけにする。
   - ユーザー入力や会話履歴をログに残さない。

4. AI応答安全
   - Gemini API へ送る request に safety 設定を追加できる場合は追加する。
   - 空応答・JSON parse失敗時のエラーは現在のように一般化して返す。

5. レート/コスト対策
   - コード上では最低限、1リクエストあたりの最大入力を抑える。
   - Cloudflare側 Rate Limiting は手動設定なので本書では除外。ただし `docs/appstore-backend-ops.md` に手動設定項目として記録する。

#### 完了条件

- Worker単体テストで、巨大入力・大量messages・空userTextを拒否できる。
- productionで `ALLOWED_ORIGIN` 未設定のまま緩く公開されない。
- エラーログに本文や会話内容が出ない。

---

## 2. P1: 提出前品質を上げる自動修正

### 2-1. EAS Build 設定を追加する

#### 実装指示

新規追加:

- `apps/mobile/eas.json`

例:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {}
    }
  }
}
```

既存変更:

- `apps/mobile/package.json`
  - scripts 追加:

```json
"appstore:check": "npm run lint && npm run typecheck && npm run build:check",
"build:ios:production": "eas build --platform ios --profile production"
```

#### 注意

Apple ID / App Store Connect API Key / EAS secrets は手動系なので、この指示書では設定しない。

---

### 2-2. app.json を App Store 向けに補強する

#### 実装指示

既存変更:

- `apps/mobile/app.json`

追加/見直し:

- `expo.icon`: `./assets/icon.png`
- `expo.splash.image`: `./assets/splash-icon.png`
- `expo.ios.infoPlist.CFBundleDisplayName`: `じぶん会議`
- `expo.ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads`: `false`
- `expo.ios.usesAppleSignIn`: 今は不要。Google等の外部ログインを入れる時まで追加しない。
- `expo.ios.bundleIdentifier`: 現在 `com.jibunkaigi.mobile`。最終Bundle IDは手動確認対象だが、コード上は固定してよい。

新規追加:

- `apps/mobile/assets/icon.png`
- `apps/mobile/assets/adaptive-icon.png`
- `apps/mobile/assets/splash-icon.png`

自動生成する場合は、仮でもよいので以下の条件を満たす。

- 1024x1024 PNG
- 透明背景ではなく塗り背景
- 文字が小さすぎない
- App Storeで潰れない単純な形

---

### 2-3. App Privacy 用データ台帳を追加する

#### 実装指示

新規追加:

- `docs/appstore-privacy-data-map.md`

内容:

| データ | 保存/送信先 | 用途 | ユーザー削除 | App Privacy候補 |
|---|---|---|---|---|
| 表示名 | AsyncStorage / Firebase | 呼びかけ | 可 | User IDまたはOther User Content相当として要確認 |
| 会話本文 | Firebase / Cloudflare Worker / Google Gemini | セッション保存・AI応答生成 | 可 | User Content |
| 匿名UID | Firebase Auth | セッション紐付け | 可 | User ID / Identifier |
| 直近履歴 | Google Geminiへ送信 | AI応答生成 | サーバー保存しない方針 | User Content |
| クリップボード/共有 | OS機能 | ユーザー操作 | アプリ側保存なし | 収集なし |

この台帳は App Store Connect 入力そのものではなく、手入力時に迷わないための根拠資料として使う。

---

### 2-4. Privacy Manifest / Required Reason API の確認メモを追加する

#### 実装指示

新規追加:

- `docs/ios-privacy-manifest-audit.md`

内容:

- Expo SDK / React Native / Firebase / AsyncStorage が iOS ビルド時に Privacy Manifest を含むか確認する。
- FirebaseAuth / FirebaseCore / FirebaseFirestore は Apple の third-party SDK requirement 対象になり得るため、EAS build 後の Xcode archive で privacy report を確認する。
- `@react-native-async-storage/async-storage` は UserDefaults系 Required Reason API に関係する可能性があるため、Expo/RN側の manifest 対応状況を確認する。
- アプリ独自で native iOS コードを追加する場合は `PrivacyInfo.xcprivacy` を追加する。

ここでは自動で断定せず、EAS/Xcode生成物に対する監査手順を残す。

---

### 2-5. アクセシビリティと審査中操作性の最低限補強

#### 実装指示

既存コンポーネント全体を軽く点検し、以下を追加する。

- 主要な `TouchableOpacity` に `accessibilityRole="button"`
- アイコンだけのボタンに `accessibilityLabel`
- 削除・クリア操作に確認ダイアログ
- 通信中/思考中のボタン連打防止
- iPhone SE相当の小さな画面でオンボーディング/設定/会話入力がはみ出さないように ScrollView 化

優先ファイル:

- `apps/mobile/components/session/MobileSessionHeader.tsx`
- `apps/mobile/components/session/MobileSessionDrawer.tsx`
- `apps/mobile/components/composer/MobileComposer.tsx`
- `apps/mobile/components/chat/MobileMessageBubble.tsx`
- `apps/mobile/components/onboarding/MobileOnboardingScreen.tsx`

---

## 3. P2: 申請の印象を上げる自動修正

### 3-1. App Review Notes 用の技術説明メモを追加する

新規追加:

- `docs/appstore-review-notes-draft.md`

内容:

```txt
じぶん会議は、内省のためのAI対話アプリです。
医療、診断、治療、緊急相談の代替ではありません。
ユーザーは問いを入力し、複数の視点から返答を受け取ります。
AI応答生成のため、入力文と直近の会話履歴の一部がCloudflare Workerを経由してGoogle Geminiへ送信されます。
Firebaseを有効にしている場合、匿名ユーザーIDに紐づいてセッションとメッセージが保存されます。
アプリ内の設定/プライバシー画面から、保存データと匿名アカウントの削除を開始できます。
```

App Store Connectへの貼り付け自体は手動なので、このファイルは下書きに留める。

---

### 3-2. リリース用チェックコマンドをCI化する

新規追加または変更:

- `.github/workflows/mobile-appstore-check.yml`

実行内容:

```bash
cd packages/shared && npm ci && npm run typecheck
cd ../../apps/mobile && npm ci && npm run lint && npm run typecheck && npm run build:check
```

PR時と手動実行で回せるようにする。

---

## 4. 自動修正の推奨順

1. P0-1 Legal / Privacy / AI consent 導線
2. P0-2 Account & Data deletion
3. P0-3 Safety boundary / crisis response
4. P0-4 Production mock fallback guard
5. P0-5 Worker production guard
6. P1-1 EAS build config
7. P1-2 app.json + assets
8. P1-3 App Privacy data map
9. P1-4 Privacy Manifest audit memo
10. P1-5 Accessibility polish
11. P2 Review notes / CI

---

## 5. 完了判定コマンド

```bash
cd packages/shared
npm install
npm run typecheck

cd ../../apps/mobile
npm install
npm run lint
npm run typecheck
npm run build:check

cd ../../workers/jibunkaigi-gemini-proxy
npm install
npm run typecheck
```

可能なら追加:

```bash
cd apps/mobile
npx expo-doctor
npx eas build:configure
```

`eas build` 実行、Apple Developer連携、TestFlight確認は手動系なので本指示書の範囲外。

---

## 6. この指示書であえてやらないこと

- App Store Connect の説明文、キーワード、年齢区分、価格、スクリーンショット登録
- Apple Developer / EAS / Firebase / Cloudflare の実アカウント設定
- 法務的に確定したプライバシーポリシー文章の作成
- 医療・心理・カウンセリング領域としての専門監修
- 有料課金やサブスク実装
- 広告SDK導入

---

## 7. AIエージェントへの短縮指示

以下をそのまま GitHub Copilot / Cloud Agent に渡してよい。

```txt
対象は apps/mobile の Expo 版です。App Store 申請前に、自動修正できる範囲だけを実装してください。
優先順位は docs/appstore-auto-fix-instructions.md の P0 から順番です。
まず Legal / Privacy / AI consent 導線を作り、次に匿名Firebaseアカウントと全データ削除機能、次に医療/カウンセリングではない安全境界と危機時応答、次に production mock fallback guard、次に Worker production guard を実装してください。

手動作業はしないでください。App Store Connect登録、スクショ作成、Apple/EAS/Cloudflare/Firebaseの実設定、法務判断は除外です。
実装後、以下を通してください。
- cd packages/shared && npm run typecheck
- cd apps/mobile && npm run lint && npm run typecheck && npm run build:check
- cd workers/jibunkaigi-gemini-proxy && npm run typecheck

既存のじぶん会議らしい世界観は壊さず、審査上必要なプライバシー・安全・削除導線だけを静かに足してください。
```
