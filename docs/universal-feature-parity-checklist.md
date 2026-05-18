# Jibunkaigi Universal Feature Parity Checklist

## 方針

このチェックリストが全て完了するまで、Expo Universal版は完成扱いにしない。

| 機能 | Vite Web | Expo iOS | Expo Android | Expo Web | 状態 | 備考 |
|---|---:|---:|---:|---:|---|---|
| 初回オンボーディング | ✅ | ✅ | ✅ | ✅ | Phase 2-12 完了 / QA待ち | `MobileOnboardingScreen` + shared onboarding content + onboarding persistence |
| ホーム/空状態 | ✅ | ✅ | ✅ | ✅ | 部分一致 / FP-006 / FP-007 | `MobileIntroScreen` / `MobileEmptyState` の文言・配置QAが残る |
| 問いを書く | ✅ | ✅ | ✅ | ✅ | Phase 2-13 完了 / QA待ち | `綴る / 閉じる` 導線と composer collapse を追加 |
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
| セッション一覧 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | MobileSessionDrawer |
| セッション切り替え | ✅ | ✅ | ✅ | ✅ | Adapter完了 | switchSession |
| セッションタイトル編集 | ✅ | ✅ | ✅ | ✅ | Phase 2-10 完了 | MobileSessionEditSheet + renameSession |
| ピン留め | ✅ | ✅ | ✅ | ✅ | Phase 2-10 完了 | sortUniversalSessions + togglePinSession |
| セッション削除 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | deleteSession |
| 会話クリア | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | clearConversation |
| 新しい問いを始める | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | createNewSession |
| ユーザー名変更 | ✅ | ✅ | ✅ | ✅ | Phase 2-12 完了 / QA待ち | `MobileUserNameSheet` + `MobileUserNameTrigger` + profile repository |
| 会議メンバー説明 | ✅ | ✅ | ✅ | ✅ | 移植完了 | MobileMemberSheet / MobileMemberCard |
| エラー表示 | ✅ | ✅ | ✅ | ✅ | Phase 2-9 完了 | MobileErrorNotice + shared status messages |
| 設定不足表示 | ✅ | ✅ | ✅ | ✅ | Phase 2-9 完了 | MobileConfigNotice + runtimeStatus |
| ローディング表示 | ✅ | ✅ | ✅ | ✅ | Phase 2-9 完了 | MobileLoadingOverlay + MobileStatusStrip |
| 思考中表示 | ✅ | ✅ | ✅ | ✅ | 共通文言追加 / ローカルMVP完了 | getThinkingText → MobileThinkingIndicator |
| 過去会話復元 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | loadMessages on switchSession |
| コピー | ✅ | ✅ | ✅ | ✅ | Phase 2-10 完了 | MobileCopyShareActions + sessionExport |
| 共有 | ✅ | ✅ | ✅ | ✅ | 意図的差分 / FP-008 | OS共有シートの見た目差分は許容、導線と機能は揃える |
| 入力欄を閉じる/開く | ✅ | ✅ | ✅ | ✅ | Phase 2-13 完了 / QA待ち | `綴る / 閉じる` 導線 + collapsed composer hint |
| FloatingAgentBar | ✅ | ✅ | ✅ | ✅ | Phase 2-13 完了 / QA待ち | `MobileFloatingAgentBar` を追加 |
| メッセージ個別削除 | ✅ | ✅ | ✅ | ✅ | Phase 2-13 完了 / QA待ち | `deleteMessage` + `MobileMessageToolbar` |
| OTHERS表示導線 | ✅ | ✅ | ✅ | ✅ | Phase 2-13 完了 / QA待ち | message toolbar から `requestOthers(messageId)` を実行 |
| Debug/Compare/Inspector | ✅ | 任意 | 任意 | 任意 | 意図的差分 | 開発用。ストア向けユーザー体験の必須Parity対象外 |

## 完成条件

この表で、ユーザー向け機能の Expo iOS / Expo Android / Expo Web がすべて ✅ になるまで完成扱いにしない。
開発者向け機能は、本番では非表示でもよい。
`docs/full-parity-audit.md` と `docs/full-parity-gap-register.md` の全項目が完了するまで完成扱いにしない。
実接続の未確認項目は `docs/full-parity-gap-register.md` の FP-002 / FP-008 / FP-009 / FP-010 を参照し、Manual Gate完了まで ✅ にしない。
