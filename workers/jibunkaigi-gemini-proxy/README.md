# Jibunkaigi Gemini Proxy Worker

## 目的

Expo Universal版からGemini API Keyを隠し、認証・入力制限・安全分岐を通してAI応答を取得するためのCloudflare Worker。

## 禁止

- Gemini API KeyをExpoアプリに入れない
- Gemini API KeyをGitにコミットしない
- PR本文にKeyを書かない
- 本番Workerを `FIREBASE_PROJECT_ID` 未設定のまま公開し続けない

## Setup

1. `wrangler.toml.example` を参考に `wrangler.toml` を作成
2. `GEMINI_MODEL` を確認する（既定: `gemini-2.5-flash-lite`）
3. 本番では `FIREBASE_PROJECT_ID` をアプリと同じFirebase project IDに設定
4. `wrangler secret put GEMINI_API_KEY`
5. 任意でRate Limit用KVを作成し、`RATE_LIMIT_KV` をbind
6. `npm run dev`
7. `npm run deploy`

`FIREBASE_PROJECT_ID` が設定されると、`/reply` と `/others` はFirebase ID tokenを持つリクエストだけを受け付けます。Expoアプリ側は匿名認証ユーザーのtokenを `Authorization: Bearer ...` で自動送信します。

Rate Limit用KVを設定した場合、`RATE_LIMIT_MAX_PER_MINUTE`（既定60）をIP単位・1分単位の目安として適用します。これは完全な課金防御ではなく、Cloudflare側の追加ルールと併用してください。

## Manual Environment Gate

Firebase / Gemini Proxy の実接続は手動ゲートです。実値やsecretはGitHubにコミットしません。

手順:
- `../../docs/environment-setup-gate.md`
- `../../docs/env-setup-guide.md`
- `../../docs/manual-environment-gate-checklist.md`
- `../../docs/universal-real-ai-firebase-qa.md`

## Endpoint

- `POST /api/jibunkaigi/reply`
- `POST /api/jibunkaigi/others`
- `GET /api/jibunkaigi/dev-traces`（開発者のみ）

## Request

```json
{
  "sessionId": "session_xxx",
  "userText": "今の問い",
  "agentId": "ray",
  "modeId": "dialogue",
  "messages": []
}
```

## Response

```json
{
  "text": "AI応答",
  "agentId": "ray",
  "agentLabel": "レイ",
  "model": "gemini-2.5-flash-lite"
}
```

## Guard rails

- request body: 最大64KB
- userText: 最大4,000文字
- history: 直近30件、各2,000文字まで
- Gemini upstream: timeoutあり
- OTHERS: 指定対象外・重複・メイン本人の応答を除外
- 直接的な自傷・他害表現: persona / OTHERS / dev traceより前に静的な安全案内へ分岐

## Dev trace

読み出し時のsecretはURL queryに載せず、次のいずれかで送ります。

```text
Authorization: Bearer <DEV_TRACE_SECRET>
```

または

```text
X-Jibunkaigi-Dev-Trace: <DEV_TRACE_SECRET>
```
