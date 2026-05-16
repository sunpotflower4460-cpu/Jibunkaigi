# Jibunkaigi Universal Feature Parity Checklist

## 方針

このチェックリストが全て完了するまで、Expo Universal版は完成扱いにしない。

| 機能 | Vite Web | Expo iOS | Expo Android | Expo Web | 状態 | 備考 |
|---|---:|---:|---:|---:|---|---|
| 初回オンボーディング | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | IntroOverlay相当 |
| ホーム/空状態 | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | MobileEmptyState / MobileIntroScreen |
| 問いを書く | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | MobileComposer |
| メッセージ送信 | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | 本物送信はPhase 3 |
| AI応答 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | Gemini Proxy予定 |
| 一閃モード | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了 | UNIVERSAL_MODES → MobileModeSelector |
| 対話モード | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了 | UNIVERSAL_MODES → MobileModeSelector |
| 深淵モード | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了 | UNIVERSAL_MODES → MobileModeSelector |
| レイ | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了（mock） | UNIVERSAL_AGENTS → MobileAgentControlBar |
| ジョー | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了（mock） | UNIVERSAL_AGENTS → MobileAgentControlBar |
| ケン | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了（mock） | UNIVERSAL_AGENTS → MobileAgentControlBar |
| ミナ | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了（mock） | UNIVERSAL_AGENTS → MobileAgentControlBar |
| サトウ | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカルMVP完了（mock） | UNIVERSAL_AGENTS → MobileAgentControlBar |
| 委ねる | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカル疑似対応 | pickMockDelegatedAgent → shared |
| 心の鏡 | ✅ | ✅ | ✅ | ✅ | 共通定義追加 / ローカル疑似対応 | buildMirrorMockReply → shared |
| OTHERS | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| セッション保存 | ✅ | ✅ | ✅ | ✅ | Adapter完了（Firestore / local fallback） | FirestoreSessionRepository |
| セッション一覧 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | MobileSessionDrawer |
| セッション切り替え | ✅ | ✅ | ✅ | ✅ | Adapter完了 | switchSession |
| セッションタイトル編集 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| ピン留め | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | UniversalSession.pinned型は定義済み |
| セッション削除 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | deleteSession |
| 会話クリア | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | clearConversation |
| 新しい問いを始める | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | createNewSession |
| ユーザー名変更 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| 会議メンバー説明 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | BeliefsDialog相当 |
| エラー表示 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| 設定不足表示 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| ローディング表示 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| 思考中表示 | ✅ | ✅ | ✅ | ✅ | 共通文言追加 / ローカルMVP完了 | getThinkingText → MobileThinkingIndicator |
| 過去会話復元 | ✅ | ✅ | ✅ | ✅ | Adapter完了 | loadMessages on switchSession |
| コピー | ✅ | ⬜ | ⬜ | ⬜ | 未確認 | |
| 共有 | ✅ | ⬜ | ⬜ | ⬜ | 未確認 | |
| 入力欄を閉じる/開く | ✅ | ⬜ | ⬜ | ⬜ | 未確認 | |
| FloatingAgentBar | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| Debug/Compare/Inspector | ✅ | 任意 | 任意 | 任意 | 開発用 | 本番では隠してよい |

## 完成条件

この表で、ユーザー向け機能の Expo iOS / Expo Android / Expo Web がすべて ✅ になるまで完成扱いにしない。
開発者向け機能は、本番では非表示でもよい。
