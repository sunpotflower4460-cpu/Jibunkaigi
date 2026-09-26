# Jibunkaigi Gemini Proxy Worker

（名前は歴史的経緯で gemini-proxy のまま。デプロイ設定が壊れるので変えない。現在は Gemini を使わない）

## 目的

Expo Universal版からLLMのAPI Keyを隠し、認証・入力制限・安全分岐を通してAI応答を取得するためのCloudflare Worker。
接続先はすべて OpenAI 互換の Chat Completions（GPT-6 Luna / Sol、Groq、さくらのAI Engine、DeepSeek）。

## 禁止

- API KeyをExpoアプリに入れない
- API KeyをGitにコミットしない（`wrangler.toml` にも書かない。secret で登録する）
- PR本文にKeyを書かない
- `ENABLE_SAKURA` を約款確認前に `true` にしてデプロイしない
- 本番Workerを `FIREBASE_PROJECT_ID` 未設定のまま公開し続けない

## Setup

1. `wrangler.toml.example` を参考に `wrangler.toml` を作成（git管理外）
2. モデルIDを確認する（既定は `packages/shared/src/providers/routeTable.ts`。`MODEL_*` で上書き可）
3. 本番では `FIREBASE_PROJECT_ID` をアプリと同じFirebase project IDに設定
4. 使うプロバイダのキーだけを secret で登録する
   - `wrangler secret put OPENAI_API_KEY`（Luna / Sol）
   - `wrangler secret put GROQ_API_KEY`
   - `wrangler secret put SAKURA_API_KEY`
   - `wrangler secret put DEEPSEEK_API_KEY`
   - キーが無いプロバイダは滝の中で自動的に飛ばされる
5. 任意でRate Limit用KVを作成し、`RATE_LIMIT_KV` をbind
6. `npm run dev`（ローカルでは secret を `.dev.vars` に置く。git管理外）
7. `npm run deploy`

## ルーティング（指示書11）

プラン × 用途ごとの候補列は `packages/shared/src/providers/routeTable.ts` の `ROUTE_TABLE`。
候補を先頭から順に試し、429 / 5xx / タイムアウト / 空応答 / JSON不正なら次へ落とす（`src/providers/callWithFallback.ts`）。

- プランはクライアントの申告を信用しない。課金実装までは全員 `free`。
- 開発用の上書き `X-Jibunkaigi-Dev-Tier` は、`X-Jibunkaigi-Dev-Trace` が `DEV_TRACE_SECRET` と一致したときだけ有効。
- `ENABLE_SAKURA` が `true` でなければ、さくらは候補から外れる。
- GPT-6 系（Luna / Sol）は system / developer / 合成 tool（look_inward）/ user に分けて送る。合成 tool が 400 で拒否されたら、材料を developer の末尾に置いて同じプロバイダに1回だけ送り直す。
- 危機判定はルーティングより前（変更しない）。

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
  "provider": "groq",
  "model": "openai/gpt-oss-120b"
}
```

## Guard rails

- request body: 最大64KB
- userText: 最大4,000文字
- history: 直近30件、各2,000文字まで
- LLM upstream: プロバイダごとのtimeoutと全体の上限あり
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
