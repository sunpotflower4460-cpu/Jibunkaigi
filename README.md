# じぶん会議 (Jibunkaigi)

複数の内的傾向が、その場に応じて結び直され、一時的に言葉として結晶化する体験を扱うウェブアプリです。

## 概要

**じぶん会議**は、言葉にならない気持ちや迷い、心の中にある問いを、複数の内的傾向と向き合いながら深めていくウェブアプリです。

じぶん会議は、単なる「複数AIが話すアプリ」を目指しません。  
エージェントは固定した人格というより、自分の内側にある傾向——受け止めたい、守りたい、揺らしたい、構造化したい、照らしたい——の、その場ごとの表れです。

会議の最後に登場する**心の鏡**は、会話の要約ではなく、全体のバランスや場の重力、まだ言い切れていない問いを映す役割を担います。

じぶん会議が目指しているのは、外から正解を与えることではありません。  
「あぁ、そうだった。自分の中にはこれがあった」という気づきに近づく体験を目指しています。

## 機能

- **5つの視点**との対話（内側の異なる傾向が、それぞれの角度から言葉として現れる）
- **3つの応答モード**（一閃 / 対話 / 深淵）で深さを調整
- エージェントの**リアクション表示**（他の視点の本音が見える）
- **心の鏡**による場の重力の照射（未解決点や全体のバランスを映す）
- Firebase連携による**セッション管理**（過去の問いを保存・閲覧）
- ピン留め・タイトル編集などのセッション整理機能

## AIエージェント

各エージェントは固定人格というより、内側の異なる傾向を表す存在として位置づけています。

| 名前 | 傾向 | 特徴 |
|------|------|------|
| レイ | 静かな照射 | 穏やかで内省を促す。気づいていない気持ちをそっと言語化する |
| ジョー | 明るい焦点化 | 熱量があって前向き。相手の中のまだ死んでいないものに焦点を当てる |
| ケン | 構造化と見通し | 論理的で冷静。思考を構造化し、選択肢を明確にする |
| ミナ | 受容と緩め | 温かく受け入れる。感情をそのまま受け取り「聴くこと」を優先する |
| サトウ | 防衛と現実保護 | 率直でぶっきらぼう。見て見ぬふりをしているリスクや矛盾を指摘する |

## 設計思想・ドキュメント

じぶん会議が「何を目指しているか」をさらに深く知りたい方は以下をご覧ください。

- [設計コンパス](docs/jibunkaigi-compass.md) — じぶん会議の軸と、設計判断の基準
- [ロードマップ](docs/jibunkaigi-roadmap.md) — 内的力学を実現するための実装計画
- [共通内部OS](docs/internal-os.md) — エージェントが言葉を発する前に通る、共通の力学の設計

## 技術スタック

- **フロントエンド**: React 19 + Vite
- **スタイリング**: Tailwind CSS v4
- **バックエンド / 認証**: Firebase (Authentication + Firestore)
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **アイコン**: Lucide React

## セットアップ

### 必要な環境変数

`.env` ファイルを作成し、以下の変数を設定してください。

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### インストールと起動

```bash
npm install
npm run dev
```

### ビルド

```bash
npm run build
```

## 開発

```bash
# 開発サーバー起動
npm run dev

# Lint
npm run lint

# プロダクションビルド
npm run build

# ビルドのプレビュー
npm run preview
```

---

## 開発オーケストレーション

`docs/phases.yaml` と `docs/review-rules.md` を正本として、Phase 単位で開発を進める最小オーケストレーション基盤を追加しています。

### 追加ファイル

| ファイル | 役割 |
|---|---|
| `.github/workflows/run-phase.yml` | Phase を手動実行するメインワークフロー |
| `.github/workflows/_verify.yml` | lint / build / test を実行する再利用可能ワークフロー |
| `.github/ISSUE_TEMPLATE/phase-task.yml` | Phase タスク Issue テンプレート |
| `.github/ISSUE_TEMPLATE/phase-review.yml` | Phase レビュー Issue テンプレート（Gate output 形式） |

### Phase の回し方

1. **GitHub Actions → "Run Phase" → Run workflow** を開く
2. `phase` を選択して実行（現在は `phase-1` のみ）
3. ワークフローが自動的に以下を行う:
   - `_verify.yml` で lint / build / test を実行
   - 完了後、Wide Reviewer / Code と Wide Reviewer / User の2つの Issue を自動作成
   - `review-gate` ジョブで一時停止（手動承認待ち）
4. 2つのレビュー Issue を記入・close したら、`review-gate` を承認してフローを完了する

### Review Gate の構造

```
verify → create-review-issues → review-gate (手動承認)
                                    ↑
              Wide Review/Code Issue & Wide Review/User Issue
```

各 Gate output には `review-rules.md` に定義された5項目を記入します:  
1. 今回やったこと / 2. 何が良くなったか / 3. 残っている問題 / 4. 次 Phase へ進んでよいか / 5. 確認が必要な点

### 次に手動でやる設定

| 設定 | 手順 |
|---|---|
| **`phase-review` Environment の作成** | Repository Settings → Environments → New environment → `phase-review` を作成し、Required reviewers にオーナーを追加する。これにより review-gate ジョブが手動承認待ちになる |
| **Issue ラベルの作成** | `review`、`wide-review-code`、`wide-review-user`、`task` の4ラベルを作成する（ないと自動作成 Issue にラベルが付かない）|

### Assumptions

- `npm run build` が Vite 経由で JSX の型チェックを兼ねる想定（独立した `tsc` スクリプトなし）
- `npm test` は `package.json` の `test` スクリプトを使用
- Wide Reviewer / User のレビューは人間が行うことを前提とし、自動化しない
- `phase-review` Environment を設定しない場合、review-gate は承認なしで通過する
