# Gemini Proxy Worker — デプロイ & dev トレース手順メモ

このWorkerの本番デプロイと、開発者トレース（`/api/jibunkaigi/dev-traces`）の
セットアップ手順。**秘密値（APIキー・合言葉・実URL）はリポジトリに置かない**。
`wrangler.toml` と `.env` は git 管理外（`.gitignore` 済み）なので、手元で作る。

---

## 1. `wrangler.toml`（手元に作成。`wrangler.toml.example` が雛形）

```toml
name = "jibunkaigi-gemini-proxy"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[vars]
GEMINI_MODEL = "gemini-1.5-flash"
ALLOWED_ORIGIN = "*"

# 開発者トレース用の KV（手順2で作った id を入れる）
[[kv_namespaces]]
binding = "DEV_TRACE_KV"
id = "（wrangler kv namespace create で出た id）"
```

> Worker の URL は `name` から決まる:
> **`jibunkaigi-gemini-proxy.<あなたのsubdomain>.workers.dev`**
> （デプロイ時にも表示される。これが `EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL` の値）

## 2. KV namespace（トレース保存先）

```bash
cd workers/jibunkaigi-gemini-proxy
npx wrangler kv namespace create DEV_TRACE_KV
# → 出力された id を wrangler.toml の [[kv_namespaces]] id に貼る
```

## 3. Secrets（`wrangler.toml` には書かない。CLIで設定）

```bash
# 必須: Gemini APIキー（これが無いと /reply 自体が 500）
npx wrangler secret put GEMINI_API_KEY

# 開発者トレースの合言葉（任意の長いランダム文字列）
npx wrangler secret put DEV_TRACE_SECRET
```

> secret は書き込み専用。ダッシュボードで値は再表示できない。分からなくなったら
> `wrangler secret put DEV_TRACE_SECRET` で入れ直せば新しい合言葉になる（即時反映・再デプロイ不要）。

## 4. デプロイ

```bash
npx wrangler deploy
# → 最後に本番URL（https://jibunkaigi-gemini-proxy.<subdomain>.workers.dev）が表示される
```

## 5. アプリ側 `.env`（`apps/mobile/.env`。git 管理外）

`apps/mobile/.env.example` をコピーして値を入れる。トレースに関係するのは:

```bash
EXPO_PUBLIC_JIBUNKAIGI_API_BASE_URL=https://jibunkaigi-gemini-proxy.<subdomain>.workers.dev

# 開発時のみ ON（本番ビルドには入れない）
EXPO_PUBLIC_DEV_TRACE=1
EXPO_PUBLIC_DEV_TRACE_KEY=（手順3で設定した DEV_TRACE_SECRET と同じ値）
```

（Firebase 系の `EXPO_PUBLIC_FIREBASE_*` は `.env.example` 参照。）

---

## エンドポイント仕様（`src/index.ts` と一致）

| メソッド | パス | 用途 |
|---|---|---|
| POST | `/api/jibunkaigi/reply` | 通常応答（合言葉一致時のみトレース記録） |
| POST | `/api/jibunkaigi/others` | OTHERS（ほかの声） |
| GET | `/api/jibunkaigi/dev-traces?key=<secret>` | トレース読み出し（合言葉一致時） |

`/reply` のリクエストボディ:
```json
{
  "userText": "…",
  "agentId": "satou",
  "modeId": "dialogue",
  "messages": [],
  "userName": null,
  "sessionId": "devtest",
  "devTrace": true,
  "devTraceKey": "<DEV_TRACE_SECRET>"
}
```
`devTrace: true` かつ `devTraceKey` が `DEV_TRACE_SECRET` と一致した時だけ、
`ctx.waitUntil` で入力・組んだプロンプト全文・出力・reflection を KV に記録（30日TTL）。

---

## トレース確認（デプロイ後・手元の端末で）

```bash
REAL=jibunkaigi-gemini-proxy.<subdomain>.workers.dev
SECRET=<DEV_TRACE_SECRET>

# ① 記録（例: サトウに「もう何も感じない」）
curl -sS -X POST "https://$REAL/api/jibunkaigi/reply" \
  -H "Content-Type: application/json" \
  -d "{\"userText\":\"もう何も感じない\",\"agentId\":\"satou\",\"modeId\":\"dialogue\",\"messages\":[],\"sessionId\":\"devtest\",\"devTrace\":true,\"devTraceKey\":\"$SECRET\"}"

# ② 最新トレースのプロンプトを取り出す
curl -sS "https://$REAL/api/jibunkaigi/dev-traces?key=$SECRET" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); t=d['traces'][0]; print('COUNT:',d['count']); print('=== PROMPT ==='); print(t['prompt']); print('=== REFLECTION ==='); print(json.dumps(t.get('reflection'),ensure_ascii=False,indent=2))"
```

- 正常なら `prompt` に「## いま自分の内側で立ち上がっているもの」＋強/中/弱、
  「## 内側の反応の補正について」が入る（tool層統合 #269）。
- `prompt` には合言葉が含まれないので、確認用に共有しても安全。
- `reflection` が `{error:...}` の時は Gemini モデル名（`GEMINI_MODEL`）か `GEMINI_API_KEY` を確認。

## トラブルシュート

- **405 / 空ボディ / CORSヘッダ無し**: そのURLは別Worker。`name` から決まる正しいURL
  （`jibunkaigi-gemini-proxy.<subdomain>.workers.dev`）か、`wrangler deploy` の表示URLを使う。
- **`{"error":"unauthorized"}`**: `key` と `DEV_TRACE_SECRET` が不一致。
- **`traces` が空 / `count:0`**: KV binding `DEV_TRACE_KV` が未設定か、まだ1件も記録していない。
  Settings → Bindings で `DEV_TRACE_KV` を確認。
- **本番ビルドで記録が走らない**: 正常。`EXPO_PUBLIC_DEV_TRACE*` を入れない＝完全停止（設計通り）。
