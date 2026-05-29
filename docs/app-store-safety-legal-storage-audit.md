# Jibunkaigi Phase RS-1: App Store 向け Safety / Legal / Storage 監査

## 0. この監査の前提

- このフェーズは **実装ではなく棚卸し** を目的とする。
- 対象は `apps/mobile` を中心とした Jibunkaigi 本体の現状と、参考実装 `Jibunkaigi-hajimenovan` の良い要素の差分整理である。
- この文書では App Store 初回版に必要な最小セットを明確にするが、**最終法務文言そのものはまだ確定しない**。
- 参考にした主な本体側ファイル:
  - `apps/mobile/app/index.tsx`
  - `apps/mobile/state/useUniversalOnboarding.ts`
  - `apps/mobile/state/useUniversalConversation.ts`
  - `apps/mobile/services/sessionRepository.ts`
  - `apps/mobile/services/firebase/firestoreSessionRepository.ts`
  - `apps/mobile/components/status/MobileStatusStrip.tsx`
  - `apps/mobile/components/status/MobileConfigNotice.tsx`
  - `apps/mobile/components/status/MobileErrorNotice.tsx`
  - `apps/mobile/components/chat/MobileDeleteMessageSheet.tsx`
  - `apps/mobile/config/mobileApiConfig.ts`
  - `apps/mobile/services/ai/universalAiClient.ts`
  - `docs/expo-release-checklist.md`
  - `docs/full-parity-gap-register.md`
  - `docs/reflection-shelf-port-plan.md`
- 参考にした `hajimenovan` 側の主な要素:
  - `src/data/legal.ts`
  - `src/components/SettingsPanel.tsx`
  - `src/components/CloudSaveStatusBadge.tsx`
  - `src/components/IntroLegalSoftener.tsx`
  - `src/components/DiveDialogGuard.tsx`
  - `src/services/cloud/firebaseCloud.ts`
  - `src/services/storage.ts`

## 1. 現状サマリー

| 領域 | Jibunkaigi本体の現状 | hajimenovan参考 | 判定 | 優先度 |
|---|---|---|---|---|
| 利用規約 | アプリ内で再確認できる利用規約データや表示導線は見当たらない。 | `src/data/legal.ts` に利用規約文面を保持し、設定から参照できる。 | 未実装 | P0 |
| プライバシーポリシー | アプリ内表示導線なし。リリース系 docs に必要性の記述はあるが、ユーザー向け導線は未配置。 | `src/data/legal.ts` と `SettingsPanel.tsx` に参照元がある。 | 未実装 | P0 |
| 非医療注意 | App Store 向けの非医療 / 非診断 / 非治療の明示は本体 UI に未配置。 `docs/full-parity-gap-register.md` でも未一致扱い。 | `src/data/legal.ts` と `IntroLegalSoftener.tsx` で柔らかく境界を示している。 | 未実装 | P0 |
| 緊急時案内 | 危機時に身近な人や専門機関へ相談する案内は本体 UI に見当たらない。 | `src/data/legal.ts` に crisis resources がある。 | 未実装 | P0 |
| 保存状態表示 | `MobileStatusStrip.tsx` で `Remote / ローカルのみ` や `Proxy / ローカル応答` は見えるが、「今どこに保存されたか」の説明は薄い。 | `CloudSaveStatusBadge.tsx` と `SettingsPanel.tsx` が状態と意味を分けて見せている。 | 要改善 | P0 |
| 端末内削除 | メッセージ個別削除確認はあるが、端末内データ全削除や保存領域説明はない。現状 local fallback も会話データは永続 local ではなく in-memory。 | `SettingsPanel.tsx` と `storage.ts` に clearLocalState 相当の考え方がある。 | 要改善 | P0 |
| クラウド削除 | セッション単位削除はあるが、クラウドデータ全削除や匿名ユーザー削除導線は見当たらない。 | `SettingsPanel.tsx` と `firebaseCloud.ts` でクラウド削除導線がある。 | 未実装 | P0 |
| APIキー保護 | `apps/mobile` 側に Gemini API key を直接置く構成ではなく、`EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL` 経由の proxy 前提。 `docs/expo-release-checklist.md` も同方針。 | `docs/gemini-api-manual-setup.md` でも直接埋め込みを避けている。 | ほぼOK | P0 |
| AI接続状態 | status chip はあるが、mock fallback / proxy / 失敗時の意味が設定画面から再確認できない。 dev-only notice も本番では見えない。 | `SettingsPanel.tsx` が接続状態の説明を補っている。 | 要改善 | P1 |
| Reflection Shelfデータ削除 | 未実装予定。 `docs/reflection-shelf-port-plan.md` では今後の保存・削除導線に含める前提が示されている。 | hajimenovan には付箋 / 会議録系の保存前提がある。 | 未実装 | P1 |

## 2. 現状の確認メモ

### 2-1. 法務・注意文言

- `apps/mobile/app/index.tsx` には会話開始前の導入や status 表示はあるが、利用規約・プライバシーポリシー・危機時案内の明示導線はない。
- `apps/mobile/state/useUniversalOnboarding.ts` で永続化しているのは onboarding 完了と userName で、legal / privacy 同意の保存はない。
- `docs/full-parity-gap-register.md` に `FP-011 App Store向け非医療/非診断文言確認` が残っており、未解消課題として認識済み。

### 2-2. 保存状態

- `apps/mobile/services/firebase/firestoreSessionRepository.ts` では Firebase 設定時に Firestore 保存が動く。
- `apps/mobile/services/sessionRepository.ts` の local fallback は会話セッションに関しては in-memory 実装であり、ユーザーが期待する「端末内保存」とはまだ一致しない。
- `apps/mobile/components/status/MobileStatusStrip.tsx` は status の存在自体は良いが、App Store 初回版に必要な「保存場所の透明性」を満たすには説明不足。
- `apps/mobile/components/status/MobileConfigNotice.tsx` は `__DEV__` 条件付きのため、本番では Firebase / Gemini 未設定の説明として頼れない。

### 2-3. データ削除導線

- `apps/mobile/components/chat/MobileDeleteMessageSheet.tsx` によりメッセージ個別削除の確認 UI は存在する。
- セッション削除はあるが、端末内データ全削除、クラウドデータ全削除、匿名ユーザー削除、将来の Reflection Shelf データ一括削除は未整理。
- App Store 向けには「何を消すか」「端末内だけか、クラウドも含むか」を分けて示す必要がある。

### 2-4. AI API 接続の安全性

- `apps/mobile/config/mobileApiConfig.ts` と `apps/mobile/services/ai/*` から見る限り、mobile クライアントに Gemini API key を直接持たせない構成になっている。
- proxy 未設定や失敗時には fallback 応答へ戻るため、アプリが即座に壊れない点は良い。
- 一方で本番ユーザーにとっては「今は proxy 応答なのか / fallback なのか / 保存は cloud なのか」が分かりにくい。
- `docs/expo-release-checklist.md` は `EXPO_PUBLIC_*` に Gemini key を置かない前提で整合しているが、運用時は Worker secret / CORS / 本番 env 確認を継続する必要がある。

## 3. hajimenovan から参考にすべき要素

### 3-1. そのままコピーせず、考え方だけ持ち込む要素

- `src/data/legal.ts`
  - 利用規約、プライバシーポリシー、危機時リソース、非医療注意を一箇所で管理する考え方。
- `src/components/SettingsPanel.tsx`
  - 設定から legal / privacy / storage / delete / AI 接続状態を見返せる構成。
- `src/components/CloudSaveStatusBadge.tsx`
  - 「端末内保存」「クラウド準備中」「保存中」「保存済み」「エラー時は端末内扱い」の切り分け。
- `src/services/storage.ts`
  - 壊れた保存データの読み飛ばし、保存件数上限、clearLocalState のような削除責務の分離。
- `src/services/cloud/firebaseCloud.ts`
  - クラウド保存の有効 / 無効と削除導線を別責務にしている点。

### 3-2. Jibunkaigi 本体に合わせて読み替える点

- `localStorage` / IndexedDB 前提は Expo / Web / Android 共通の保存基盤へ置き換える。
- Web の設定パネル構成をそのまま移植せず、mobile ではシートや設定カード構成へ分解する。
- legal 文言は `hajimenovan` の tone を参考にしつつ、Jibunkaigi 本体の「導かない。照らすだけ。」に合う表現へ調整する。

## 4. App Store 初回版に必須の最小セット

### 必須

- 非医療 / 非診断 / 非治療の明示
- 緊急時は専門機関・身近な人へ相談する案内
- プライバシーポリシー
- 利用規約
- データ保存場所の説明
- データ削除導線
- APIキーをアプリ内に置かない方針確認

### 強く推奨

- 保存状態バッジ
- 設定画面から法務文言を再確認できる導線
- クラウド保存が未設定 / 無効な場合の分かりやすい表示
- 端末内保存とクラウド保存の違いの説明
- Reflection Shelf追加後の付箋・会議録削除方針

### 後回し可

- AI接続テストボタン
- 広告 / 課金の詳細表示
- 高度なクラウド同期管理
- デザイン演出系

## 5. 実装候補ファイル案

本体の現在構成を前提にすると、次フェーズでは以下の配置が自然。

- `apps/mobile/data/legalContent.ts`
  - 利用規約、プライバシーポリシー、非医療注意、緊急時案内の元データ。
- `apps/mobile/components/settings/MobileLegalSheet.tsx`
  - legal / privacy / non-medical / emergency の再確認導線。
- `apps/mobile/components/settings/MobileStorageStatusCard.tsx`
  - 端末内保存 / クラウド保存 / fallback / 未設定の説明。
- `apps/mobile/components/settings/MobileDataDeleteSection.tsx`
  - 端末内削除、クラウド削除、将来の Reflection Shelf 削除入口。
- `apps/mobile/components/status/MobileSaveStatusBadge.tsx`
  - 既存 `MobileStatusStrip.tsx` を補完する、より明示的な保存状態表示。
- `apps/mobile/services/legalConsentStorage.ts`
  - 法務文言の既読・同意の保存が必要になった場合の薄い storage adapter。
- `apps/mobile/services/reflectionShelfRepository.ts`
  - 付箋 / 会議録 / 将来の派生データ保存責務の受け皿。
- `apps/mobile/services/reflectionShelfStorage.ts`
  - Reflection Shelf 専用の local / remote 保存切り分けを将来必要に応じて分離。

既存の導線候補としては以下が使いやすい。

- `apps/mobile/components/session/MobileSessionDrawer.tsx`
  - 設定入口や legal / storage / delete のハブ候補。
- `apps/mobile/components/intro/*`
  - 初回導線での soft notice 追加候補。
- `apps/mobile/components/status/*`
  - status badge / warning / explanatory card の配置候補。

## 6. Reflection Shelf との関係

今後追加する以下のデータは、設定 / 削除導線に **最初から含める前提** で設計した方がよい。

- どう思う？付箋
- 会議録
- 言葉の水面用の派生データ
- 自分の輪郭用の集計データ

整理方針:

- 付箋と会議録は、ユーザーが明示的に残すデータとして削除対象へ含める。
- 言葉の水面と自分の輪郭が会話・会議録・付箋から都度再計算できるなら、**個別永続化しない方が安全**。
- 派生データを保存しない場合でも、「再計算で再生成される表示データ」であることを設定画面で説明できると誤解が少ない。
- 将来削除導線を作る際は、以下を分けるべき。
  - 会話データ削除
  - Reflection Shelf のユーザー追記データ削除
  - 派生キャッシュ削除
  - クラウド側の同名データ削除

## 7. 注意すべき表現

App Store 審査や安全性の観点で、以下の表現は避ける方がよい。

- 治す
- 診断する
- メンタルを改善すると断定する
- 必ず良くなる
- 専門家の代わりになる
- 緊急時にも使える
- 医療的助言を行う
- 心理療法であると誤認される表現

Jibunkaigi らしい置き換え例:

- 「治す」ではなく「見つめる」
- 「診断」ではなく「内省の補助」
- 「解決する」ではなく「問いを整理する」
- 「正解を出す」ではなく「自分の声を照らす」
- 「導く」より「照らす」
- 「専門家の代わり」ではなく「自分の考えを落ち着いて見返すための補助」

補足:

- 非医療注意は強すぎる警告文に寄せすぎず、Jibunkaigi の tone を保つ必要がある。
- ただし曖昧すぎると危機時案内や境界説明として不足するため、初回導線と設定再確認導線の両方で補うのがよい。

## 8. 次フェーズ案

### RS-1A: legal 文言の本体側配置

- legal / privacy / non-medical / emergency の元データ配置先を決める。
- App Store 提出文面、初回導線、設定画面の共通ソースを分けずに管理する。

### RS-1B: 設定画面に legal / privacy / non-medical notice 導線追加

- 設定または session drawer から再確認できる入口を追加する。
- 初回表示だけで終わらず、後から見返せる状態にする。

### RS-1C: 保存状態表示の追加

- 現在の `MobileStatusStrip.tsx` を補完し、「端末内のみ / クラウド接続済み / 保存中 / 保存失敗」の意味を明示する。
- Firebase 未設定時に誤って「保存済み」と誤認しない表現へ揃える。

### RS-1D: 端末内データ削除 / クラウドデータ削除の整理

- メッセージ個別削除、セッション削除、端末内全削除、クラウド全削除の責務を分ける。
- 確認ダイアログと説明文を先に設計し、誤操作を減らす。

### RS-1E: Reflection Shelf データ削除方針の追加

- 付箋、会議録、派生データ、集計データをどこまで永続化するかを決める。
- 再計算できるものは個別保存しない前提も含めて整理する。

## 9. この監査時点での結論

### すでに良い点

- mobile クライアントに Gemini API key を直接埋め込まない方針は概ね守られている。
- proxy 失敗時に fallback で壊れにくくする設計はある。
- メッセージ個別削除確認 UI はすでに存在する。
- 既存 docs でも App Store 向け gap は認識済みで、今から整理しやすい状態にある。

### App Store 初回版で不足している点

- legal / privacy / non-medical / emergency をユーザーが見つけられる導線
- 保存場所の明快な説明
- 端末内削除とクラウド削除の分離
- fallback 時の意味づけを含む AI / cloud status の分かりやすさ
- Reflection Shelf を見据えた削除対象の整理

### 優先順位のまとめ

1. legal / privacy / non-medical / emergency
2. 保存場所の透明性
3. 端末内削除 / クラウド削除
4. AI 接続状態の説明
5. Reflection Shelf データ削除方針
