// じぶん会議 — UI 翻訳辞書（ja / en）
// ------------------------------------------------------------
// フラットなドット区切りキー。値は文字列。{name} 形式の補間に対応。
// AI の応答はユーザーの入力言語に自動追従するため、ここには含めない。

export const translations = {
  ja: {
    // 共通
    'app.name': 'じぶん会議',
    'app.tagline': 'INNER CONFERENCE ROOM',
    'app.subtitleInner': '内なる会議',
    'common.close': '閉じる',
    'lang.toggleLabel': '言語を切り替える（日本語 / English）',
    'lang.short': 'EN',

    // オンボーディング（IntroOverlay）
    'intro.subtitle.default': '5つの視点で、じぶんに潜る',
    'intro.subtitle.config': '設定を確認して、会議の準備を整える',
    'intro.keyline.line1': '導かない。照らすだけ。',
    'intro.keyline.line2': '歩くのは、あなた自身。',
    'intro.step.write': '問いを書く',
    'intro.step.summon': '視点を呼ぶ',
    'intro.step.mirror': '心の鏡で映す',
    'intro.cta.start': '会議をはじめる',
    'intro.cta.config': '設定を確認する',
    'intro.config.note': 'まずは不足している設定を確認できる画面へ進みます。',

    // 空状態（EmptyState）
    'empty.title.line1': 'まずは、ひとつ',
    'empty.title.line2': '置いてみる。',
    'empty.subtitle': 'まだ言葉になっていなくても、大丈夫です。',
    'empty.hint.1': '言葉にならないけど、ずっと胸にあるもの',
    'empty.hint.2': '最近、少しだけ引っかかっていること',
    'empty.hint.3': '誰にも言っていない、小さな違和感',
    'empty.hint.4': '今の自分を、少しだけ見てみたい',
    'empty.hint.aria': '例として入力: {hint}',

    // サイドバー（Sidebar / UserProfileButton / SessionList）
    'sidebar.newQuestion': '新しい問い',
    'sidebar.newQuestion.aria': '新しい問いを始める',
    'sidebar.agentRoles': 'エージェントの役割',
    'sidebar.members.aria': '会議メンバーの魂を見る',
    'sidebar.sessions.aria': 'セッション一覧',
    'profile.client': 'Client',
    'profile.edit.aria': 'お名前を編集: 現在 {name}',
    'session.empty.title': 'まだ保存された問いはありません。',
    'session.empty.subtitle': '最初の問いが、ここに残ります。',
    'session.untitled': '無題',
    'session.list.aria': '過去のセッション',
    'session.edit.aria': 'タイトルを編集',
    'session.pin.on': 'ピン留めする',
    'session.pin.off': 'ピン留めを外す',
    'session.pinned.aria': 'ピン留め中',
    'session.delete.aria': 'セッションを削除',
    'session.title.aria': 'セッションタイトル',

    // ヘッダー（TopHeader）
    'header.openMenu.aria': 'メニューを開く',
    'header.defaultTitle': '思考の領域',
    'header.mode.group.aria': '応答モード',
    'header.mode.aria': '応答モード: {label}',

    // 入力欄（Composer）
    'composer.input.aria': '相談内容の入力欄',
    'composer.send.aria': 'メッセージを送信',
    'composer.close.aria': '入力欄を閉じる',

    // エージェント操作バー（AgentControlBar / FloatingAgentBar）
    'agentbar.group.aria': '会議メンバーの呼び出し',
    'agentbar.mirror.name': '心の鏡',
    'agentbar.mirror.role': '思考を総括する',
    'agentbar.mirror.aria': '心の鏡: ここまでの思考を総括する',
    'agentbar.delegate.name': '委ねる',
    'agentbar.delegate.aria': '委ねる: 場に応じた視点に任せる',
    'agentbar.write': '綴る',
    'agentbar.openInput.aria': '入力欄を開く',
    'agentbar.closeInput.aria': '入力欄を閉じる',
    'agentbar.summon.aria': '{name}（{role}）を呼び出す',
    'floating.open': '視点を開く',
    'floating.collapsed.aria': '下部エージェント操作バー（たたみ中）',
    'floating.expanded.aria': '下部エージェント操作バー',
    'floating.mirror.aria': '心の鏡を呼び出す',
    'floating.delegate.aria': '委ねる（ランダムエージェント）',
    'floating.summon.aria': '{name}を呼び出す',
    'floating.others.aria': 'OTHERSセクションへスクロール',
    'floating.close.aria': '下部バーを閉じる',

    // メッセージ（MessageBubble）
    'message.master.badge': '総括',
    'message.copy.aria': 'メッセージをコピー',
    'message.delete.aria': 'メッセージを削除',
    'message.reaction.aria': '{name} の反応を見る',
    'message.others.empty': 'まだ比較対象がありません',

    // タイムライン（ChatTimeline）
    'timeline.loading': '読み込み中',
    'timeline.syncing': 'メッセージを同期しています',
    'timeline.mirrorInvite.aria': '心の鏡で、ここまでの声を映す',
    'timeline.mirrorInvite.title': 'ここまでの声を映してみますか？',
    'timeline.mirrorInvite.subtitle': '心の鏡が、散らばった思考を総括します',

    // 名前編集（UserNameDialog）
    'dialog.name.title': 'お名前を教えてください',
    'dialog.name.desc': '会議メンバーからの呼ばれ方に使われます。',
    'dialog.name.maxLength': '24文字まで',
    'dialog.name.apply': '変更を適用',
    'common.cancel': 'キャンセル',

    // セッション削除（DeleteSessionDialog）
    'dialog.delete.title': 'この思考を消去しますか？',
    'dialog.delete.desc': 'このセッション内のすべてのメッセージが失われます。',
    'dialog.delete.confirm': '消去する',

    // 魂の一覧（BeliefsDialog）
    'beliefs.tagline': 'Inner Voices',
    'beliefs.title': '会議メンバーの魂',
    'beliefs.desc': 'それぞれの視点が、どんな角度からあなたを見るか。',
    'beliefs.close.aria': '会議メンバーの魂を閉じる',

    // 生成中（ThinkingIndicator）
    'thinking.named': '{name} が、静かに見ています…',
    'thinking.generic': '視点が立ち上がっています…',
  },

  en: {
    // common
    'app.name': 'Jibun Kaigi',
    'app.tagline': 'INNER CONFERENCE ROOM',
    'app.subtitleInner': 'Inner Conference',
    'common.close': 'Close',
    'lang.toggleLabel': 'Switch language (日本語 / English)',
    'lang.short': '日本語',

    // onboarding (IntroOverlay)
    'intro.subtitle.default': 'Dive into yourself through five perspectives',
    'intro.subtitle.config': 'Check your settings to prepare for the meeting',
    'intro.keyline.line1': 'It does not lead. It only illuminates.',
    'intro.keyline.line2': 'The one who walks is you.',
    'intro.step.write': 'Write a question',
    'intro.step.summon': 'Summon a voice',
    'intro.step.mirror': 'Reflect in the mirror',
    'intro.cta.start': 'Begin the meeting',
    'intro.cta.config': 'Check settings',
    'intro.config.note': 'First, you will move to a screen to review the missing settings.',

    // empty state (EmptyState)
    'empty.title.line1': 'Start by setting down',
    'empty.title.line2': 'just one thing.',
    'empty.subtitle': "It's okay even if it isn't words yet.",
    'empty.hint.1': "Something in your chest that won't become words",
    'empty.hint.2': "Something that's been nagging you lately",
    'empty.hint.3': "A small unease you've told no one",
    'empty.hint.4': 'I want to look at myself, just a little',
    'empty.hint.aria': 'Use as input: {hint}',

    // sidebar (Sidebar / UserProfileButton / SessionList)
    'sidebar.newQuestion': 'New question',
    'sidebar.newQuestion.aria': 'Start a new question',
    'sidebar.agentRoles': 'Agent roles',
    'sidebar.members.aria': 'See the souls of the members',
    'sidebar.sessions.aria': 'Session list',
    'profile.client': 'Client',
    'profile.edit.aria': 'Edit your name: currently {name}',
    'session.empty.title': 'No saved questions yet.',
    'session.empty.subtitle': 'Your first question will remain here.',
    'session.untitled': 'Untitled',
    'session.list.aria': 'Past sessions',
    'session.edit.aria': 'Edit title',
    'session.pin.on': 'Pin',
    'session.pin.off': 'Unpin',
    'session.pinned.aria': 'Pinned',
    'session.delete.aria': 'Delete session',
    'session.title.aria': 'Session title',

    // header (TopHeader)
    'header.openMenu.aria': 'Open menu',
    'header.defaultTitle': 'Space of thought',
    'header.mode.group.aria': 'Response mode',
    'header.mode.aria': 'Response mode: {label}',

    // composer (Composer)
    'composer.input.aria': 'Message input field',
    'composer.send.aria': 'Send message',
    'composer.close.aria': 'Close input field',

    // agent bar (AgentControlBar / FloatingAgentBar)
    'agentbar.group.aria': 'Summon members',
    'agentbar.mirror.name': 'Mind Mirror',
    'agentbar.mirror.role': 'Sum up the thinking',
    'agentbar.mirror.aria': 'Mind Mirror: sum up the thinking so far',
    'agentbar.delegate.name': 'Entrust',
    'agentbar.delegate.aria': 'Entrust: let the moment choose a perspective',
    'agentbar.write': 'Write',
    'agentbar.openInput.aria': 'Open input field',
    'agentbar.closeInput.aria': 'Close input field',
    'agentbar.summon.aria': 'Summon {name} ({role})',
    'floating.open': 'Open perspectives',
    'floating.collapsed.aria': 'Bottom agent bar (collapsed)',
    'floating.expanded.aria': 'Bottom agent bar',
    'floating.mirror.aria': 'Summon the Mind Mirror',
    'floating.delegate.aria': 'Entrust (random agent)',
    'floating.summon.aria': 'Summon {name}',
    'floating.others.aria': 'Scroll to the OTHERS section',
    'floating.close.aria': 'Close bottom bar',

    // message (MessageBubble)
    'message.master.badge': 'Summary',
    'message.copy.aria': 'Copy message',
    'message.delete.aria': 'Delete message',
    'message.reaction.aria': "See {name}'s reaction",
    'message.others.empty': 'No comparison yet',

    // timeline (ChatTimeline)
    'timeline.loading': 'Loading',
    'timeline.syncing': 'Syncing messages',
    'timeline.mirrorInvite.aria': 'Reflect the voices so far in the Mind Mirror',
    'timeline.mirrorInvite.title': 'Shall we reflect the voices so far?',
    'timeline.mirrorInvite.subtitle': 'The Mind Mirror sums up your scattered thoughts',

    // name dialog (UserNameDialog)
    'dialog.name.title': 'What should we call you?',
    'dialog.name.desc': 'This is how the members will address you.',
    'dialog.name.maxLength': 'Up to 24 characters',
    'dialog.name.apply': 'Apply changes',
    'common.cancel': 'Cancel',

    // delete session (DeleteSessionDialog)
    'dialog.delete.title': 'Erase this thought?',
    'dialog.delete.desc': 'All messages in this session will be lost.',
    'dialog.delete.confirm': 'Erase',

    // beliefs (BeliefsDialog)
    'beliefs.tagline': 'Inner Voices',
    'beliefs.title': 'The souls of the members',
    'beliefs.desc': 'How each perspective looks at you, and from what angle.',
    'beliefs.close.aria': 'Close the souls of the members',

    // generating (ThinkingIndicator)
    'thinking.named': '{name} is quietly watching…',
    'thinking.generic': 'A perspective is rising…',
  },
};

export default translations;
