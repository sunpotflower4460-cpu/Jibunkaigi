# Universal Message Toolbar

## 目的
旧Vite Web版のメッセージ単位操作導線を Expo Universal版へ寄せる。

## Web監査結果
- `src/components/chat/MessageBubble.jsx` はメッセージ単位で copy / delete を持つツールバーを表示する。
- 同ファイルでは OTHERS 導線がメッセージ文脈に紐づいており、反応表示も message context 内で扱う。
- `src/components/chat/ChatTimeline.jsx` は各 bubble ごとの toolbar / OTHERS 状態をタイムラインへ渡している。
- 現行 Expo版は `MobileCopyShareActions` と下部 `MobileOthersTrigger` に分かれており、メッセージ文脈の導線が不足していた。

## 実装
- `packages/shared/src/message/messageActions.ts` に copy / share / delete / others の action 定義を追加した。
- `apps/mobile/services/sessionRepository.ts` と `apps/mobile/services/firebase/firestoreSessionRepository.ts` に `deleteMessage(sessionId, messageId)` を追加した。
- `apps/mobile/state/useUniversalConversation.ts` に `deleteMessage(messageId)` を追加し、state更新・repository削除・session.updatedAt更新を行うようにした。
- `requestOthers(messageId?)` を message target 対応にし、指定 message が user のときはその問いを基準に OTHERS を生成するようにした。
- `apps/mobile/components/chat/MobileMessageToolbar.tsx` を追加し、コピー / 共有 / 削除 / OTHERS をメッセージ単位で実行できるようにした。
- `apps/mobile/components/chat/MobileDeleteMessageSheet.tsx` を追加し、誤削除を避ける confirm sheet を用意した。
- `apps/mobile/components/chat/MobileMessageBubble.tsx` と `apps/mobile/components/chat/MobileChatTimeline.tsx` を更新し、toolbar と delete sheet を接続した。

## OTHERS 導線
- user message には message toolbar から OTHERS を実行できる。
- 下部 `MobileOthersTrigger` は補助導線として残し、直近の user message を対象にする。
- これにより Web版の message context 導線を追加しつつ、Expo版の補助導線も維持する。

## 意図的差分
- share は Expo Universal版の既存共有導線を継続利用する。
- 下部 OTHERS trigger は parity を損なわない補助導線として残す。
