# Jibunkaigi Phase RS-0: Reflection Shelf 移植方針の設計固定

## 1. 背景

- Jibunkaigi は本命アプリであり、まず App Store 提出を成立させ、その後 Web、Android へ展開していく前提のプロダクトである。
- 一方で Jibunkaigi-hajimenovan は簡易版の試作だが、会話のあとに「自分へ戻る」ための機能群が育っている。
- 今回はその良い部分を Jibunkaigi 本体へ移植するための方針を固定する。
- ただし移植先は会話エンジン内部ではない。会話タイムライン、エージェント応答、心の鏡を壊さないため、折りたたみ式の外部メモ棚として **Reflection Shelf / 潜る棚** を置く。
- Reflection Shelf は会話中に強制表示する機能ではなく、ユーザーが必要なときだけ開く「外側の道具」として扱う。

### 構造イメージ

```text
Jibunkaigi 本体
- 会話タイムライン
- エージェント応答
- 心の鏡
- 折りたたみ式 Reflection Shelf / 潜る棚
  - どう思う？付箋
  - 会議録
  - 言葉の水面
  - 自分の輪郭
  - 設定 / 保存状態
```

## 2. 移植対象機能一覧

| 項目 | 目的 | hajimenovan 側の該当ファイル | Jibunkaigi 側での想定配置 | 優先度 | App Store 初回版 |
|---|---|---|---|---|---|
| Reflection Shelf / 潜る棚 | 会話本体の外側に、見返し・保存・内省の入口をまとめる | `src/components/DiveToolsDock.tsx`<br>`src/components/DiveDialogGuard.tsx`<br>`src/utils/diveTools.ts` | `apps/mobile/components/reflection/ReflectionShelfSheet.tsx`<br>`apps/mobile/components/reflection/ReflectionShelfTrigger.tsx`<br>`apps/mobile/app/index.tsx` に入口だけ追加 | P1 | 入れる |
| どう思う？付箋 | AIの答えではなく、ユーザー自身の反応を短く残す | `src/components/StickyNotesPanel.tsx`<br>`src/services/stickyNoteStore.ts`<br>`src/utils/selfReturn.ts` | `apps/mobile/components/reflection/StickyNotesSheet.tsx`<br>`apps/mobile/state/useReflectionShelf.ts`<br>`apps/mobile/services/reflectionShelfRepository.ts` | P1 | 入れる |
| 会議録 | 1セッションの要点・残った言葉・戻る問いをまとめる | `src/components/ConferenceRecordPanel.tsx`<br>`src/services/conferenceRecord.ts`<br>`src/services/conferenceRecordStore.ts` | `apps/mobile/components/reflection/ConferenceRecordSheet.tsx`<br>`apps/mobile/services/reflectionShelfRepository.ts`<br>`apps/mobile/state/useReflectionShelf.ts` | P1 | 入れる |
| 言葉の水面 | 会話と会議録から浮く語を軽く見返す | `src/components/FloatingKeywordsPanel.tsx`<br>`src/services/keywordField.ts` | `apps/mobile/components/reflection/FloatingKeywordsSheet.tsx`<br>`packages/shared/src/reflection/keywordField.ts` を将来候補 | P2 | 後回し |
| 自分の輪郭 | 付箋・会議録・会話からテーマの輪郭を後から見返す | `src/components/ThemeArchivePanel.tsx`<br>`src/services/themeArchive.ts` | `apps/mobile/components/reflection/ThemeArchiveSheet.tsx`<br>`packages/shared/src/reflection/themeArchive.ts` を将来候補 | P2 | 後回し |
| selfReturn 導線 | 「この結果を見て、私はどう思う？」へ自然に戻す | `src/utils/selfReturn.ts`<br>`src/components/ConferenceRecordPanel.tsx`<br>`src/components/StickyNotesPanel.tsx` | `apps/mobile/state/useReflectionShelf.ts` でイベントではなく明示的 action 化<br>`apps/mobile/components/chat/*` や Reflection Shelf 内から起動 | P1 | 入れる |
| 保存状態表示 | 端末内保存 / クラウド保存 / 同期中などを分かりやすく見せる | `src/components/CloudSaveStatusBadge.tsx`<br>`src/components/SettingsPanel.tsx` | 既存 `apps/mobile/components/status/MobileStatusStrip.tsx` を主表示にしつつ、必要に応じて `apps/mobile/components/reflection/ReflectionShelfStatusCard.tsx` を追加 | P0 | 入れる |
| 設定 / データ削除導線 | 保存場所の説明と、端末内 / クラウド削除導線を分けて提供する | `src/components/SettingsPanel.tsx` | 既存 `apps/mobile/components/session/MobileSessionDrawer.tsx` または将来の `apps/mobile/components/reflection/ReflectionShelfSettingsSheet.tsx` に疎結合で配置 | P0 | 入れる |
| legal / privacy / non-medical notice | App Store 向けに非医療・非診断・プライバシーの前提を明確化する | `src/data/legal.ts`<br>`src/components/IntroLegalSoftener.tsx`<br>`src/components/SettingsPanel.tsx` | `apps/mobile/components/intro/*`、`apps/mobile/components/status/*`、設定導線、ストア説明文の元データとして整理 | P0 | 入れる |
| optional: イルカ演出、鏡アトモスフィア | 世界観の余韻を補強する演出要素 | `src/components/DolphinTitleMark.tsx`<br>`src/components/TitleDolphinPresence.tsx`<br>`src/components/MirrorAtmosphere.tsx` | `apps/mobile/components/layout/*` や `apps/mobile/theme/*` の polish として別管理 | P3 | 後回し |

## 3. 優先順位

### P0

- legal / privacy / non-medical notice
- 保存状態表示
- 端末内データ削除 / クラウド保存説明

### P1

- Reflection Shelf / 潜る棚
- どう思う？付箋
- 会議録

### P2

- 言葉の水面
- 自分の輪郭

### P3

- イルカ演出
- 鏡アトモスフィア
- その他の雰囲気調整

### 初回 App Store 版の推奨範囲

- **入れる:** P0 と P1
- **後回し:** P2 と P3
- 理由は、初回版では「壊れないこと」「保存状態が明確であること」「会話後に自分へ戻る最短導線」を優先するため。

## 4. 移植時の技術方針

- Jibunkaigi 本体は Expo / React Native 系、hajimenovan は Vite + React Web SPA であるため、Web 実装をそのまま持ち込まない。
- `Web DOM` / `Tailwind` / `fixed position` / `window.dispatchEvent` はそのまま使わない。
- UI は React Native の `View` / `Pressable` / `Modal` / BottomSheet 相当へ置き換える。
- `lucide-react` は `lucide-react-native` 相当へ置き換える。
- `localStorage` 直叩きは使わず、Jibunkaigi 側の保存基盤に合わせる。
- 純粋ロジックはできるだけ共通化し、UI 依存の薄い集計・整形処理は `packages/shared` へ逃がせる形で考える。
- Reflection Shelf は会話本体と疎結合にする。会話フックへ機能を直接混ぜ込まず、専用 state / repository / adapter を介す。
- 会話データを読む場合は adapter を用意し、Firestore / local fallback の違いを吸収する。
- 初回は見た目の豪華さより、壊れないこと・保存が明確なことを優先する。

### 技術変換メモ

- `src/utils/diveTools.ts` のイベント駆動は、React Native 側では明示的な state 管理へ置き換える。
- `src/utils/selfReturn.ts` の `window.dispatchEvent` ベース導線は、`useReflectionShelf` の action 経由へ変換する。
- `src/services/stickyNoteStore.ts` / `conferenceRecordStore.ts` の `localStorage` 保存は、既存 `sessionRepository` と同思想の保存 adapter に置き換える。
- `src/components/*Panel.tsx` の fixed overlay は、モーダル / シート構成へ分解して持ち込む。

## 5. データモデル方針

このフェーズでは型ファイルを変更しない。以下は Jibunkaigi 側へ将来追加する **設計案** として扱う。

| 型名 | 役割 | 設計メモ |
|---|---|---|
| `ReflectionNote` / `StickyNote` | ユーザー自身の反応メモ | 対象 session / note kind / content / timestamps を持つ。AI応答の保存ではなく、ユーザー反応を主語にする。 |
| `ConferenceRecord` | 1会話をあとで見返すための記録 | title / topic / keywords / mirror summary / self line / return question を保持する。 |
| `ReflectionKeyword` | 言葉の水面用の語データ | text / score / source / updatedAt 程度の軽量集計に留める。描画座標は永続化必須ではない。 |
| `ThemeStat` | 自分の輪郭用のテーマ統計 | keyword / score / recordCount / noteCount / messageCount / lastSeenAt を持つ集計型を想定する。 |
| `ReflectionShelfState` | Shelf UI の開閉・選択タブ・導線状態 | 現在開いている棚、selfReturn seed、loading/error を持つ UI state とする。 |

### モデル分離方針

- 会話の message schema を直接汚さない。
- Reflection Shelf 用データは会話ログの派生物、またはユーザー追記データとして分離する。
- 会話本体から読む情報は read-only adapter 経由に限定し、保存責務を混線させない。

## 6. UX方針

- Reflection Shelf は常時主張しない。
- 会話中は邪魔しない。
- 会話後に「残す」「見返す」「自分に問い返す」ための場所にする。
- AIの答えを保存するだけではなく、ユーザー自身の反応を残す。
- 「導く」より「照らす」。
- 「AIに依存させる」より「自分の輪郭を取り戻す」。
- 初回 App Store 版では、軽く・分かりやすく・壊れにくくする。

### UI配置方針

- 常時露出する独立ドックにはしない。
- まずは会話画面の外周にある小さな入口、またはセッション周辺導線から開く構成にする。
- 会話タイムラインを押し下げる常設パネル化は避ける。
- selfReturn は通知的に押しつけず、会議録や付箋作成時の自然な次の一手として置く。

## 7. 実装フェーズ案

- **RS-0:** この設計書作成
- **RS-1:** legal / privacy / non-medical notice / 保存状態の棚卸し
- **RS-2:** Reflection Shelf の空の入口を追加
- **RS-3:** どう思う？付箋を追加
- **RS-4:** 会議録を追加
- **RS-5:** 言葉の水面を追加
- **RS-6:** 自分の輪郭を追加
- **RS-7:** UI polish / App Store QA

### フェーズごとの完了イメージ

- RS-1 では App Store 申請に必要な説明責務を先に安定化する。
- RS-2 では中身より先に、会話を壊さない入口位置と折りたたみ挙動を確定する。
- RS-3 / RS-4 で「会話後に自分へ戻る」最低限の価値を成立させる。
- RS-5 / RS-6 は振り返りの深度を増やす拡張フェーズとする。
- RS-7 は演出よりも QA と申請品質を優先する。

## 8. このフェーズで変更してはいけないこと

以下は RS-0 では禁止とする。

- 実装コードの変更
- 既存画面のUI変更
- Firebase / Firestore / Gemini 接続の変更
- `package.json` の依存追加
- 既存の保存ロジック変更
- App Store 用の最終文言確定
- hajimenovan のコードの直接コピペ

## RS-1 へ渡す固定事項

- Reflection Shelf は会話エンジン内部ではなく、外側の折りたたみ棚として扱う。
- 初回 App Store 版は P0 + P1 を対象範囲とする。
- 保存状態表示、削除導線、legal / privacy / non-medical notice を先に整える。
- セッション削除は「1会話のみ」、端末内全削除は「この端末の一時データ」、クラウド全削除は「危険操作として別確認」に分ける。
- 将来の Reflection Shelf では、付箋・会議録のようなユーザー追記データを削除対象へ含め、再計算できる表示はキャッシュ削除で扱える形を優先する。
- Web 実装のイベント駆動・DOM 依存・`localStorage` 依存は移植しない。
- 型追加や保存実装は RS-1 以降の実装フェーズで行う。
