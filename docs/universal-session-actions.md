# Universal Session Actions

## Phase 2-10 で追加したこと

- `packages/shared/src/session/sessionDisplay.ts`
  - セッション一覧を `pinned` → `updatedAt` で安定ソート
  - タイトル編集時の正規化を共通化
- `packages/shared/src/session/sessionExport.ts`
  - 1メッセージ / 会話全体のコピー・共有文面を共通化
- `apps/mobile/state/useUniversalConversation.ts`
  - タイトル編集
  - ピン留め / ピン解除
  - 1メッセージのコピー / 共有
  - 会話全体のコピー / 共有
  - 成功時の `lastActionMessage` と失敗時の `shareError`
- `apps/mobile/components/session/*`
  - Session Drawer 内で開く / 編集 / ピン / 削除
  - タイトル編集用シート
- `apps/mobile/components/chat/*`
  - 各メッセージにコピー / 共有導線を追加
- `apps/mobile/services/mobileClipboardShare.ts`
  - iOS / Android ではネイティブ共有
  - Web では `navigator.share` が使えない場合にコピーへフォールバック

## UX 方針

- ピン留め済みセッションを常に上に出す
- 現在のセッションを一覧で判別できる
- コピー / 共有の導線は全プラットフォームで同じ文言に揃える
- 保存や共有に失敗しても会話画面を止めず、Status / Error UI でやさしく伝える
