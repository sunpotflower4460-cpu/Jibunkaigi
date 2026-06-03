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

    // エラートースト（App.jsx）
    'error.config.firebase': '設定が整うと、ここから会議を始められます。',
    'error.config.apiKey': '設定が整うと、視点が応答できるようになります。',
    'error.sessions.load': 'セッション一覧をうまく読み込めませんでした。少し時間を置いてお試しください。',
    'error.messages.load': 'メッセージをうまく読み込めませんでした。少し時間を置いてお試しください。',
    'error.session.update': 'セッションの更新がうまくいきませんでした。',
    'error.delegate.failed': '「委ねる」がうまく動きませんでした。もう一度お試しください。',
    'error.message.delete': 'メッセージをうまく消せませんでした。',
    'error.send.notReady': '接続を準備しています。少しだけお待ちください。',
    'error.send.failed': 'うまく送信できませんでした。少し時間を置いて、もう一度お試しください。',
    'error.agent.needPrompt': 'まずは「綴る」から、ひとこと置いてみてください。',
    'error.agent.startFailed': '応答をうまく始められませんでした。もう一度お試しください。',
    'error.agent.summonFailed': '視点をうまく呼び出せませんでした。もう一度お試しください。',
    'error.session.delete': 'うまく消せませんでした。もう一度お試しください。',
    'error.name.empty': 'お名前を入力してください。そのままでも大丈夫です。',
    'error.name.save': 'お名前の保存に失敗しました。',
    'error.ai.timeout': '応答に少し時間がかかりすぎたようです。少し時間を置いて、もう一度お試しください。',
    'error.ai.empty': 'うまく応答を受け取れませんでした。少し時間を置いて、もう一度お試しください。',
    'error.ai.malformed': '応答の形が少し乱れてしまいました。もう一度お試しください。',
    'error.dismiss.aria': 'エラーメッセージを閉じる',

    // 入力欄（プレースホルダー / ヘルパー）
    'composer.placeholder.default': '今ある言葉を、そのまま置いてみてください',
    'composer.placeholder.config': '設定が整うと、ここから問いを綴れます',
    'composer.helper.default': 'Enterで送信 / Shift+Enterで改行',
    'composer.helper.config': '設定が整うと、この画面から対話を始められます。',

    // エージェント操作のヘルパー文（状況別）
    'agent.helper.config': '設定が整うと、会議メンバーを呼び出せます。',
    'agent.helper.connecting': '接続を準備しています…',
    'agent.helper.noSession': 'まずは「綴る」から、今ある言葉を置いてください。',
    'agent.helper.noPrompt': '最初の一文を送ると、会議メンバーが応答します。',
    'agent.helper.generating': '声が立ち上がっています…',
    'agent.helper.ready': '気になる視点を選ぶか、「委ねる」で流れに任せられます。',

    // 設定不備カード
    'config.firebase.title': 'Firebase設定が未完了です',
    'config.firebase.detail': 'VITE_FIREBASE_* を設定すると、セッション保存と会議開始が有効にできます。',
    'config.gemini.title': 'Gemini APIキーが未設定です',
    'config.gemini.detail': 'VITE_GEMINI_API_KEY を設定すると、各エージェントの応答を生成できます。',
    'config.card.title': 'この環境では、まだ会議を開始できません',
    'config.card.subtitle': '不足している設定を補うと、そのままこの画面から対話を始められます。',
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

    // error toasts (App.jsx)
    'error.config.firebase': 'Once setup is complete, you can begin the meeting here.',
    'error.config.apiKey': 'Once setup is complete, the perspectives can respond.',
    'error.sessions.load': "We couldn't load your session list. Please try again in a little while.",
    'error.messages.load': "We couldn't load the messages. Please try again in a little while.",
    'error.session.update': "We couldn't update the session.",
    'error.delegate.failed': '"Entrust" didn\'t work. Please try again.',
    'error.message.delete': "We couldn't delete the message.",
    'error.send.notReady': 'Preparing the connection. Please wait a moment.',
    'error.send.failed': "We couldn't send your message. Please wait a little and try again.",
    'error.agent.needPrompt': 'Start by writing a few words with "Compose."',
    'error.agent.startFailed': "We couldn't start the response. Please try again.",
    'error.agent.summonFailed': "We couldn't summon the perspective. Please try again.",
    'error.session.delete': "We couldn't delete it. Please try again.",
    'error.name.empty': "Please enter your name. It's okay to leave it as is.",
    'error.name.save': "We couldn't save your name.",
    'error.ai.timeout': 'The response took a little too long. Please wait a little and try again.',
    'error.ai.empty': "We couldn't receive a response. Please wait a little and try again.",
    'error.ai.malformed': 'The response came out a little malformed. Please try again.',
    'error.dismiss.aria': 'Dismiss error message',

    // composer (placeholder / helper)
    'composer.placeholder.default': 'Set down the words you have right now, just as they are',
    'composer.placeholder.config': 'Once setup is complete, you can compose your question here',
    'composer.helper.default': 'Enter to send / Shift+Enter for a new line',
    'composer.helper.config': 'Once setup is complete, you can start the dialogue from this screen.',

    // agent control helper text (by state)
    'agent.helper.config': 'Once setup is complete, you can summon the members.',
    'agent.helper.connecting': 'Preparing the connection…',
    'agent.helper.noSession': 'Start by setting down your words with "Compose."',
    'agent.helper.noPrompt': 'Send your first sentence and the members will respond.',
    'agent.helper.generating': 'A voice is rising…',
    'agent.helper.ready': 'Choose a perspective that draws you, or let the flow decide with "Entrust."',

    // config issue cards
    'config.firebase.title': 'Firebase setup is incomplete',
    'config.firebase.detail': 'Set VITE_FIREBASE_* to enable session saving and starting a meeting.',
    'config.gemini.title': 'The Gemini API key is not set',
    'config.gemini.detail': "Set VITE_GEMINI_API_KEY to generate each agent's responses.",
    'config.card.title': "You can't start a meeting in this environment yet",
    'config.card.subtitle': 'Fill in the missing settings and you can start the dialogue right from this screen.',
  },
};

export default translations;
