# Universal UI/UX Bug QA

## 目的
Expo Universal版で、UIの重なり・崩れ・押しづらさ・Safe Area・Keyboard問題を検証する。

## 対象環境
| 環境 | 状態 | 備考 |
|---|---|---|
| Expo Web / narrow mobile viewport | 未確認 | iPhone SE相当。`npm run web` 起動確認のみ、実表示QAは追加で必要 |
| Expo Web / iPhone 14 viewport | 未確認 | `npm run web` 起動確認のみ |
| Expo Web / tablet width | 未確認 | `npm run web` 起動確認のみ |
| iOS Simulator / Device | 未確認 | Safe Area / Keyboard / Sheet操作は要確認 |
| Android Emulator / Device | 未確認 | 下部ナビ・Keyboard・Sheet操作は要確認 |

## 重点確認
| ID | 領域 | 確認内容 | 状態 | 修正 |
|---|---|---|---|---|
| UI-001 | Header | ボタンが横幅不足で重ならない | 修正済み / 要画面確認 | `MobileSessionHeader` を縦構成+横スクロール操作列に整理 |
| UI-002 | Status | StatusStripがHeader/Timelineを圧迫しない | 修正済み / 要画面確認 | Status / Error / Config notice を compact / horizontal scroll 化 |
| UI-003 | Timeline | 最後のメッセージがComposerに隠れない | 修正済み / 要画面確認 | `MobileBottomSpacer` と bottom/floating 実測オフセットを導入 |
| UI-004 | Composer | Keyboard表示時に入力欄が隠れない | 修正済み / 要実機確認 | `MobileSafeLayout` 導入、bottom dock を safe area 前提に再配置 |
| UI-005 | Composer | 送信ボタンが入力欄に重ならない | 修正済み / 要画面確認 | bottom dock 分離と composer 保持余白を追加 |
| UI-006 | FloatingAgentBar | Composerと重ならない | 修正済み / 要画面確認 | `MobileFloatingAgentBar` を bottom dock 高さ基準に再配置 |
| UI-007 | MessageToolbar | コピー/共有/削除/OTHERSが押しやすい | 修正済み / 要実機確認 | toolbar最小幅・中央寄せを調整し、timeline余白を拡張 |
| UI-008 | Drawer | SessionDrawerが画面外にはみ出さない | 修正済み / 要実機確認 | 狭幅時の drawer 幅を 92% に制限、close tap area を拡大 |
| UI-009 | Sheets | Member/UserName/Edit/Delete Sheetが閉じられる | 一部修正済み / 要実機確認 | Member/UserName/Edit sheet の tap area / scroll / keyboard 回避を補強 |
| UI-010 | Onboarding | 初回画面が狭い画面で崩れない | 修正済み / 要画面確認 | onboarding / intro / empty state を compact / scroll 前提に調整 |
