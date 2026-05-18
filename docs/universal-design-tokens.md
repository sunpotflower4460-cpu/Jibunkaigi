# Jibunkaigi Universal Design Tokens

## 目的

iOS / Android / Web で見た目の印象を揃えるため、Web版の `design-tokens.css` と Expo版の `theme/tokens.ts` を対応させる。

## 対象

- color
- spacing
- radius
- typography
- shadow
- motion
- safe area
- tap target

## 原則

- じぶん会議の世界観を全媒体で揃える
- App Store版だけ別デザインにしない
- Web版だけリッチにしすぎない
- Android版だけ簡素にしない
- 重いblurや過剰アニメーションに頼らない
- 44px以上のタップ領域を守る

## 対応表

| 種類 | Web Token | Expo Token | 状態 | 備考 |
|---|---|---|---|---|
| 背景 | design-tokens.css bg系 | colors.bgBase / bgDeep | 一部対応 | |
| 文字色 | ink系 | colors.inkStrong / inkMain / inkMuted | 一部対応 | |
| Surface | surface系 | colors.surfaceStrong / surfaceSoft | 一部対応 | |
| Accent | accent系 | colors.accentIndigo / accentViolet | 一部対応 | |
| 角丸 | radius系 | radius.xs〜full | 一部対応 | |
| 余白 | spacing系 | spacing.xs〜xxl | 一部対応 | |
| タイポ | text scale | type.title / heading / body | 一部対応 | |
| 影 | shadow系 | shadow.soft / card | 一部対応 | |
| Motion | CSS animation | `mobileMotion.ts` | 一部対応 | 150ms〜250msの静かな motion token を追加 |
| Safe Area | CSS env | SafeAreaView | 一部対応 | |
| Tap Target | CSS utility | `mobileTouchTarget.minimum` / `comfortable` | 一部対応 | 主要操作の44px基準をtheme化 |

## Expo側の基準ファイル

- `apps/mobile/theme/mobileTheme.ts`
- `apps/mobile/theme/mobileSpacing.ts`
- `apps/mobile/theme/mobileTypography.ts`
- `apps/mobile/theme/mobileMotion.ts`
- `apps/mobile/theme/tokens.ts`（後方互換の集約レイヤ）

## 完成条件

Expo Universal版の見た目が、旧Vite Web版の世界観から外れていないこと。

OS差によるフォントレンダリング・サブピクセル・スクロール慣性などの物理的なピクセル差は許容する。
ただし以下は同一体験として必ず揃える。

- 画面構成・レイアウト構造
- 余白感・密度感
- 色（背景・文字・アクセント・サーフェス）
- 角丸
- 文言・ラベル
- 操作導線（どこをタップすれば何が起きるか）
- 見た目の印象・世界観

「媒体が違うから見た目が違う」を完成とは呼ばない。
「OSの物理制約で微妙に違う」だけが許容される差分である。
