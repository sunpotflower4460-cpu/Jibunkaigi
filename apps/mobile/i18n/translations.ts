// じぶん会議（モバイル）— UI 翻訳辞書（ja / en）
// ------------------------------------------------------------
// フラットなドット区切りキー。値は文字列。{name} 形式の補間に対応。
// 対象は「モバイルにハードコードされた UI チノメ」のみ。
// エージェント名・メンバーの人格説明・モード・thinking 文・onboarding/legal/storage の
// 本文データは @jibunkaigi/shared 由来のため、ここには含めない（日本語のまま）。
// AI の応答はユーザーの入力言語に自動追従するため、ここには含めない。
import type { Lang } from './store';

const ja = {
  // 共通
  'app.name': 'じぶん会議',
  'common.save': '保存する',
  'common.cancel': 'キャンセル',

  // 名前（UserNameTrigger / UserNameSheet）
  'user.trigger.name': '名前',
  'user.trigger.edit.aria': '名前を変更する',
  'user.sheet.title': '名前を整える',
  'user.sheet.desc': '会議メンバーからの呼ばれ方に使われます。',
  'user.sheet.placeholder': 'あなた',
  'user.sheet.help': '空欄のまま保存すると「あなた」になります。',

  // 入力欄（Composer）
  'composer.close.aria': '入力欄を閉じる',
  'composer.waiting': '応答を待っています…',
  'composer.send.aria': 'メッセージを送信',

  // エージェントバー（FloatingAgentBar / AgentControlBar）
  'agentbar.open': '視点を開く',
  'agentbar.close.aria': '視点を閉じる',
  'agentbar.current': '現在: {name}',
  'agentbar.select.aria': '{name}を選ぶ',
  'agentcontrol.caption': '視点を選ぶ',

  // コピー / 共有（CopyShareActions）
  'share.copy.aria': 'このテキストをコピー',
  'share.copy': 'コピー',
  'share.share.aria': 'このテキストを共有',
  'share.share': '共有',

  // OTHERS（OthersTrigger）
  'others.trigger.aria': '他のメンバーの視点を見る',
  'others.trigger.sub': 'ほかの視点をひらく',

  // 空状態 / イントロ（EmptyState / IntroScreen）
  'empty.heading': 'まずは、ひとつ置いてみる。',
  'empty.sub': 'まだ言葉になっていなくても、大丈夫です。',
  'intro.hintTitle': 'たとえば、こんな問いから',
  'intro.hint.1': '言葉にならないけど、ずっと胸にあるもの',
  'intro.hint.2': '最近、少しだけ引っかかっていること',
  'intro.hint.3': '誰にも言っていない、小さな違和感',
  'intro.hint.4': '今の自分を、少しだけ見てみたい',

  // メッセージ削除（DeleteMessageSheet）
  'deleteMsg.title': 'このメッセージを手放しますか？',
  'deleteMsg.caption': '会話の表示から取り除かれます。',
  'deleteMsg.confirm': '手放す',

  // メッセージ操作（MessageToolbar）
  'messageToolbar.action.aria': '{name}を実行',

  // 保存状態シート（StorageSheet）
  'storage.title': '保存状態とデータ削除',
  'storage.close.aria': '保存状態とデータ削除の案内を閉じる',
  'storage.intro': 'いまの保存先と、どこまで削除できるかをまとめて確認できます。',
  'storage.section.where': '保存先の違い',
  'storage.section.delete': '削除できること / これから分けること',
  'storage.section.deleteNote': 'セッション削除、端末内全削除、クラウド全削除は別の操作として扱います。',
  'storage.scope': '対象: {scope}',

  // 法務リンク / シート（LegalLinks / LegalSheet）
  'legal.links.aria': '利用規約やプライバシーの案内を開く',
  'legal.links.label': '利用規約 / プライバシー / 注意事項',
  'legal.sheet.title': '利用規約・プライバシー・注意事項',
  'legal.sheet.close.aria': '法務と安全の案内を閉じる',
  'legal.sheet.intro': '利用前の前提と安全に関わる案内を、必要なときにいつでも見返せます。',

  // セッションドロワー（SessionDrawer）
  'drawer.title': '会議の記録',
  'drawer.close.aria': 'セッション一覧を閉じる',
  'drawer.new.aria': '新しい問いを始める',
  'drawer.new': '＋ 新しい問いを始める',
  'drawer.copyAll.aria': '会話全体をコピー',
  'drawer.copyAll': '会話全体をコピー',
  'drawer.shareAll.aria': '会話全体を共有',
  'drawer.shareAll': '会話全体を共有',
  'drawer.storage.aria': '保存状態とデータ削除の案内を開く',
  'drawer.storage': '保存状態 / データ削除',
  'drawer.empty': 'まだ会議がありません',

  // セッション項目（SessionListItem）
  'sessionItem.active': '表示中',
  'sessionItem.updated': '更新: {time}',
  'sessionItem.open.aria': '{title}を開く',
  'sessionItem.open': '開く',
  'sessionItem.edit.aria': '{title}を編集',
  'sessionItem.edit': '編集',
  'sessionItem.pin.add.aria': '{title}をピン留めする',
  'sessionItem.pin.remove.aria': '{title}のピン留めを外す',
  'sessionItem.pin': 'ピン',
  'sessionItem.unpin': 'ピン解除',
  'sessionItem.delete.aria': '{title}を削除',
  'sessionItem.delete': '削除',

  // タイトル編集（SessionEditSheet）
  'sessionEdit.title': 'タイトルを編集',
  'sessionEdit.caption': '空欄のまま保存すると「新しい問い」になります。',
  'sessionEdit.placeholder': '新しい問い',
  'sessionEdit.cancel.aria': 'セッションタイトル編集をキャンセル',
  'sessionEdit.save.aria': 'セッションタイトルを保存',
  'sessionEdit.save': '保存',

  // ヘッダー（SessionHeader）
  'header.new.short': '新規',
  'header.new': '新しい問い',
  'header.drawer.aria': 'セッション一覧を開く',
  'header.members.aria': '会議メンバーを見る',
  'header.members': 'メンバー',
  'header.clear': 'クリア',

  // メンバー（MemberSheet / MemberTrigger / MemberCard）
  'members.sheet.title': '会議メンバー',
  'members.sheet.close.aria': '会議メンバーを閉じる',
  'members.sheet.sub': '各メンバーをタップすると詳細を見られます',
  'members.trigger.aria': '会議メンバーを見る',
  'members.trigger': 'メンバー',
  'members.card.expand.aria': '{name}の詳細を開く',
  'members.card.collapse.aria': '{name}の詳細を閉じる',
  'members.card.sees': '何を見るか',
  'members.card.core': '核心',
  'members.card.tone': '声の温度',
  'members.card.avoids': 'しないこと',

  // 読み込み / 保存バッジ（LoadingOverlay / SaveStatusBadge）
  'loading.label': 'セッションを読み込んでいます',
  'saveBadge.hint': '詳しくは会議一覧の「保存状態 / データ削除」で確認できます。',

  // エラー境界（ErrorBoundary）
  'errorBoundary.title': '予期せぬエラーが発生しました',
  'errorBoundary.body': 'アプリの表示中に問題が起きました。\nもう一度ひらくと、ほとんどの場合は元に戻ります。',
  'errorBoundary.retry': 'もう一度ひらく',

  // オンボーディング（OnboardingScreen — ハードコードの法務リンクのみ）
  'onboarding.legal.aria': '利用規約とプライバシーの案内を開く',
  'onboarding.legal.label': '利用規約 / プライバシー / 非医療・緊急時の案内を見る',

  // 言語トグル
  'lang.toggle.aria': '言語を切り替える（日本語 / English）',
} satisfies Record<string, string>;

const en = {
  // common
  'app.name': 'Jibun Kaigi',
  'common.save': 'Save',
  'common.cancel': 'Cancel',

  // name (UserNameTrigger / UserNameSheet)
  'user.trigger.name': 'Name',
  'user.trigger.edit.aria': 'Change your name',
  'user.sheet.title': 'Set your name',
  'user.sheet.desc': 'This is how the members will address you.',
  'user.sheet.placeholder': 'You',
  'user.sheet.help': 'If you save it blank, you will be called "You."',

  // composer (Composer)
  'composer.close.aria': 'Close input field',
  'composer.waiting': 'Waiting for a response…',
  'composer.send.aria': 'Send message',

  // agent bar (FloatingAgentBar / AgentControlBar)
  'agentbar.open': 'Open perspectives',
  'agentbar.close.aria': 'Close perspectives',
  'agentbar.current': 'Now: {name}',
  'agentbar.select.aria': 'Choose {name}',
  'agentcontrol.caption': 'Choose a perspective',

  // copy / share (CopyShareActions)
  'share.copy.aria': 'Copy this text',
  'share.copy': 'Copy',
  'share.share.aria': 'Share this text',
  'share.share': 'Share',

  // OTHERS (OthersTrigger)
  'others.trigger.aria': "See other members' perspectives",
  'others.trigger.sub': 'Open other perspectives',

  // empty state / intro (EmptyState / IntroScreen)
  'empty.heading': 'Start by setting down just one thing.',
  'empty.sub': "It's okay even if it isn't words yet.",
  'intro.hintTitle': 'For example, start with a question like…',
  'intro.hint.1': "Something in your chest that won't become words",
  'intro.hint.2': "Something that's been nagging you lately",
  'intro.hint.3': "A small unease you've told no one",
  'intro.hint.4': 'I want to look at myself, just a little',

  // delete message (DeleteMessageSheet)
  'deleteMsg.title': 'Let go of this message?',
  'deleteMsg.caption': 'It will be removed from the conversation view.',
  'deleteMsg.confirm': 'Let go',

  // message actions (MessageToolbar)
  'messageToolbar.action.aria': '{name}',

  // storage sheet (StorageSheet)
  'storage.title': 'Save state & data deletion',
  'storage.close.aria': 'Close the save state & data deletion guide',
  'storage.intro': 'Review where your data is saved and what can be deleted, all in one place.',
  'storage.section.where': 'Where data is saved',
  'storage.section.delete': 'What you can delete / what we will separate next',
  'storage.section.deleteNote':
    'Session deletion, full on-device deletion, and full cloud deletion are treated as separate actions.',
  'storage.scope': 'Applies to: {scope}',

  // legal links / sheet (LegalLinks / LegalSheet)
  'legal.links.aria': 'Open the terms & privacy guide',
  'legal.links.label': 'Terms / Privacy / Notes',
  'legal.sheet.title': 'Terms, Privacy & Notes',
  'legal.sheet.close.aria': 'Close the legal & safety guide',
  'legal.sheet.intro': 'Revisit the prerequisites and safety guidance any time you need to.',

  // session drawer (SessionDrawer)
  'drawer.title': 'Meeting records',
  'drawer.close.aria': 'Close session list',
  'drawer.new.aria': 'Start a new question',
  'drawer.new': '＋ Start a new question',
  'drawer.copyAll.aria': 'Copy the whole conversation',
  'drawer.copyAll': 'Copy all',
  'drawer.shareAll.aria': 'Share the whole conversation',
  'drawer.shareAll': 'Share all',
  'drawer.storage.aria': 'Open the save state & data deletion guide',
  'drawer.storage': 'Save state / Data deletion',
  'drawer.empty': 'No meetings yet',

  // session item (SessionListItem)
  'sessionItem.active': 'Active',
  'sessionItem.updated': 'Updated: {time}',
  'sessionItem.open.aria': 'Open {title}',
  'sessionItem.open': 'Open',
  'sessionItem.edit.aria': 'Edit {title}',
  'sessionItem.edit': 'Edit',
  'sessionItem.pin.add.aria': 'Pin {title}',
  'sessionItem.pin.remove.aria': 'Unpin {title}',
  'sessionItem.pin': 'Pin',
  'sessionItem.unpin': 'Unpin',
  'sessionItem.delete.aria': 'Delete {title}',
  'sessionItem.delete': 'Delete',

  // title edit (SessionEditSheet)
  'sessionEdit.title': 'Edit title',
  'sessionEdit.caption': 'If you save it blank, it becomes "New question."',
  'sessionEdit.placeholder': 'New question',
  'sessionEdit.cancel.aria': 'Cancel editing the session title',
  'sessionEdit.save.aria': 'Save the session title',
  'sessionEdit.save': 'Save',

  // header (SessionHeader)
  'header.new.short': 'New',
  'header.new': 'New question',
  'header.drawer.aria': 'Open session list',
  'header.members.aria': 'See the members',
  'header.members': 'Members',
  'header.clear': 'Clear',

  // members (MemberSheet / MemberTrigger / MemberCard)
  'members.sheet.title': 'The members',
  'members.sheet.close.aria': 'Close the members',
  'members.sheet.sub': 'Tap each member to see details',
  'members.trigger.aria': 'See the members',
  'members.trigger': 'Members',
  'members.card.expand.aria': 'Open details for {name}',
  'members.card.collapse.aria': 'Close details for {name}',
  'members.card.sees': 'What it sees',
  'members.card.core': 'Core',
  'members.card.tone': 'Tone of voice',
  'members.card.avoids': 'What it avoids',

  // loading / save badge (LoadingOverlay / SaveStatusBadge)
  'loading.label': 'Loading sessions',
  'saveBadge.hint': 'For details, see "Save state / Data deletion" in the meeting list.',

  // error boundary (ErrorBoundary)
  'errorBoundary.title': 'Something went wrong',
  'errorBoundary.body':
    'A problem occurred while displaying the app.\nReopening usually puts things back to normal.',
  'errorBoundary.retry': 'Reopen',

  // onboarding (OnboardingScreen — hardcoded legal link only)
  'onboarding.legal.aria': 'Open the terms & privacy guide',
  'onboarding.legal.label': 'View terms / privacy / non-medical & emergency guidance',

  // language toggle
  'lang.toggle.aria': 'Switch language (日本語 / English)',
} satisfies Record<string, string>;

// コンパイル時に ja / en のキー集合が完全一致することを強制する（実行時コードなし）。
// 片方だけキーを足す／消すと typecheck が失敗する。
type Eq<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Expect<T extends true> = T;
type _KeyParity = Expect<Eq<keyof typeof ja, keyof typeof en>>;

export const translations: Record<Lang, Record<string, string>> = { ja, en };

export default translations;
