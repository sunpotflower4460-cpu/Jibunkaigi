# Jibunkaigi Universal Feature Parity Checklist

## 方針

このチェックリストが全て完了するまで、Expo Universal版は完成扱いにしない。

| 機能 | Vite Web | Expo iOS | Expo Android | Expo Web | 状態 | 備考 |
|---|---:|---:|---:|---:|---|---|
| 初回オンボーディング | ✅ | ✅ | ✅ | ✅ | Phase 2-16 polish調整 / QA待ち / FP-006 / FP-007 | `MobileOnboardingScreen` + shared onboarding content + onboarding persistence |
| ホーム/空状態 | ✅ | ✅ | ✅ | ✅ | UI調整済み / 画面QA待ち / FP-006 / FP-007 | `MobileIntroScreen` / `MobileEmptyState` を scroll/compact 化し、質感を再調整 |
| 問いを書く | ✅ | ✅ | ✅ | ✅ | Phase 2-16 polish調整 / QA待ち / FP-006 / FP-007 | `綴る / 閉じる` 導線と composer collapse を維持しつつ余白と視認性を再調整 |
| メッセージ送信 | ✅ | ✅ | ✅ | ✅ | 部分一致 / FP-002 | 送信土台はあるが実応答確認はManual Gate待ち |
| AI応答 | ✅ | ⬜ | ⬜ | ⬜ | Manual Gate待ち / FP-002 | Proxy土台あり。Firebase/Gemini env手動設定後に実応答確認 |
| 一閃モード | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了 | UNIVERSAL_MODES → MobileModeSelector |
| 対話モード | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了 | UNIVERSAL_MODES → MobileModeSelector |
| 深淵モード | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了 | UNIVERSAL_MODES → MobileModeSelector |
| レイ | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / Prompt Profile 追加 / ローカル MVP 完了（mock） | UNIVERSAL_AGENTS + AgentPromptProfile → MobileAgentControlBar |
| ジョー | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / Prompt Profile 追加 / ローカル MVP 完了（mock） | UNIVERSAL_AGENTS + AgentPromptProfile → MobileAgentControlBar |
| ケン | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / Prompt Profile 追加 / ローカル MVP 完了（mock） | UNIVERSAL_AGENTS + AgentPromptProfile → MobileAgentControlBar |
| ミナ | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / Prompt Profile 追加 / ローカル MVP 完了（mock） | UNIVERSAL_AGENTS + AgentPromptProfile → MobileAgentControlBar |
| サトウ | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / Prompt Profile 追加 / ローカル MVP 完了（mock） | UNIVERSAL_AGENTS + AgentPromptProfile → MobileAgentControlBar |
| 委ねる | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / Prompt Profile 追加 / ローカル疑似対応 | pickMockDelegatedAgent → shared |
| 心の鏡 | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / Prompt Profile 追加 / ローカル疑似対応 | buildMirrorMockReply → shared |
| OTHERS | ✅ | ✅ | ✅ | ✅ | MVP対応 / 明示実行 / Proxy + fallback | MobileOthersTrigger + /api/jibunkaigi/others |
| セッション保存 | ✅ | ✅ | ✅ | ✅ | Adapter完了 / Remote実確認はManual Gate | FirestoreSessionRepository + local fallback |
| セッション一覧 | ✅ | ✅ | ✅ | ✅ | Adapter完了 / polish調整 / FP-007 | MobileSessionDrawer |
| セッション切り替え | ✅ | ✅ | ✅ | ✅ | Adapter完了 | switchSession |
| セッションタイトル編集 | ✅ | ✅ | ✅ | ✅ | Phase 2-10 完了 | MobileSessionEditSheet + renameSession |
| ピン留め | ✅ | ✅ | ✅ | ✅ | Phase 2-10 完了 | sortUniversalSessions + togglePinSession |
| セッション削除 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | deleteSession |
| 会話クリア | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | clearConversation |
| 新しい問いを始める | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | createNewSession |
| ユーザー名変更 | ✅ | ✅ | ✅ | ✅ | Phase 2-16 polish調整 / QA待ち / FP-006 / FP-007 | `MobileUserNameSheet` + `MobileUserNameTrigger` + profile repository |
| 会議メンバー説明 | ✅ | ✅ | ✅ | ✅ | 移植完了 / polish調整 / FP-007 | MobileMemberSheet / MobileMemberCard |
| エラー表示 | ✅ | ✅ | ✅ | ✅ | Phase 2-16 polish調整 / FP-006 / FP-007 | MobileErrorNotice + shared status messages |
| 設定不足表示 | ✅ | ✅ | ✅ | ✅ | Phase 2-16 polish調整 / FP-006 / FP-007 | MobileConfigNotice + runtimeStatus |
| ローディング表示 | ✅ | ✅ | ✅ | ✅ | Phase 2-16 polish調整 / FP-007 | MobileLoadingOverlay + MobileStatusStrip |
| 思考中表示 | ✅ | ✅ | ✅ | ✅ | 共通文言追加 / ローカルMVP完了 | getThinkingText → MobileThinkingIndicator |
| 過去会話復元 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | loadMessages on switchSession |
| コピー | ✅ | ✅ | ✅ | ✅ | Phase 2-10 完了 | MobileCopyShareActions + sessionExport |
| 共有 | ✅ | ✅ | ✅ | ✅ | 意図的差分 / FP-008 | OS共有シートの見た目差分は許容、導線と機能は揃える |
| 入力欄を閉じる/開く | ✅ | ✅ | ✅ | ✅ | UI調整済み / 実機QA待ち / FP-004 / FP-007 | `MobileSafeLayout` + bottom dock + bottom spacer で safe area / keyboard 重なりを補強 |
| FloatingAgentBar | ✅ | ✅ | ✅ | ✅ | UI調整済み / 実機QA待ち / FP-005 / FP-007 | `MobileFloatingAgentBar` を bottom dock 高さ基準に再配置 |
| メッセージ個別削除 | ✅ | ✅ | ✅ | ✅ | UI調整済み / 実機QA待ち / FP-012 / FP-006 | toolbar tap target 拡張 + confirm sheet の tone 調整を継続QA |
| OTHERS表示導線 | ✅ | ✅ | ✅ | ✅ | UI調整済み / 実機QA待ち / FP-013 / FP-006 | bottom trigger / message toolbar 両方の重なりを補強 |
| Debug/Compare/Inspector | ✅ | 任意 | 任意 | 任意 | 意図的差分 | 開発用。ストア向けユーザー体験の必須Parity対象外 |

## 完成条件

この表で、ユーザー向け機能の Expo iOS / Expo Android / Expo Web がすべて ✅ になるまで完成扱いにしない。
開発者向け機能は、本番では非表示でもよい。
`docs/full-parity-audit.md` と `docs/full-parity-gap-register.md` の全項目が完了するまで完成扱いにしない。
実接続の未確認項目は `docs/full-parity-gap-register.md` の FP-002 / FP-008 / FP-009 / FP-010 を参照し、Manual Gate完了まで ✅ にしない。

## Phase 2-16メモ

- FP-006: 一部QA済み。shared文言と主要モバイル画面の tone を再調整したが、iOS / Android 実機の最終確認は未実施。
- FP-007: 一部QA済み。Header / Timeline / Composer / Drawer / Sheet の配置差分は整理したが、side-by-side 画面比較は継続。
- FP-008: Expo Web の起動確認と viewport 前提のコード調整は実施済み。iOS / Android 実機QAは Manual Gate 後。
