# Universal UI/UX Polish Guide

## 目的
Expo Universal版のじぶん会議を、機能実装済みの状態から、App Storeに出しても違和感のない完成度へ磨く。

## 目指す質感
- 静か
- 余白がある
- 押しつけない
- 内省しやすい
- 文字が読みやすい
- 操作に迷わない
- 過剰に派手ではない
- 元のWeb版の雰囲気を保つ

## 避ける質感
- AI生成っぽいカード乱立
- ボタンが多すぎる
- 余白不足
- 色の意味がバラバラ
- 影が強すぎる
- 情報密度が高すぎる
- 内省アプリなのに急かして見える

## 優先順位
1. 会話の読みやすさ
2. 問いを書く導線の自然さ
3. エージェント選択の分かりやすさ
4. OTHERS / メッセージ操作の邪魔にならなさ
5. Header / Status / Drawer / Sheet の品位
6. 初回体験の静けさ

## 今回そろえた基準
- `apps/mobile/theme/mobileTheme.ts` / `mobileSpacing.ts` / `mobileTypography.ts` / `mobileMotion.ts` を追加し、主要コンポーネントの色・余白・文字・動きの基準を整理した
- Chat / Composer / Header / Drawer / Sheet / Onboarding の主要面を、最大幅・余白・控えめなアクセントで寄せた
- 削除やOTHERSなどの強い操作は、見つけやすさを保ちながら主張を弱めた

## 旧Vite Web版との雰囲気差分メモ

### 旧Web版とそろえた部分
- Onboarding / Intro / EmptyState の見出し、補助文、3ステップの静かなトーン
- 会話開始前の「まずは、ひとつ置いてみる。」の入口感
- Composer / FloatingAgentBar / AgentControlBar の二段導線
- MessageBubble と message action の「見えるがうるさくない」密度

### Expoで意図的に変えた部分
- Drawer / Sheet はモバイルの safe area とタップ領域を優先し、Webのサイドバーより余白を広くしている
- FloatingAgentBar は Web の即時実行バーではなく、Expo版の既存 selection モデルに合わせた静かな quick access に留めている
- 共有導線は OS 標準シートを使うため見た目差分を許容する

### まだ違和感が残る部分
- Firebase / Gemini 実接続時の status / error の最終トーンは Manual Gate 後に再確認が必要
- iOS / Android 実機での keyboard / bottom safe area / drawer close feel は最終QA待ち
- Web版と完全一致の微差（横幅、フォントレンダリング、OS共有UI）は継続記録が必要

### 次フェーズへ送ること
- FP-006 文言差分の実機画面比較
- FP-007 UI配置差分の side-by-side 最終確認
- FP-008 iOS / Android 実機QA
