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
  },
};

export default translations;
