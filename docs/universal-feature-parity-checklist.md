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
| 一閃モード | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | MobileModeSelector |
| 対話モード | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | MobileModeSelector |
| 深淵モード | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | MobileModeSelector |
| レイ | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | モード対応疑似応答 |
| ジョー | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | モード対応疑似応答 |
| ケン | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | モード対応疑似応答 |
| ミナ | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | モード対応疑似応答 |
| サトウ | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | モード対応疑似応答 |
| 委ねる | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | 疑似委譲あり |
| 心の鏡 | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了（mock） | 履歴要約疑似応答 |
| OTHERS | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| セッション保存 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | Firebase予定 |
| セッション一覧 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| セッション切り替え | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| セッションタイトル編集 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| ピン留め | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | UniversalSession.pinned型は定義済み |
| セッション削除 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| 会話クリア | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | clearConversation |
| 新しい問いを始める | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | createNewSession |
| ユーザー名変更 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| 会議メンバー説明 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | BeliefsDialog相当 |
| エラー表示 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| 設定不足表示 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| ローディング表示 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| 思考中表示 | ✅ | ✅ | ✅ | ✅ | ローカルMVP完了 | MobileThinkingIndicator |
| 過去会話復元 | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| コピー | ✅ | ⬜ | ⬜ | ⬜ | 未確認 | |
| 共有 | ✅ | ⬜ | ⬜ | ⬜ | 未確認 | |
| 入力欄を閉じる/開く | ✅ | ⬜ | ⬜ | ⬜ | 未確認 | |
| FloatingAgentBar | ✅ | ⬜ | ⬜ | ⬜ | 未移植 | |
| Debug/Compare/Inspector | ✅ | 任意 | 任意 | 任意 | 開発用 | 本番では隠してよい |

## 完成条件

この表で、ユーザー向け機能の Expo iOS / Expo Android / Expo Web がすべて ✅ になるまで完成扱いにしない。
開発者向け機能は、本番では非表示でもよい。
