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

- **フロントエンド (Web)**: React 19 + Vite
- **フロントエンド (ストア版)**: Expo Universal (React Native + Expo Router)
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

## 開発オーケストレーション

じぶん会議の開発は、`docs/phases.yaml` で定義されたフェーズ単位で進めます。

### フェーズを回す手順

1. **Actions タブ → "Run Phase" ワークフロー → "Run workflow"** を開く
2. `phase` を選択して実行（現在: `phase-1`）
3. ワークフローが自動的に以下を行う:
   - `_verify.yml`（lint / build / test）を実行
   - レビュー用 Issue を自動作成
   - **Review Gate** で一時停止（人間の承認待ち）
4. 3人のレビュアー（Narrow / Wide Code / Wide User）が Issue のチェックリストを確認する
5. 問題なければ、GitHub Actions の **Review Gate 承認ボタン** を押す
6. `complete` ジョブが完了し、次のフェーズへ進む

### Issue テンプレート

| テンプレート | 用途 |
|---|---|
| `Phase Task` | フェーズのタスクを追跡する Issue |
| `Phase Review` | レビュー用 Issue（ワークフローが自動作成。手動作成も可） |

### レビュアーの役割

| レビュアー | 役割 |
|---|---|
| **Narrow Reviewer** | 今回の差分のみ確認。バグ・型エラー・ビルド・スコープ逸脱をチェック |
| **Wide Reviewer / Code** | コード全体の目線で設計・責務・じぶん会議らしさをチェック |
| **Wide Reviewer / User** | ユーザー目線で体験・安心感・戻ってこられる感じをチェック |

詳細は [`docs/review-rules.md`](docs/review-rules.md) を参照してください。

### 手動設定が必要な項目

ワークフローを使う前に、**リポジトリ管理者が以下を手動で設定**してください。

#### 1. GitHub Environment の作成

`Settings → Environments → New environment` で `phase-review` を作成し、  
**Required reviewers** に承認者（Narrow Reviewer 担当者など）を追加します。  
これにより Review Gate で自動停止し、承認が必要になります。

#### 2. Labels の作成

`Issues → Labels → New label` で以下の2つを作成します:

| Label | 用途 |
|---|---|
| `phase-review` | レビュー Issue に付与される |
| `phase-task` | タスク Issue に付与される |

#### 3. Actions の権限設定

`Settings → Actions → General → Workflow permissions` で  
**"Read and write permissions"** を有効にしてください。  
（レビュー Issue の自動作成に `issues: write` が必要です）
