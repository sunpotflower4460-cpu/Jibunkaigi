# Env Setup Guide

## 1. `apps/mobile/.env` を作る

`apps/mobile/.env.example` をコピーして `.env` を作る。

```bash
cd apps/mobile
cp .env.example .env
```

## 2. Firebase値を設定する

Firebase ConsoleでWeb app configを確認し、以下へ設定する。

```txt
EXPO_PUBLIC_JIBUNKAIGI_APP_ID=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## 3. Gemini API KeyはExpoに入れない

以下は絶対に設定しない。

```txt
GEMINI_API_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
```

Gemini API KeyはCloudflare Workerのsecretにのみ設定する。

## 4. Cloudflare Worker secretを設定する

```bash
cd workers/jibunkaigi-gemini-proxy
wrangler secret put GEMINI_API_KEY
```

## 5. Workerをdeployする

```bash
cd workers/jibunkaigi-gemini-proxy
npm install
npm run typecheck
npm run deploy
```

`wrangler.toml`には`GEMINI_API_KEY`を書かない。
本番では`ALLOWED_ORIGIN = "*"`を避け、必要なoriginに制限する。

## 6. Expo側にWorker URLを設定する

```txt
EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL=https://your-worker.example.workers.dev
```

## 7. 確認

- Firebase設定あり → 保存: Remote
- Worker URLあり → AI: Proxy
- 未設定 → local/mock fallback
