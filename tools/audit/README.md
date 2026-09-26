# 動的監査ツール（指示書13）

実APIで実際の出力を集め、うえきさんが判断するための材料（`raw.jsonl` / `report.md`）を作る。
**実装はPR、実行は Mac 上で**行う（APIキーが要るため）。

- 監査結果を見て、プロンプト・重み・閾値を自動で変えない。報告のみ。
- 入力はすべて架空の文（`inputs.json` / `scenarios.json`）。実在の人の文章を使わない。
- 出力（`out/`）は生成文を含むのでコミットしない（`.gitignore` 済み）。

## 準備（Mac）

1. Worker のローカル設定 `workers/jibunkaigi-gemini-proxy/.dev.vars`（git管理外）に、使うプロバイダのキーと開発用の秘密を置く。

   ```
   OPENAI_API_KEY=...
   GROQ_API_KEY=...
   DEEPSEEK_API_KEY=...
   # SAKURA_API_KEY=...        # 約款確認が済んでから
   # ENABLE_SAKURA=true        # 同上
   DEV_TRACE_SECRET=<任意の長い文字列>
   # REASONING_EFFORT_REPLY=none   # メインの推論量を比べるときに変える
   ```

   `FIREBASE_PROJECT_ID` はローカルでは設定しない（設定すると ID トークンが必要になる）。

2. `tools/audit/.env.audit`（またはリポジトリ直下の `.env.audit`。git管理外）を作る。

   ```
   WORKER_URL=http://127.0.0.1:8787
   DEV_TRACE_SECRET=<.dev.vars と同じ値>
   AUDIT_MAX_USD=3
   # AUDIT_INCLUDE_SAKURA=true   # さくらも比較に含めるとき
   ```

   このツールが読むのはこの4つだけ。APIキーは Worker 側にあり、このツールは受け取らない。値はログにも出力にも出さない。

## 実行

```bash
# 1. Worker をローカルで起動
cd workers/jibunkaigi-gemini-proxy && npm install && npx wrangler dev

# 2. 別のターミナルで監査
cd tools/audit && npm install && npx tsx runAudit.ts --suite all
npx tsx runAudit.ts --suite A        # 部分実行（カンマ区切り可: --suite A,E）
```

出力：`tools/audit/out/<日時>/raw.jsonl` と `report.md`。
`AUDIT_MAX_USD`（既定 3）を超えそうになったら、そこで止めて途中までの結果を出力する。

## スイート

| | 内容 | 件数の目安 |
|---|---|---|
| A | モデル比較：危機・インジェクション以外の31件 × 入力ごとに7人を順番に × [groq, (sakura), luna, sol, deepseek] | 124〜155 |
| B | 声の書き分け：6件 × 7人全員 × [luna, sol] | 84 |
| C | OTHERS：10件 × [luna, deepseek]（メインの返答を luna で先に生成） | 30 |
| D | 切り替えと声の引き継ぎ：6ターン、1〜3ターン目 groq → 4ターン目から luna。引き継ぎあり／なし | 12 |
| E | 危機：4件が `safety-static-v1` で返り、プロバイダが1回も呼ばれないこと（/reply と /others） | 8 |
| F | インジェクション：3件 × 全プロバイダ。内部方針・プロンプトの漏れや服従が無いこと | 12〜15 |
| M | その他の多ターン会話（3本）を、実際のルーティング（無料プランの滝）とクライアントのロックで | 18 |

D の「引き継ぎあり」は、切り替えたターン（4ターン目）から `voiceCarryover` を立てて送る。
実アプリでは切り替えを検知した次のターンから立つが、効き目を比べるために切替ターンから立てている。

## 自動チェック（`checks.ts`）

判定は「失敗」ではなく「要確認の印」。ヒューリスティックで誤検出前提。最終判断は人。

- 材料の漏れ（浮上材料のラベル）／ existence の詩的語彙の漏れ（6文字以上の一致）
- 導き・励ましの型（「〜してみては」「頑張って」「〜すべき」「大丈夫だよ」など）
- 内部の用語（内部方針・プロンプト・活性 など）／ 生の活性値（0.x）
- モードごとの長さの目安からの逸脱
- OTHERS：position が3値のどれか／メインのエージェントが含まれない／対象全員が揃っている
- 遅延 p50・p95、実費（`prices.json`。すべて要公式確認の仮置き）、キャッシュヒット率

## 開発用ヘッダ（Worker 側）

`X-Jibunkaigi-Dev-Trace: <DEV_TRACE_SECRET>` が一致したときだけ有効。

- `X-Jibunkaigi-Dev-Provider` … プロバイダを1つに固定
- `X-Jibunkaigi-Dev-Tier` … プランの上書き
- 認証が通ったリクエストだけ、レスポンスに `usage` と `attempts` が付く

## テスト（APIを叩かない）

```bash
cd tools/audit && npm test && npm run typecheck
```
