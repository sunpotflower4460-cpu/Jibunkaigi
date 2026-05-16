# Universal Gemini Proxy

## 目的

iOS / Android / Expo Webで同じAI応答ルートを使う。
ExpoアプリはGemini APIを直接呼ばない。

## 構造

```
Expo Universal App
  ↓
Universal AI Client
  ↓
Cloudflare Worker Proxy
  ↓
Gemini API
```

## Expo側に置いてよいもの

- `EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL`

## Expo側に置いてはいけないもの

- Gemini API Key
- Gemini secret
- Cloudflare secret

## 今回できること

- AI client interface (`services/ai/aiClientTypes.ts`)
- Proxy client (`services/ai/geminiProxyClient.ts`)
- mock fallback (`services/ai/aiFallback.ts`)
- AI client factory (`services/ai/universalAiClient.ts`)
- AI status badge (`components/status/MobileAiStatusBadge.tsx`)
- Worker proxy雛形 (`workers/jibunkaigi-gemini-proxy/`)
- docs

## まだできないこと

- 本格rate limit
- user quota
- streaming
- prompt shared化
- production deploy automation
