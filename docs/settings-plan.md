# じぶん会議 — 設定画面 (将来計画)

現時点では設定画面は実装していない。ただし以下の構造で将来導入できるよう、
あらかじめ設計だけ残しておく。

> 内省体験は「設定が多いアプリ」と相性が悪い。
> 設定はあくまで「使いづらさを取り除くための逃げ道」として置き、
> アプリ本体の体験を分割・希釈しないこと。

---

## 1. 想定する設定カテゴリ

### 1-1. 表示
- 表示テーマ
  - `standard` (現在の湖面トーン) — デフォルト
  - `quiet` (動きと装飾を最小限) — `prefers-reduced-motion` と独立に手動指定
  - `high-contrast` (`@media (prefers-contrast: more)` を強制)
- フォントサイズ (small / medium / large)

### 1-2. モーション
- `auto` — OS の `prefers-reduced-motion` に従う (デフォルト)
- `reduced` — 強制的に shimmer / aurora / float を止める

### 1-3. サウンド
- 効果音
  - `on` (デフォルト)
  - `off` — `services/sound.js` の `setSoundEnabled(false)` で
    `localStorage.jibunkaigi_sound_enabled = 'false'` を書き、以降完全に黙る
- 音量レベル (low / medium / high) — 当面は実装しなくてよい

### 1-4. オンボーディング
- 「Intro をもう一度見る」
  - `localStorage.jibunkaigi_intro_seen` を削除して再表示

### 1-5. プロフィール
- お名前の編集 (現在は UserNameDialog として既に存在)

### 1-6. 会議メンバー
- 「エージェントの説明を見る」 — 現在の BeliefsDialog に飛ばす

### 1-7. 開発者
- デバッグ表示 (本番では非表示)

---

## 2. 永続化キー (localStorage)

| キー                              | 値                          | 用途                          |
|-----------------------------------|-----------------------------|-------------------------------|
| `jibunkaigi_intro_seen`           | `'true'` / unset            | Intro を一度見たか            |
| `jibunkaigi_sound_enabled`        | `'true'` / `'false'`        | 効果音 ON/OFF                |
| `jibunkaigi_theme`                | `'standard'` / `'quiet'` …  | 表示テーマ (未実装)           |
| `jibunkaigi_motion`               | `'auto'` / `'reduced'`      | モーション設定 (未実装)       |
| `jibunkaigi:compareMode`          | (debug)                     | compare-mode (既存)           |
| `jibunkaigi:joeDebug` (定数)      | (debug)                     | Joe debug                     |
| `jibunkaigi:inspector` (定数)     | (debug)                     | Inspector                     |

---

## 3. 開く動線(将来)

- Sidebar の最下部に `Settings` リンクを追加
- または UserProfileButton から popover で開く
- モーダルは `dialogs/SettingsDialog.jsx` として独立させる

---

## 4. 実装上の注意

1. **設定はアプリ体験を希釈しない**。設定が多すぎると静謐さが消える。
2. **デフォルトのままで「ちゃんと良い」**こと。設定をいじらなくても十分。
3. **debug 系は絶対に一般ユーザーに見せない**。`isAgentDebugEnabled()`
   などの runtime ゲートを必ず噛ます。
4. **モーション設定は OS と二重制御にしない**。OS の `prefers-reduced-motion`
   が有効ならアプリ側設定にかかわらず動きを止める。
5. **音は最初から控えめ**。デフォルト ON でも気にならない音量。
   設定でもう一段下げられるよう将来追加してもよい。

---

## 5. 今回やらないこと

- 多言語切り替え (i18n) — 当面 ja-JP のみ
- アカウント切り替え (anonymous → Google 認証など)
- データエクスポート / インポート
- テーマカラーカスタマイズ
- エージェントの口調プリセット

これらは「内省アプリ」というアプリ性格に対して
ノイズが大きいので、ニーズが顕在化するまでは触らない。
