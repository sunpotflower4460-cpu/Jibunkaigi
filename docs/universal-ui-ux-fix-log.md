# Universal UI/UX Fix Log

## 修正方針
- 新機能追加ではなく、重なり・崩れ・押しづらさの修正を優先する
- iOS / Android / Expo Webで同じ導線を維持する
- Safe Area / Keyboard / Bottom fixed UI を重点的に見る

## 修正記録
| ID | 問題 | 修正内容 | 対象ファイル | 状態 |
|---|---|---|---|---|
| UI-001 | Header の操作群が狭幅で詰まりやすい | 上段タイトル+下段操作列へ整理し、compact時は横スクロールで逃がす | `apps/mobile/components/session/MobileSessionHeader.tsx` | 修正済み |
| UI-002 | Status / Error / Config 表示が縦に積み上がりやすい | 各 notice を compact / horizontal scroll 化し最大横幅を制御 | `apps/mobile/components/status/MobileStatusStrip.tsx`, `apps/mobile/components/status/MobileErrorNotice.tsx`, `apps/mobile/components/status/MobileConfigNotice.tsx` | 修正済み |
| UI-003 | Timeline末尾が bottom fixed UI に隠れる | `MobileBottomSpacer` を追加し、bottom dock / floating bar 実測値を反映 | `apps/mobile/components/layout/MobileBottomSpacer.tsx`, `apps/mobile/components/chat/MobileChatTimeline.tsx`, `apps/mobile/app/index.tsx` | 修正済み |
| UI-004 | Safe Area / Keyboard の扱いが画面ごとに揺れる | `MobileSafeLayout` と `SafeAreaProvider` を導入して基盤を統一 | `apps/mobile/components/layout/MobileSafeLayout.tsx`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx` | 修正済み |
| UI-005 | Composer / FloatingAgentBar が重なりやすい | bottom dock を単一コンテナ化し、FloatingAgentBar を dock 高さ基準へ変更 | `apps/mobile/app/index.tsx`, `apps/mobile/components/composer/MobileFloatingAgentBar.tsx` | 修正済み |
| UI-006 | MessageToolbar / bubble が狭幅で押しづらい | bubble 幅制約と toolbar 最小幅を見直し、折り返しやすくした | `apps/mobile/components/chat/MobileMessageBubble.tsx`, `apps/mobile/components/chat/MobileMessageToolbar.tsx` | 修正済み |
| UI-007 | Onboarding / Intro / EmptyState が小画面で縦に詰まりやすい | scroll / compact spacing を追加して小高さ画面に対応 | `apps/mobile/components/onboarding/MobileOnboardingScreen.tsx`, `apps/mobile/components/intro/MobileIntroScreen.tsx`, `apps/mobile/components/chat/MobileEmptyState.tsx` | 修正済み |
| UI-008 | Drawer / Sheet の閉じる導線と keyboard 回避が弱い | close tap area 拡大、ScrollView化、maxHeight 制限を追加 | `apps/mobile/components/session/MobileSessionDrawer.tsx`, `apps/mobile/components/session/MobileSessionEditSheet.tsx`, `apps/mobile/components/user/MobileUserNameSheet.tsx`, `apps/mobile/components/members/MobileMemberSheet.tsx` | 修正済み |
