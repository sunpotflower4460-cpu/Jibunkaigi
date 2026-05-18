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
状態: 実装済み / QA待ち  
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
状態: 部分一致  
優先度: P0

旧Vite Web:
- Firebase / Gemini envが揃うと本番AI応答を返す

Expo Universal:
- `createUniversalAiReply`はGemini Proxy優先だが、失敗時はmock fallbackへ戻る
- コード上はstatus表示できるが、本番envでの疎通記録がない

必要対応:
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
状態: 未一致  
優先度: P0

旧Vite Web:
- `Composer`の閉じるボタンと`AgentControlBar`の「綴る / 閉じる」で入力欄を開閉できる

Expo Universal:
- `MobileComposer`は常時表示
- 開閉state、補助文言、再オープン導線がない

必要対応:
- Webと同等の入力欄開閉導線をExpo Universalへ追加する
- 開閉時のレイアウト、補助文言、フォーカス挙動を揃える

完了条件:
- iOS / Android / Expo Webで入力欄開閉の導線と挙動が旧Vite Web版と同等になる

## FP-005 FloatingAgentBar
状態: 未一致  
優先度: P0

旧Vite Web:
- 初回入力後に固定下部バーが出現し、折りたたみ/展開、心の鏡、委ねる、各エージェント、OTHERS導線を持つ

Expo Universal:
- 固定下部バーがない

必要対応:
- FloatingAgentBarをExpo Universal版へ移植する
- safe area、折りたたみ、表示条件、下部導線を揃える

完了条件:
- iOS / Android / Expo Webで旧Vite Web版と同等のFloatingAgentBar体験になる

## FP-006 旧Vite Webとの文言差分確認
状態: 未確認  
優先度: P1

旧Vite Web:
- Intro、EmptyState、helper text、status、ボタン文言がWeb版のトーンで統一されている

Expo Universal:
- Intro、header、composer、OTHERS、status周りに別文言が残っている

必要対応:
- 画面単位で文言を棚卸しし、差分を一致 / 意図的差分に振り分ける
- 未一致文言を修正する

完了条件:
- ユーザー向け文言差分が全て解消されるか、理由付きで記録されている

## FP-007 旧Vite WebとのUI配置差分確認
状態: 未確認  
優先度: P1

旧Vite Web:
- Sidebar / TopHeader / Composer / AgentControlBar / FloatingAgentBar / OTHERS panelの配置が固定されている

Expo Universal:
- Header / Drawer / bottom controls構成が別で、導線密度や余白に差分がある

必要対応:
- 画面単位で配置差分を比較し、Parity必須UIを洗い出す
- 未一致UIを修正するか、意図的差分として理由を記録する

完了条件:
- 配置差分が未確認のまま残っていない

## FP-008 iOS/Android/Expo Web実機QA
状態: 未確認  
優先度: P0

旧Vite Web:
- 比較元として常に参照できる

Expo Universal:
- コード上の確認はできるが、iOS / Android / Expo Web実機比較が未完了

必要対応:
- 3プラットフォームで導線、safe area、共有、入力、session操作、status表示を確認する
- 差分はGap Registerへ反映する

完了条件:
- iOS / Android / Expo WebのQA結果が残り、未確認項目がゼロになる

## FP-009 Firebase/Firestore本番env確認
状態: 未確認  
優先度: P0

旧Vite Web:
- Firestore前提でセッション保存・profile保存を行う

Expo Universal:
- Firebase configがない場合はlocal fallbackへ切り替わる
- 本番Firestoreへの接続確認が未記録

必要対応:
- Expo Universalで本番Firestore設定を確認する
- セッション保存、切替、削除、ユーザー名保存の本番疎通を確認する

完了条件:
- 本番Firestore接続が確認され、fallback前提ではなくParity前提で運用できる

## FP-010 Gemini Proxy本番env確認
状態: 未確認  
優先度: P0

旧Vite Web:
- envが揃うと本番Gemini応答を返す

Expo Universal:
- Worker endpointはあるが、Expo側は未設定でもmock fallbackで動作する

必要対応:
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
状態: 未一致  
優先度: P1

旧Vite Web:
- メッセージバブルのツールバーから個別copy / deleteができる

Expo Universal:
- `MobileMessageBubble`はcopy / shareのみでdeleteがない

必要対応:
- メッセージ個別削除導線をExpo Universalへ追加する
- 削除時のセッション保存、UI更新、操作導線を揃える

完了条件:
- iOS / Android / Expo Webで旧Vite Web版と同等にメッセージ個別削除ができる

## FP-013 OTHERS / Reaction導線
状態: 部分一致  
優先度: P1

旧Vite Web:
- 各AIメッセージ配下にOTHERSタブと各agent reactionタブがある
- `OthersPanel`でまとめ表示し、メッセージ文脈に紐づいて閉じられる

Expo Universal:
- 画面下部の`MobileOthersTrigger`で一括取得し、結果をタイムラインへ追記する
- Webのメッセージ単位導線、reaction切替、close操作がない

必要対応:
- OTHERSの呼び出し位置、表示位置、close導線、結果の見せ方をWeb版基準で再設計する
- どうしても変える場合は意図的差分として理由を記録する

完了条件:
- OTHERS / reactionの導線と表示が旧Vite Web版と同等、または理由付きで固定されている
