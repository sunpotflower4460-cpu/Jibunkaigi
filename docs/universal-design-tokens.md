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
| Motion | CSS animation | 未対応 | 未移植 | RNでは軽量化 |
| Safe Area | CSS env | SafeAreaView | 一部対応 | |
| Tap Target | CSS utility | minHeight 44 | 一部対応 | |

## 完成条件

Expo Universal版の見た目が、旧Vite Web版の世界観から外れていないこと。
ただしピクセル完全一致ではなく、体験・印象・画面構造を揃える。
