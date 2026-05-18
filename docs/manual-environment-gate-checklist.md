# Manual Environment Gate Checklist

## Firebase Gate

- [ ] Firebase projectを確認
- [ ] Firebase Web app configを確認
- [ ] `apps/mobile/.env` にFirebase値を設定
- [ ] `.env` がGitに含まれていないことを確認
- [ ] Expo Webで 保存: Remote 表示を確認
- [ ] 新規セッションがFirestoreに作成されることを確認
- [ ] message subcollectionにメッセージが保存されることを確認
- [ ] 再読み込み後に過去会話が復元されることを確認
- [ ] セッション削除で古いセッションが戻らないことを確認
- [ ] 会話クリアで古いmessageが戻らないことを確認

## Gemini Proxy Gate

- [ ] Cloudflare Worker projectを確認
- [ ] `GEMINI_API_KEY`をWorker secretへ登録
- [ ] `wrangler.toml`に実Keyを書いていないことを確認
- [ ] Workerをdeploy
- [ ] `/api/jibunkaigi/reply` が応答する
- [ ] `/api/jibunkaigi/others` が応答する
- [ ] `apps/mobile/.env` にWorker URLを設定
- [ ] Expo Webで AI: Proxy 表示を確認
- [ ] 単一AI応答がmockではなくproxyになることを確認
- [ ] OTHERSがmockではなくproxyになることを確認

## iOS / Android Gate

- [ ] iOSでFirebase Remote保存確認
- [ ] iOSでGemini Proxy応答確認
- [ ] AndroidでFirebase Remote保存確認
- [ ] AndroidでGemini Proxy応答確認
- [ ] fallback時にアプリが落ちないことを確認
