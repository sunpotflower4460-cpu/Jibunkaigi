# じぶん会議 — Release Checklist

公開前(PWA / Web 公開 / 将来的な App Store 配信)に必ず確認する項目を一覧にする。
このリストは「機械的に通せばOK」ではなく、「世界観・操作感・公開品質の最後の砦」として使う。

---

## 1. ビルド & 品質チェック

- [ ] `npm install` がクリーンに通る
- [ ] `npm run lint` が **エラー0 / 警告0** で通る
- [ ] `npm test` がすべてパス(現在 780 / 780 / 57 suites)
- [ ] `npm run build` が通る
- [ ] CSS / JS のサイズが極端に増えていない
  - 目安: CSS < 100 kB / JS < 1.5 MB (gzip 後 < 400 kB)
- [ ] チャンクサイズ警告が想定外でない
- [ ] dev console に未解決の error / warning が出ていない

## 2. 環境変数(必須)

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_GEMINI_API_KEY`

未設定でも UI が「設定が整うと、ここから会議を始められます」で
ユーザーに優しく失敗することを確認すること。

## 3. Firebase / Firestore

- [ ] Firestore セキュリティルールが本番想定になっている
- [ ] 認証 (anonymous / custom-token) が想定通り動く
- [ ] `artifacts/{appId}/users/{uid}/sessions/...` のパスで読み書きできる
- [ ] 別ユーザーのデータが読めない
- [ ] セッション削除でメッセージサブコレクションもクリアされる

## 4. Gemini API

- [ ] `gemini-2.5-flash` (本応答) / `gemini-2.5-flash-lite` (リアクション) の両方が応答する
- [ ] タイムアウト (25s) で UI が固まらず、優しいエラーが出る
- [ ] レート制限 (429) でリトライが効く
- [ ] JSON モード / Schema レスポンスが想定どおり返る

## 5. UI / UX (世界観)

- [ ] アプリ名「じぶん会議」が表示される
- [ ] 「導かない。照らすだけ。歩くのは、あなた自身。」が初回画面に出る
- [ ] 5 つの視点(レイ / ジョー / ケン / ミナ / サトウ)が呼べる
- [ ] 心の鏡 (master) が呼べる
- [ ] 委ねる (ランダムエージェント) が動く
- [ ] OTHERS リアクションが表示される
- [ ] 一閃 / 対話 / 深淵 の3モードが切り替わる
- [ ] セッションのピン留め / タイトル編集 / 削除が動く

## 6. Mobile (390px / 430px 重点)

- [ ] iPhone 12 / 13 / 14 / 15 相当 (390〜393px) で破綻しない
- [ ] iPhone Plus / Pro Max (430px) で破綻しない
- [ ] 入力欄がキーボードや FloatingAgentBar に隠れない
- [ ] iOS のホームインジケータと重ならない
- [ ] ノッチと重ならない (safe-area-inset)
- [ ] 全タップ領域が 44 × 44 px 以上
- [ ] 横スクロールが momentum スクロールで気持ちよい
- [ ] モーダル(IntroOverlay / UserName / DeleteSession / Beliefs)が下端まで届かない

## 7. アクセシビリティ

- [ ] 主要ボタンに `aria-label`
- [ ] アイコンのみのボタンに `title`
- [ ] Dialog に `role="dialog"` / `aria-modal="true"`
- [ ] Dialog で Escape が閉じる
- [ ] Dialog open 時の autofocus
- [ ] focus-visible で indigo の ring が出る
- [ ] `prefers-reduced-motion` で shimmer / aurora / float が止まる
- [ ] `prefers-contrast: more` でコントラストが上がる
- [ ] アクティブセッションに `aria-current="page"`
- [ ] 選択中モードに `aria-pressed="true"`
- [ ] 生成中表示が `role="status"` / `aria-live="polite"`
- [ ] 色だけに依存していない (ピン留め・アクティブ・stance pill)
- [ ] WCAG AA 相当のコントラスト比

## 8. セキュリティ / プライバシー

- [ ] API キーがクライアントにベタ書きでない (環境変数経由)
- [ ] Firestore ルールでユーザー隔離
- [ ] LocalStorage に PII を保存していない
- [ ] エラーメッセージにスタックトレースを出さない
- [ ] プライバシーポリシー / 利用規約のリンク (公開時必要なら)

## 9. SEO / OGP / PWA

- [ ] `<title>` が「じぶん会議 — 5つの視点で、じぶんに潜る」
- [ ] `<meta name="description">` 設定済み
- [ ] `<meta name="theme-color">` 設定済み
- [ ] `<meta name="viewport">` が `viewport-fit=cover`
- [ ] `og:title` / `og:description` / `og:type` / `og:locale`
- [ ] **TODO**: `og:image` (1200×630 png)
- [ ] **TODO**: `apple-touch-icon` (180×180 png)
- [ ] **TODO**: `manifest.webmanifest` (PWA)
- [ ] noscript フォールバック表示

## 10. パフォーマンス

- [ ] Lighthouse Mobile 80+
- [ ] 初回描画 (FCP) < 2.5s (4G)
- [ ] 重たいデバイス(古い Android)でも shimmer が引っかからない
- [ ] backdrop-filter が大量に重なっていない
- [ ] 不要な re-render が頻発していない

## 11. 公開素材

- [ ] App Store / Play Store 用スクリーンショット (公開時)
- [ ] PWA インストール時のアイコン (192 / 512 / maskable)
- [ ] ストア掲載文 (App Store description)
- [ ] サポート連絡先 / プライバシーポリシー URL

## 12. オンボーディング / エラー状態

- [ ] IntroOverlay が初回のみ出る
- [ ] 2 回目以降は出ない (localStorage `jibunkaigi_intro_seen`)
- [ ] 設定不足時の警告が冷たくない
- [ ] AI 応答エラー時に優しいコピー
- [ ] ネットワーク切断時にユーザーが迷子にならない

## 13. デバッグ機能の非露出

- [ ] 本番 UI に SurfaceDebug / JoeDebug / Inspector / AgentGateDebug が出ない
- [ ] debug 用の `Alt+J` / `Alt+I` ショートカットが意図せず動かない
- [ ] compare-mode が一般ユーザーには見えない
