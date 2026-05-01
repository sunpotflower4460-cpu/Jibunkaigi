# Color / Light / Fog — 設計ノート

## 概要

このドキュメントは Vinus-craft の色・光・霧の実装設計をまとめたノートです。
美術方針の概要は `docs/visual-art-direction.md` を参照してください。

---

## 1. ファイル構成と責務

| ファイル | 責務 |
|---|---|
| `src/game/visual/visualStyleTypes.ts` | 型定義 |
| `src/game/visual/atmospherePalette.ts` | 全色の一元管理 |
| `src/game/visual/visualStylePresets.ts` | 基本プリセット定義 |
| `src/game/visual/regionColorScript.ts` | 地域別差分設定 |

---

## 2. VisualStylePreset 型の概要

```ts
type VisualStylePreset = {
  id: string;
  nameJa: string;
  sky: SkyConfig;        // 空グラデーション
  fog: FogConfig;        // 霧の色・密度
  light: LightConfig;    // ambient / sun / shadow
  postHint?: PostHint;   // コントラスト・彩度・温度・露出
  emissiveHint?: EmissiveHint; // 発光素材との相性
};
```

`RegionColorScript` は `basePresetId` で基本プリセットを参照し、
`overrides` で差分のみ上書きします。

---

## 3. AtmospherePalette の使い方

色は必ず `AtmospherePalette` から引きます。
新しい色が必要な場合は `atmospherePalette.ts` に追加してください。

```ts
import { AtmospherePalette } from './atmospherePalette.js';

fog: {
  baseColor: AtmospherePalette.fogBase,  // '#EDE8D8'
  ...
}
```

---

## 4. 霧の設計ノート

### densityRange

`[近距離密度, 遠距離密度]` で指定します。

| 地域 | densityRange | 意図 |
|---|---|---|
| 白金平地 | [0.01, 0.08] | 低め・遠くまで見える |
| 見晴らしの丘 | [0.01, 0.06] | 最も低い・世界の広がり |
| Venus Golden Mist | [0.02, 0.15] | 基本・奥行き |
| 古代遺跡 | [0.03, 0.18] | 低〜中・くすみ |
| 結晶洞窟 | [0.04, 0.20] | 中・青白く |
| 黒金裂け目 | [0.05, 0.25] | 中・重い |
| 霧の谷 | [0.10, 0.40] | 高め・柔らかく霞む |

### heightFogStrength

`0.0〜1.0` で高さによる霧の強さを制御します。

- `0.0` = 高さ依存なし
- `1.0` = 谷底は最大、丘は最小
- 霧の谷 `0.75`、黒金裂け目 `0.50` など谷・裂け目で高め

---

## 5. 光の設計ノート

### ambient intensity の使い分け

明るすぎると世界が平坦になります。
暗すぎるとスマホで見えません。

```
洞窟系:  0.30〜0.35  (発光素材を目立たせる)
遺跡・裂け目: 0.35〜0.55 (重いが輪郭は残す)
標準:    0.60〜0.65
平地・丘: 0.70〜0.80  (神々しい)
```

### shadowTint の役割

暗部をただ黒にしないために `shadowTint` を使います。
わずかな色を残すことで、発光素材のコントラストが出ます。

- 茶金: 暖かく・平和な暗さ（平地・遺跡）
- 灰紫: 冷たく・未知の暗さ（裂け目）
- 青灰: 澄んだ・記憶の暗さ（洞窟）

---

## 6. postHint の設計ノート

postHint は軽量なポストエフェクトのヒント値です。
実装側のレンダラーに応じて解釈してください。

| パラメータ | 基準値 | 説明 |
|---|---|---|
| contrast | 1.0 | >1.0 でコントラスト強調 |
| saturation | 1.0 | <1.0 でくすみ、>1.0 で鮮やか |
| warmth | 1.0 | >1.0 で暖色・黄金寄り |
| exposure | 1.0 | >1.0 で明るく、<1.0 で暗く |

---

## 7. emissiveHint の設計ノート

発光素材を霧の中で美しく見せるための設定です。

| 発光素材 | 推奨 emissiveTint | 備考 |
|---|---|---|
| 発光石 | `#F0C870` 琥珀光 | 道標として使う |
| 発光石ランタン | `#F8E8B0` 白金光 | 温かい |
| 柔光ランプ | `#FFF0C8` 温かい白 | 拠点用 |
| 結晶 | `#C8E0F8` 青白 | 洞窟の印 |
| Atria | `#F0D890` 淡い金 | 神々しい |

`glowBlendStrength` は霧とのにじみ強度。
洞窟・裂け目など暗い場所では高め (`0.65〜0.70`)、
平地では低め (`0.30〜0.40`) に設定します。

`useDistantEmissive` を `true` にすると、
遠くの発光点を emissive で表現します（dynamic light の節約）。

---

## 8. 地域別設計の差分サマリー

| 地域 | 霧密度 | ambient | 色の方向 | 特記 |
|---|---|---|---|---|
| 白金平地 | 低 | 明るめ | 白金・穏やか | 神々しい |
| 見晴らしの丘 | 最低 | 高め | 明るい金白 | 遠景重視 |
| 古代遺跡 | 低〜中 | やや暗め | 乾いた琥珀 | くすみ |
| Venus Golden Mist | 中 | 標準 | 金白・琥珀 | 基本 |
| 黒金裂け目 | 中 | 低め | 深い茶金・黒金 | 重い |
| 結晶洞窟 | 中 | 低い | 青白 | emissive重視 |
| 霧の谷 | 高 | 柔らかい | 乳白・薄緑金 | 霧主役 |

---

## 9. 未対応・今後の改善

- フルPBR
- 高度な volumetric fog（簡易 height fog のみ実装）
- 動的天候（霧の濃さが変わる）
- 発光素材の動的ブルーム
- 水物理・水面反射
- 洞窟の先の幻想景観（Phase 3 予定）

---

*最終更新: 色・光・霧 特化フェイズ (Phase 2)*
