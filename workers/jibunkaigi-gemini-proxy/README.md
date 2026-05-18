# Jibunkaigi Gemini Proxy Worker

## 目的

Expo Universal版からGemini API Keyを隠してAI応答を取得するためのCloudflare Worker。

## 禁止

- Gemini API KeyをExpoアプリに入れない
- Gemini API KeyをGitにコミットしない
- PR本文にKeyを書かない

## Setup

1. `wrangler.toml.example` を参考に `wrangler.toml` を作成
2. `wrangler secret put GEMINI_API_KEY`
3. `npm run dev`
4. `npm run deploy`

## Manual Environment Gate

Firebase / Gemini Proxy の実接続は手動ゲートです。
実値やsecretはGitHubにコミットしません。

手順:
- `../../docs/environment-setup-gate.md`
- `../../docs/env-setup-guide.md`
- `../../docs/manual-environment-gate-checklist.md`
- `../../docs/universal-real-ai-firebase-qa.md`

## Endpoint

`POST /api/jibunkaigi/reply`

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
  "model": "gemini-1.5-flash"
}
```
