# Universal UI/UX Polish Checklist
| ID | 領域 | 確認内容 | 状態 | 備考 |
|---|---|---|---|---|
| UX-001 | 全体 | 色・角丸・影・余白が統一されている | 一部確認 | theme token整理と主要画面反映済み。実機最終確認待ち |
| UX-002 | 全体 | 画面を開いた瞬間に仮実装感がない | 一部確認 | Onboarding / Intro / Empty / Drawer を再調整 |
| UX-003 | Header | タイトル・名前・操作ボタンの優先順位が分かる | 一部確認 | Header hierarchy を整理。狭幅/実機確認は継続 |
| UX-004 | Status | 状態表示が安心感を出し、邪魔にならない | 一部確認 | Status / Error / Config を compact surface 化 |
| UX-005 | Timeline | 会話が読みやすい | 一部確認 | bubble幅・lineHeight・余白を調整 |
| UX-006 | MessageBubble | user / agent / OTHERS の違いが自然に分かる | 一部確認 | badge / accent / bubble密度を再調整 |
| UX-007 | MessageToolbar | コピー/共有/削除/OTHERSが主張しすぎない | 一部確認 | toolbarを quieter に調整。実機 tap QA待ち |
| UX-008 | Composer | 書き始めたくなる余白と視認性がある | 一部確認 | collapsed/open の質感調整済み |
| UX-009 | FloatingAgentBar | 便利だが邪魔ではない | 一部確認 | pill化と panel幅調整済み。実機重なり確認待ち |
| UX-010 | AgentControl | エージェント選択が分かりやすい | 一部確認 | caption 追加、active/non-active の差を整理 |
| UX-011 | Drawer | セッション一覧が整理されて見える | 一部確認 | drawer/list item/button variant を再調整 |
| UX-012 | Sheets | 編集・名前・メンバー説明が品よく見える | 一部確認 | UserName / Member / Delete 系 sheet を静かな表現へ調整 |
| UX-013 | Onboarding | 初回体験がじぶん会議らしい | 一部確認 | onboarding card / step / CTA の温度を調整 |
| UX-014 | Motion | 動きが軽く、過剰ではない | 一部確認 | motion token を追加。Modal/OS標準挙動中心 |
| UX-015 | Accessibility | 文字サイズ・コントラスト・タップ領域が適切 | 一部確認 | 44px基準を token 化。実機最終確認待ち |
| UX-016 | Entry screen | 設定確認画面が既存導線のまま読みやすく整っている | 実施済み | keyline-card shadow を soften、支援コピー weight 調整（font-semibold + leading-relaxed）、helper テキストを text-center 化、mobile panel の borderRadius を 40→28 に縮小してカード感を軽減 |
| UX-017 | Intro screen | 問い導入画面が既存体験のまま読みやすく整っている | 実施済み | 「ヒント」ラベルを「たとえば、こんな問いから」に変更しリスト感を解消。hintChip を surfaceStrong + radius.lg に変更し prompt card 感に。paddingVertical / minHeight を拡大してタップ領域を改善（52→56px）。iconWrap のボーダーを削除しシンプル化。heading に lineHeight を追加。content の gap を xl→lg に調整し縦リズムを整える。 |
