# Jibunkaigi Phase 2-4 — Firebase / Firestore Universal Adapter

## 目的

iOS / Android / Web の全プラットフォームで、同じセッション保存・一覧・切り替え・削除・過去会話復元を行うための共通保存基盤を作る。

今回も **Gemini 接続はしない**。AI応答は引き続き mock のまま。

---

## アーキテクチャ

```
UI (app/index.tsx)
  ↓
useUniversalConversation (state/useUniversalConversation.ts)
  ↓
UniversalSessionRepository interface (services/sessionRepository.ts)
  ↓
FirestoreSessionRepository        LocalSessionRepository
(services/firebase/               (services/sessionRepository.ts)
 firestoreSessionRepository.ts)
```

Firebase config が ENV に存在する場合は Firestore へ、存在しない場合はローカルインメモリ fallback で動く。アプリが落ちることなく両方対応できる。

---

## Firestore パス構造

既存の Vite Web 版と揃えた。

```
artifacts/{appId}/users/{uid}/sessions/{sessionId}
artifacts/{appId}/users/{uid}/sessions/{sessionId}/messages/{messageId}
```

- `appId` は `EXPO_PUBLIC_JIBUNKAIGI_APP_ID` から取得（デフォルト: `self-conf-v10-mobile-dev`）
- `uid` は Firebase 匿名認証の UID を使用

---

## 追加・更新したファイル

### apps/mobile

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `.env.example` | 新規 | Firebase config 変数の名前定義 |
| `package.json` | 更新 | `firebase ^10.14.0` 追加 |
| `services/firebase/mobileFirebaseConfig.ts` | 新規 | ENV から Firebase config を読み込む |
| `services/firebase/mobileFirebaseApp.ts` | 新規 | Firebase app 初期化 (config なしは null) |
| `services/firebase/mobileAuth.ts` | 新規 | 匿名ログイン / auth state 購読 |
| `services/firebase/firestoreSessionRepository.ts` | 新規 | Firestore 実装 |
| `services/sessionRepository.ts` | 新規 | Repository interface + local fallback |
| `state/useUniversalConversation.ts` | 更新 | マルチセッション対応・Repository 経由保存 |
| `components/session/MobileSessionDrawer.tsx` | 新規 | セッション一覧 / 切り替え / 削除ドロワー |
| `components/session/MobileSessionHeader.tsx` | 更新 | ドロワー開閉ボタンを追加 |
| `app/index.tsx` | 更新 | Drawer 統合・switchSession / deleteSession 接続 |

### packages/shared

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/sessionTypes.ts` | 新規 | UniversalMessageData / UniversalSessionData 型定義 |
| `src/index.ts` | 更新 | sessionTypes を再エクスポート |

### docs

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `universal-firestore-adapter.md` | 新規 | 本ドキュメント |
| `universal-feature-parity-checklist.md` | 更新 | セッション系を Adapter 完了に更新 |

---

## 環境変数セットアップ

`apps/mobile/.env.example` をコピーして `apps/mobile/.env` を作り、実値を入力する。

```bash
cp apps/mobile/.env.example apps/mobile/.env
# .env を編集して Firebase の実値を入力
```

**注意**: `.env` は `.gitignore` に入っているためコミットしない。Gemini API Key は **絶対に** ここに書かない。

---

## Firebase config を用意しない場合

ENV が空のままでもアプリは起動する。その場合は `LocalSessionRepository`（インメモリ）が使われ、アプリを再起動するとデータはリセットされる。

---

## 今回やらなかったこと（次フェーズ）

- Gemini Proxy 接続・本物の AI 応答
- Google / Apple Sign-In（現在は匿名ログインのみ）
- アカウント削除導線（App Store 申請前に必須）
- セッションタイトル編集 UI
- ピン留め UI
- Cloudflare Worker Gemini エンドポイント
- EAS Build / App Store 本番設定
- 旧 Vite Web 版の削除
