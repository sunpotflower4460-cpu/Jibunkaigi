# Universal Member Explanation

## 概要

Expo Universal版に会議メンバーの説明 / Beliefs Sheet相当を追加した。  
ユーザーが各メンバーの存在意図・見るもの・避けるもの・声の温度を確認できる。

## 導線

```
MobileSessionHeader
  └── 「メンバー」ボタン
        └── MobileMemberSheet（Modal / Bottom Sheet）
              └── MobileMemberCard × 7（アコーディオン展開）
```

## 追加したファイル

### shared

| ファイル | 内容 |
|---|---|
| `packages/shared/src/members/memberDisplayTypes.ts` | `MemberDisplayProfile` インターフェース |
| `packages/shared/src/members/memberDisplayProfiles.ts` | `MEMBER_DISPLAY_PROFILES` 配列、`getMemberDisplayProfile` 関数 |

`MemberDisplayProfile` は `UNIVERSAL_AGENTS` と `AGENT_PROMPT_PROFILES` を元にビルドされ、  
表示専用フィールド（`oneLine`, `userFacingHint`）だけをモバイル側に追加している。

### mobile

| ファイル | 内容 |
|---|---|
| `apps/mobile/components/members/MobileMemberTrigger.tsx` | ヘッダー内「メンバー」ボタン |
| `apps/mobile/components/members/MobileMemberCard.tsx` | 個別メンバーカード（タップでアコーディオン展開） |
| `apps/mobile/components/members/MobileMemberSheet.tsx` | Bottom Sheet Modal（全メンバー一覧） |

### 更新したファイル

| ファイル | 変更内容 |
|---|---|
| `packages/shared/src/index.ts` | `members/*` を re-export |
| `apps/mobile/components/session/MobileSessionHeader.tsx` | `onOpenMembers` prop 追加、「メンバー」ボタン表示 |
| `apps/mobile/app/index.tsx` | `memberSheetOpen` state、`MobileMemberSheet` を組み込み |

## 表示項目

各カードには以下を表示する。

| フィールド | 元データ |
|---|---|
| 名前 / emoji | `UNIVERSAL_AGENTS` |
| 一行説明（oneLine） | `memberDisplayProfiles.ts` の MEMBER_ONE_LINE |
| 核心（core） | `AGENT_PROMPT_PROFILES` |
| 何を見るか（sees） | `AGENT_PROMPT_PROFILES` |
| 声の温度（tone） | `AGENT_PROMPT_PROFILES` |
| しないこと（avoids） | `AGENT_PROMPT_PROFILES` |
| 使い方ヒント（userFacingHint） | `memberDisplayProfiles.ts` の MEMBER_USER_FACING_HINT |

## 方針

- App Store版でも Web版と同等の深さの説明を表示する
- `shared` の既存 profile を UI 土台に使い、mobile 側に文言を直書きしない
- カードはデフォルト折りたたみ、タップで展開するアコーディオン形式
- iOS / Android / Web で同じ導線・文言・操作を使う（Safe Area 差分は内部吸収）
- Vite Web 版の `src/` は変更しない
