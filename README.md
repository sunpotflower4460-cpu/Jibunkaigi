# じぶん会議 (Jibunkaigi)

自分の内なる声と向き合うための、AI対話型自己内省アプリです。

## 概要

**じぶん会議**は、言葉にならない気持ちや迷い、心の中にある問いを、5人の個性的なAIエージェントと対話しながら深めていくウェブアプリです。Google Gemini APIを使ったAIが、それぞれ異なる視点であなたの思考をサポートします。

## 機能

- **5人のAIエージェント**との対話（それぞれ異なる個性・役割）
- **3つの応答モード**（一閃 / 対話 / 深淵）で深さを調整
- エージェントの**リアクション表示**（他のエージェントの本音が見える）
- **心の鏡**による会話の総括
- Firebase連携による**セッション管理**（過去の問いを保存・閲覧）
- ピン留め・タイトル編集などのセッション整理機能

## AIエージェント

| 名前 | 役割 | 特徴 |
|------|------|------|
| レイ | 魂の託宣 | 穏やかで内省を促す。気づいていない気持ちをそっと言語化する |
| ジョー | 魂の発火点 | 熱量があって前向き。背中を押し、具体的な一歩を提案する |
| ケン | 人生の設計 | 論理的で冷静。思考を構造化し、選択肢を明確にする |
| ミナ | 無償の愛 | 温かく受け入れる。感情をそのまま受け取り「聴くこと」を優先する |
| サトウ | 不器用な守護 | 率直でぶっきらぼう。見て見ぬふりをしているリスクや矛盾を指摘する |

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
