# Full Parity Gap Register

## Gap IDルール
- FP-001: 初回オンボーディング
- FP-002: AI実応答確認
- FP-003: ユーザー名変更
- FP-004: 入力欄開閉
- FP-005: FloatingAgentBar
- FP-006: 旧Vite Webとの文言差分確認
- FP-007: 旧Vite WebとのUI配置差分確認
- FP-008: iOS/Android/Expo Web実機QA
- FP-009: Firebase/Firestore本番env確認
- FP-010: Gemini Proxy本番env確認
- FP-011: App Store向け非医療/非診断文言確認
- FP-012: メッセージ個別削除導線
- FP-013: OTHERS / Reaction導線

## FP-001 初回オンボーディング
状態: 追加修正済み / 実機QA待ち  
優先度: P0

旧Vite Web:
- `IntroOverlay`でフルスクリーン導入を表示する
- 文言は「導かない。照らすだけ。歩くのは、あなた自身。」を主役にし、3ステップとCTA「会議をはじめる」を添える
- `localStorage`の`jibunkaigi_intro_seen`で初回のみ表示する

Expo Universal:
- `MobileOnboardingScreen` でフルスクリーン導入を追加した
- onboarding content は shared 化し、Web由来の文言を寄せて利用する
- onboarding 完了状態は永続化し、`MobileIntroScreen` は会話前ヒント導線として分離した

必要対応:
- iOS / Android / Expo Web の実機QAで safe area、文言、初回のみ表示を確認する
- 差分が見つかった場合は Gap Register へ追記する

完了条件:
- iOS / Android / Expo Webで旧Vite Web版と同等の初回体験になる

## FP-002 AI実応答確認
状態: Manual Gate待ち  
優先度: P0

旧Vite Web:
- Firebase / Gemini envが揃うと本番AI応答を返す

Expo Universal:
- `createUniversalAiReply`はGemini Proxy優先だが、失敗時はmock fallbackへ戻る
- コード上はstatus表示できるが、本番envでの疎通記録はManual Gate後に残す

必要対応:
- Firebase / Gemini env の手動設定を完了する
- iOS / Android / Expo Webでmock fallbackではなく本番AI応答が返ることを確認する
- 応答元、失敗時表示、fallback発火条件を記録する

完了条件:
- 3プラットフォームで本物のAI応答確認結果が残っている

## FP-003 ユーザー名変更
状態: 実装済み / QA待ち  
優先度: P0

旧Vite Web:
- サイドバーのプロフィール導線から`UserNameDialog`を開ける
- Firestore profileへ`displayName`を保存し、会議メンバーからの呼称に使う

Expo Universal:
- `MobileUserNameSheet` / `MobileUserNameTrigger` を追加した
- `useUniversalOnboarding` と `userProfileRepository` で userName を保存・復元する
- AI / OTHERS request と worker prompt builder に userName を渡す

必要対応:
- iOS / Android / Expo Web の実機QAで Header 導線、保存復元、呼称反映を確認する
- 本番Firestore / Gemini Proxy env での実疎通結果を別フェーズで記録する

完了条件:
- iOS / Android / Expo Webで旧Vite Web版と同等にユーザー名変更・保存・呼称反映が動作する

## FP-004 入力欄を閉じる/開く
状態: 実装済み / QA待ち  
優先度: P0

旧Vite Web:
- `Composer`の閉じるボタンと`AgentControlBar`の「綴る / 閉じる」で入力欄を開閉できる

Expo Universal:
- `composerVisibility` と `MobileComposer` の collapsed/open 導線を追加した
- `綴る / 閉じる / 問いを綴る` を shared label 化した

必要対応:
- `MobileSafeLayout` / bottom dock / bottom spacer 反映後の iOS / Android / Expo Web 実機QAで keyboard と safe area を確認する
- `綴る / 閉じる` の表示文言と helper text 差分が残る場合は別 gap へ切り出す

完了条件:
- `綴る / 閉じる` 導線と collapsed hint が 3 プラットフォームで確認される

## FP-005 FloatingAgentBar
状態: 追加修正済み / 実機QA待ち  
優先度: P0

旧Vite Web:
- 初回入力後に固定下部バーが出現し、折りたたみ/展開、心の鏡、委ねる、各エージェント、OTHERS導線を持つ

Expo Universal:
- `MobileFloatingAgentBar` を追加し、会話後に固定下部トグルと compact agent bar を表示する

必要対応:
- `MobileFloatingAgentBar` を bottom dock 高さ基準へ寄せた後の iOS / Android / Expo Web 実機QAで safe area / keyboard との重なりを確認する
- selection bar として残した意図的差分を必要に応じて再評価する

完了条件:
- 固定下部の折りたたみ導線と agent quick access が 3 プラットフォームで確認される

## FP-006 旧Vite Webとの文言差分確認
状態: Phase 2-16 polish調整済み / 実機確認継続  
優先度: P1

旧Vite Web:
- Intro、EmptyState、helper text、status、ボタン文言がWeb版のトーンで統一されている

Expo Universal:
- Intro、header、composer、OTHERS、status周りの tone を再調整した
- delete / user name / empty state などに静かな microcopy を寄せた
- まだ実機画面上での最終一致確認は残っている

必要対応:
- Header / Intro / Empty / Status / Composer / Sheet の文言を画面単位で最終棚卸しする
- iOS / Android 実機で tone が急かして見えないか確認する
- 意図的差分は `docs/universal-ui-ux-polish-guide.md` に理由付きで残す

完了条件:
- ユーザー向け文言差分が全て解消されるか、理由付きで記録されている

## FP-007 旧Vite WebとのUI配置差分確認
状態: Phase 2-16 polish調整済み / 画面比較継続  
優先度: P1

旧Vite Web:
- Sidebar / TopHeader / Composer / AgentControlBar / FloatingAgentBar / OTHERS panelの配置が固定されている

Expo Universal:
- Header / Drawer / bottom controls 構成は残しつつ、余白・最大幅・操作優先順位を再整理した
- ChatTimeline / Composer / FloatingAgentBar / Sheet の密度差を縮めた

必要対応:
- Header / Status / Timeline / Composer / FloatingAgentBar / Drawer / Sheet の side-by-side 比較を残す
- tablet / narrow viewport / 実機で間延びや詰まりが再発しないか確認する
- 未一致UIを修正するか、意図的差分として `docs/universal-ui-ux-polish-guide.md` に理由を記録する

完了条件:
- 配置差分が未確認のまま残っていない

## FP-008 iOS/Android/Expo Web実機QA
状態: Expo Webコード確認済み / 実機Manual Gate待ち  
優先度: P0

旧Vite Web:
- 比較元として常に参照できる

Expo Universal:
- Expo Web の起動確認と viewport 前提の polish 調整は実施した
- iOS / Android の safe area / keyboard / drawer / sheet / share / delete feel は実機での最終確認待ち
- Firebase / Gemini の実接続QAはManual Gate後に行う

必要対応:
- 3プラットフォームで導線、safe area、共有、入力、session操作、status表示を確認する
- まず `docs/universal-ui-ux-bug-qa.md` と `docs/universal-ui-ux-polish-checklist.md` を画面サイズ別に埋める
- Firebase Remote保存とGemini Proxy応答の実機確認をManual Gate後に記録する
- 差分はGap Registerへ反映する

完了条件:
- iOS / Android / Expo WebのQA結果が残り、未確認項目がゼロになる

## FP-009 Firebase/Firestore本番env確認
状態: Manual Gate待ち  
優先度: P0

旧Vite Web:
- Firestore前提でセッション保存・profile保存を行う

Expo Universal:
- Firebase configがない場合はlocal fallbackへ切り替わる
- 本番Firestoreへの接続確認はManual Gate対象

必要対応:
- Firebase Consoleからenv値を取得して `apps/mobile/.env` に手動設定する
- Expo Universalで本番Firestore設定を確認する
- セッション保存、切替、削除、ユーザー名保存の本番疎通を確認する

完了条件:
- 本番Firestore接続が確認され、fallback前提ではなくParity前提で運用できる

## FP-010 Gemini Proxy本番env確認
状態: Manual Gate待ち  
優先度: P0

旧Vite Web:
- envが揃うと本番Gemini応答を返す

Expo Universal:
- Worker endpointはあるが、Expo側は未設定でもmock fallbackで動作する
- `GEMINI_API_KEY` はWorker secret前提で、Expo側には置かない

必要対応:
- Cloudflare Workerへ `GEMINI_API_KEY` をsecret登録し、手動deployする
- Worker deploy、`EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL`、CORS、secret設定を確認する
- reply / others両方の本番疎通を確認する

完了条件:
- Expo Universal版が本番Gemini Proxyへ接続し、reply / OTHERSの両方が本物応答になる

## FP-011 App Store向け非医療/非診断文言確認
状態: 未一致  
優先度: P1

旧Vite Web:
- 現状はWeb文脈の文言群

Expo Universal:
- App Store審査境界を明示した最終確認がまだない

必要対応:
- 非医療 / 非診断の境界文言を見直す
- 初回導線、説明文、ストア提出向け説明との整合を確認する

完了条件:
- App Store向けに境界文言が確認され、残課題が記録されている

## FP-012 メッセージ個別削除導線
状態: 追加修正済み / 実機QA待ち  
優先度: P1

旧Vite Web:
- メッセージバブルのツールバーから個別copy / deleteができる

Expo Universal:
- `MobileMessageToolbar` と `MobileDeleteMessageSheet` を追加し、copy / share / delete を message 単位で実行できる

必要対応:
- Firestore / local fallback の両方で削除反映と session.updatedAt 更新を実機QAする
- toolbar tap target 調整後の誤操作しにくさと confirm sheet 表示を 3 プラットフォームで確認する

完了条件:
- message toolbar から個別削除でき、保存失敗時もアプリが落ちないことが確認される

## FP-013 OTHERS / Reaction導線
状態: 追加修正済み / 実機QA待ち  
優先度: P1

旧Vite Web:
- 各AIメッセージ配下にOTHERSタブと各agent reactionタブがある
- `OthersPanel`でまとめ表示し、メッセージ文脈に紐づいて閉じられる

Expo Universal:
- message toolbar から `requestOthers(messageId)` を実行できる
- 下部 `MobileOthersTrigger` は直近 user message 向けの補助導線として残した

必要対応:
- message context OTHERS と補助導線の両方を 3 プラットフォームでQAする
- bottom trigger / composer / floating bar の重なり再発がないか確認する
- reaction 表示や close 導線の追加要否は別フェーズで再評価する

完了条件:
- messageId 指定 OTHERS と補助 trigger の役割が QA で確認されている
