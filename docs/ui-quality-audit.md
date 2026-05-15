# じぶん会議 — UI Quality Audit シート

「迷わないか / 美しいか / 読みやすいか / 押しやすいか / 世界観が崩れていないか」
を、画面 × 幅 のマトリクスで確認するためのチェックシート。

各セルで以下を 5 段階で記す:
- ⭕️ 問題なし
- 🟡 微修正したい
- 🔴 直す

---

## 確認する画面

| ID  | 画面                                | 主担当コンポーネント                          |
|-----|-------------------------------------|----------------------------------------------|
| S01 | 初回 (IntroOverlay)                | `dialogs/IntroOverlay`                      |
| S02 | 空状態 (セッション直後)            | `chat/EmptyState`                           |
| S03 | 入力中 (Composer focus)            | `composer/Composer`                         |
| S04 | 送信直後                            | App.jsx + `chat/ChatTimeline`               |
| S05 | エージェント選択 UI                | `composer/AgentControlBar`                  |
| S06 | AI 思考中                          | `chat/ThinkingIndicator`                    |
| S07 | AI 応答後                          | `chat/MessageBubble`                        |
| S08 | OTHERS 表示                        | `chat/OthersPanel`                          |
| S09 | 心の鏡 (master 応答)               | `chat/MessageBubble` + mirror-chip          |
| S10 | セッション一覧 (Sidebar)           | `sidebar/Sidebar` + `sidebar/SessionList`   |
| S11 | 名前変更                           | `dialogs/UserNameDialog`                    |
| S12 | 会議メンバーの魂                    | `dialogs/BeliefsDialog`                     |
| S13 | セッション削除                      | `dialogs/DeleteSessionDialog`               |
| S14 | 設定不足 (warning)                  | App.jsx config issue banner                 |
| S15 | エラー (rose toast)                | App.jsx errorMessage banner                 |
| S16 | デバッグ OFF (本番)                | App.jsx                                     |
| S17 | デバッグ ON                        | Surface/Joe/Inspector/Compare debug panels  |
| S18 | FloatingAgentBar 折りたたみ        | `FloatingAgentBar`                          |
| S19 | FloatingAgentBar 展開              | `FloatingAgentBar`                          |
| S20 | 心の鏡への誘い (mirror invite)     | `chat/ChatTimeline` mirror-invite           |

---

## 確認する幅

| 幅    | 想定端末                          | 重視点                                     |
|-------|-----------------------------------|--------------------------------------------|
| 360   | 小型 Android                      | 詰まりすぎ・横スクロール暴発              |
| 390   | iPhone 12-15                      | **最優先**。safe-area, キーボード         |
| 430   | iPhone Plus / Pro Max             | 横余白・タイポの密度                       |
| 768   | iPad portrait / 大型スマホ        | sidebar の挙動境界                         |
| 1024  | iPad landscape / 小型ラップトップ | 二段組 (sidebar 固定) の見え方             |
| 1440  | デスクトップ                       | 中央コンテンツの最大幅                     |

---

## チェック項目 (画面 × 幅 ごと)

各セルで以下を順に確認:

### 操作性
- [ ] 迷わないか
- [ ] タップ領域が 44px 以上か
- [ ] 横スクロールが意図しないところで起きていないか
- [ ] スクロールで重要な要素が隠れないか
- [ ] FloatingAgentBar が本文を邪魔していないか

### 読みやすさ
- [ ] 文字が小さすぎないか (本文 12px 以上)
- [ ] 行間が窮屈でないか (`jk-prose` 適用)
- [ ] 行長が長すぎないか (`--jk-content-max: 720px`)
- [ ] コントラストが薄すぎないか
- [ ] 主要な情報が一目で分かるか

### 美しさ・世界観
- [ ] 「導かない。照らすだけ。」のトーンが崩れていないか
- [ ] shimmer / aurora が控えめか
- [ ] 影が過剰でないか
- [ ] 角丸が階層に合っているか
- [ ] グラデーションが派手すぎないか

### 状態の正しさ
- [ ] エラー時に冷たくないか
- [ ] 空状態に「促し」があるか
- [ ] ローディングで「いま何が起きているか」が分かるか
- [ ] disabled の理由が(必要なら)伝わるか

### アクセシビリティ
- [ ] focus-visible で ring が出るか
- [ ] reduced-motion で動きが止まるか
- [ ] スクリーンリーダーで構造が伝わるか
- [ ] 色だけに依存していないか

---

## 直近の確認結果 (2026-05-15 時点)

> 自動テスト + lint + build はクリーン。
> 実機目視は次回 QA で記入する。

| 画面 \\ 幅 | 360 | 390 | 430 | 768 | 1024 | 1440 |
|-----------|-----|-----|-----|-----|------|------|
| S01 Intro |  -  |  -  |  -  |  -  |  -   |  -   |
| S02 Empty |  -  |  -  |  -  |  -  |  -   |  -   |
| S03 Composer focus |  -  |  -  |  -  |  -  |  -   |  -   |
| S07 AI 応答 |  -  |  -  |  -  |  -  |  -   |  -   |
| S10 Sidebar |  -  |  -  |  -  |  -  |  -   |  -   |
| S18 Floating 折りたたみ |  -  |  -  |  -  |  -  |  -   |  -   |
| S19 Floating 展開 |  -  |  -  |  -  |  -  |  -   |  -   |

(完了したらここを ⭕️ / 🟡 / 🔴 で塗り、🔴 は別 issue を起こす)

---

## メモ

- 古い Android で `backdrop-filter` を多用しすぎるとカクつく。
  本気で軽量化が必要になったら、`.glass-card` / `.message-agent` の
  `backdrop-filter` を条件付きで外す。
- `prefers-reduced-motion` は十分に効くが、`pointer-events` までは
  止めていないので、必要なら別途検討。
