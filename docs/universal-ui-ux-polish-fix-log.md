# Universal UI/UX Polish Fix Log

## 方針
このログは、じぶん会議のUI/UX磨き込みで行った小さな調整を記録する。

## 修正記録
| ID | 対象 | 問題 | 修正 | 状態 |
|---|---|---|---|---|
| UX-001 | theme | 色・余白・文字・動きの基準が散っていた | `mobileTheme.ts` / `mobileSpacing.ts` / `mobileTypography.ts` / `mobileMotion.ts` を追加し、`tokens.ts` を整理 | 実施済み |
| UX-002 | ChatTimeline / MessageBubble | 会話の幅と行間が場所によって揺れていた | bubble幅、lineHeight、OTHERS badge、bottom余白を再調整 | 実施済み |
| UX-003 | MessageToolbar | copy / share / delete / OTHERS が少しうるさく見えた | toolbar button を quieter な surface と danger表現へ変更 | 実施済み |
| UX-004 | Composer / OTHERS | 下部操作がやや詰まって見えた | composer collapsed/open、OTHERS trigger、bottom panel の質感を整理 | 実施済み |
| UX-005 | Agent selection | AgentControlBar と FloatingAgentBar の役割差が見えづらかった | caption追加と active state の調整で視線誘導を整理 | 実施済み |
| UX-006 | Header / Drawer | 情報優先順位が弱く、一覧まわりが硬く見えた | Header hierarchy、Drawer surface、SessionListItem variant を調整 | 実施済み |
| UX-007 | Onboarding / Intro / Empty | 初回体験と空状態に仮実装感が残っていた | card質感、icon、余白、文言温度を揃えた | 実施済み |
| UX-008 | User / Member / Delete Sheet | sheetの閉じ方や危険操作の表現が少し硬かった | overlay・surface・button tone と delete文言を再調整 | 実施済み |
