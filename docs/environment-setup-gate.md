# Environment Setup Gate

## 目的

Firebase / Gemini API / Cloudflare Worker の実接続は、秘密情報を扱うため手動ゲートとして管理する。
このPRでは、実接続そのものは行わない。
安全に手動設定できる土台・手順・確認UIを整える。

## エージェントがやること

- `.env.example` の整備
- 設定不足時のfallback表示
- Worker設定手順のdocs化
- Firebase設定手順のdocs化
- QA checklistの作成
- Gemini API KeyをExpoに入れないガード

## ユーザーが手動でやること

- Firebase Consoleから設定値を取得
- `apps/mobile/.env` にFirebase値を設定
- Cloudflare Workerに`GEMINI_API_KEY`をsecret登録
- Workerをdeploy
- Expo envにWorker URLを設定
- iOS / Android / Expo Webで実接続確認

## 絶対禁止

- Gemini API KeyをExpo envに入れない
- Gemini API KeyをGitHubに書かない
- Firebase実値をコミットしない
- `.env`をコミットしない

## 次フェーズ

Manual Gate完了後、Phase 2-14B Real Environment Smoke Testで実接続確認を行う。
