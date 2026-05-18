# Universal Composer and Floating Agent Bar

## 目的
旧Vite Web版の入力欄開閉と FloatingAgentBar を Expo Universal版へ寄せる。

## Web監査結果
- `src/components/composer/Composer.jsx` は close icon 付きの入力欄を持ち、送信ボタンを入力欄の右下に固定している。
- `src/components/composer/AgentControlBar.jsx` は `綴る / 閉じる` のトグルを持ち、心の鏡・委ねる・各エージェントを横並びで出している。
- `src/components/FloatingAgentBar.jsx` は初回入力後に固定下部へ出現し、折りたたみ/展開とエージェント導線を持つ。
- `src/App.jsx` では `showInput` 初期値は open で、送信時と agent click 時に collapsed へ切り替わる。

## 実装
- `packages/shared/src/composer/composerTypes.ts` に `UniversalComposerVisibility` を追加した。
- `packages/shared/src/composer/composerLabels.ts` に `綴る / 閉じる / ここに置いてみる… / 問いを綴る` を追加した。
- `apps/mobile/state/useUniversalConversation.ts` に `composerVisibility` と `openComposer / closeComposer / toggleComposer` を追加した。
- 送信後は Web版と同様に composer を閉じる。
- `apps/mobile/components/composer/MobileComposer.tsx` を open / collapsed 両対応へ更新した。
- `apps/mobile/components/composer/MobileFloatingAgentBar.tsx` を追加し、会話後に固定下部トグルと常駐エージェント導線を出すようにした。
- `apps/mobile/app/index.tsx` で composer / floating bar を接続した。

## AgentControlBar との役割整理
- `MobileAgentControlBar` は通常の横スクロール選択列として残した。
- `MobileFloatingAgentBar` は composer 周辺で失われない補助導線として追加した。
- これにより、Web版の二段導線に近い役割分担を Expo でも維持する。

## 意図的差分
- iOS / Android / Expo Web の Safe Area とキーボード差分は内部オフセットで吸収する。
- FloatingAgentBar は Web版の即時実行バーではなく、Universal版の既存 agent selection モデルに合わせた compact selection bar として配置した。
