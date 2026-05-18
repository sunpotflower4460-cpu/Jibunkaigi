# Universal Status and Errors

Expo Universal版では、通信・保存・設定不足・読み込み中の状態を shared の `UniversalRuntimeStatus` と `buildUniversalStatusItems()` で組み立て、iOS / Android / Expo Web で同じ文言を表示する。

## 対応済み状態

- AI応答中
- OTHERS応答中
- セッション読み込み中
- セッション保存中
- Firebase未設定
- Gemini Proxy未設定
- AI応答失敗
- OTHERS応答失敗
- 保存失敗
- local / mock fallback 動作中

## UI構成

- `MobileLoadingOverlay`: 初期セッション読み込み中の中央表示
- `MobileStatusStrip`: 本番でも見せる軽量な状態表示
- `MobileErrorNotice`: 失敗時のやさしい警告表示
- `MobileConfigNotice`: `__DEV__` のみで Firebase / Proxy 未設定を表示

## 実装方針

- Firebase 未設定時は保存をローカル fallback に切り替える
- Gemini Proxy 未設定時は AI を mock fallback に切り替える
- 生の例外文言はそのまま UI に出しすぎず、短い案内文に変換する
- 状態文言は `packages/shared/src/status/` に集約し、mobile 側に直書きしすぎない
