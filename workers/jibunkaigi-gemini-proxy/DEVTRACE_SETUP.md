# Gemini Proxy Worker — デプロイ & dev トレース手順メモ

このWorkerの本番デプロイと、開発者トレース（`/api/jibunkaigi/dev-traces`）のセットアップ手順。**秘密値（APIキー・合言葉・実URL）はリポジトリに置かない**。`wrangler.toml` と `.env` は git 管理外なので、手元で作る。

---

## 1. `wrangler.toml`

`wrangler.toml.example` をコピーして作成する。

```toml
name = "jibunkaigi-gemini-proxy"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[vars]
GEMINI_MODEL = "gemini-2.5-flash-lite"
ALLOWED_ORIGIN = "*"

# 本番では必須。Expoアプリと同じFirebase project ID。
FIREBASE_PROJECT_ID = "your-firebase-project-id"

# 任意。IP単位の簡易Rate Limit。
RATE_LIMIT_MAX_PER_MINUTE = "60"

[[kv_namespaces]]
binding = "DEV_TRACE_KV"
id = "dev-trace-kv-id"

# 任意。Rate Limitを有効にする場合。
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "rate-limit-kv-id"
```

Worker URLは `name` から決まり、デプロイ時にも表示される。これを `EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL` に設定する。

## 2. KV namespace

```bash
cd workers/jibunkaigi-gemini-proxy
npx wrangler kv namespace create DEV_TRACE_KV
npx wrangler kv namespace create RATE_LIMIT_KV
```

Rate Limitを使わない場合、`RATE_LIMIT_KV` は省略できる。`DEV_TRACE_KV` も開発者トレースを利用しない場合は省略できる。

## 3. Secrets

```bash
# 必須
npx wrangler secret put GEMINI_API_KEY

# 開発者トレースを使う場合のみ
npx wrangler secret put DEV_TRACE_SECRET
```

secretは書き込み専用。値が分からなくなった場合は再設定する。

## 4. デプロイ

```bash
npx wrangler deploy
```

## 5. アプリ側 `.env`

`apps/mobile/.env.example` をコピーして設定する。

```bash
EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL=https://jibunkaigi-gemini-proxy.<subdomain>.workers.dev

# 開発時のみ。App Store向け本番ビルドには入れない。
EXPO_PUBLIC_DEV_TRACE=1
EXPO_PUBLIC_DEV_TRACE_KEY=<DEV_TRACE_SECRET>
```

Firebase系の `EXPO_PUBLIC_FIREBASE_*` も同じFirebase projectへ向ける。アプリは匿名認証ユーザーのID tokenを取得し、Workerへ `Authorization: Bearer ...` で送信する。

---

## エンドポイント仕様

| メソッド | パス | 用途 |
|---|---|---|
| POST | `/api/jibunkaigi/reply` | 通常応答。危機入力はモデル実行前に安全案内へ分岐 |
| POST | `/api/jibunkaigi/others` | ほかの視点。対象外・重複・メイン本人の返答を除外 |
| GET | `/api/jibunkaigi/dev-traces` | 開発者トレース読み出し |

`FIREBASE_PROJECT_ID` が設定されている場合、`/reply` と `/others` は有効なFirebase ID tokenが必須。`/dev-traces` はFirebase tokenではなく `DEV_TRACE_SECRET` で保護する。

## `/reply` のリクエスト例

```json
{
  "userText": "…",
  "agentId": "satou",
  "modeId": "dialogue",
  "messages": [],
  "userName": null,
  "sessionId": "devtest",
  "devTrace": true
}
```

トレース用secretはJSON bodyやURL queryに入れず、`X-Jibunkaigi-Dev-Trace` headerで送る。アプリ側クライアントもこの方式を使用する。

## トレース確認

```bash
REAL=jibunkaigi-gemini-proxy.<subdomain>.workers.dev
SECRET=<DEV_TRACE_SECRET>
FIREBASE_TOKEN=<有効なFirebase ID token>

# ① 記録
curl -sS -X POST "https://$REAL/api/jibunkaigi/reply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "X-Jibunkaigi-Dev-Trace: $SECRET" \
  -d '{"userText":"今の状況を整理したい","agentId":"satou","modeId":"dialogue","messages":[],"sessionId":"devtest","devTrace":true}'

# ② 最新トレースを取得
curl -sS "https://$REAL/api/jibunkaigi/dev-traces" \
  -H "Authorization: Bearer $SECRET" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); t=d['traces'][0]; print('COUNT:',d['count']); print('=== PROMPT ==='); print(t['prompt']); print('=== REFLECTION ==='); print(json.dumps(t.get('reflection'),ensure_ascii=False,indent=2))"
```

`X-Jibunkaigi-Dev-Trace: $SECRET` を読み出し側で使うこともできる。

直接的な自傷・他害表現はトレースに保存されず、persona・tool・Gemini処理より前に安全案内へ分岐する。

## トラブルシュート

- **401 unauthorized（reply / others）**: `FIREBASE_PROJECT_ID` とアプリのFirebase projectが一致しているか、ID tokenが送信されているか確認する。
- **401 unauthorized（dev-traces）**: `Authorization: Bearer` または `X-Jibunkaigi-Dev-Trace` の値と `DEV_TRACE_SECRET` を確認する。
- **429 rate_limited**: 1分あたりの上限を超えている。`RATE_LIMIT_MAX_PER_MINUTE` とCloudflareルールを確認する。
- **tracesが空**: `DEV_TRACE_KV` binding、`EXPO_PUBLIC_DEV_TRACE=1`、header secretを確認する。
- **本番ビルドで記録が走らない**: 正常。`EXPO_PUBLIC_DEV_TRACE*` を本番へ入れない設計。
- **CORSエラー**: `ALLOWED_ORIGIN` と、Worker URLが正しいか確認する。
