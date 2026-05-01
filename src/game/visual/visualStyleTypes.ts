// src/game/visual/visualStyleTypes.ts
// Vinus-craft ビジュアルスタイルの型定義

/**
 * 空のグラデーション色設定
 */
export interface SkyConfig {
  /** 上空の色（淡い金白・薄いクリーム） */
  topColor: string;
  /** 中間の色（やや琥珀） */
  midColor: string;
  /** 地平線の色（白金霧・琥珀） */
  horizonColor: string;
  /** 下部の霧と混ざる色（霧と境界をつなぐ） */
  lowerMistColor: string;
}

/**
 * 霧の色・密度設定
 */
export interface FogConfig {
  /** 霧の基本色 */
  baseColor: string;
  /** 近距離霧の色（省略可：近くは見やすく） */
  nearColor?: string;
  /** 遠距離霧の色（省略可：遠くでやわらかく消える） */
  farColor?: string;
  /** [最小密度, 最大密度] 0.0〜1.0 */
  densityRange: [number, number];
  /** 高さによる霧の強さ（0.0〜1.0）省略可 */
  heightFogStrength?: number;
}

/**
 * 光の設定（ambient・太陽光・影）
 */
export interface LightConfig {
  /** 環境光の色 */
  ambientColor: string;
  /** 環境光の強さ（0.0〜1.0） */
  ambientIntensity: number;
  /** 太陽光の色（白金・暖色） */
  sunColor: string;
  /** 太陽光の強さ（0.0〜2.0） */
  sunIntensity: number;
  /** 影の色味（暗部にわずかな色を残す） */
  shadowTint: string;
}

/**
 * ポストエフェクトのヒント設定（軽量・推奨値のみ）
 */
export interface PostHint {
  /** コントラスト補正（1.0 = 変化なし） */
  contrast: number;
  /** 彩度補正（1.0 = 変化なし） */
  saturation: number;
  /** 温度感（1.0 = 変化なし、>1.0 で暖かく） */
  warmth: number;
  /** 露出補正（1.0 = 変化なし） */
  exposure: number;
}

/**
 * 発光素材との相性設定
 */
export interface EmissiveHint {
  /** 霧の中での発光のにじみ強度（0.0〜1.0） */
  glowBlendStrength: number;
  /** 発光素材の基本カラー（ネオンにしない） */
  emissiveTint: string;
  /** 遠距離での emissive 表現を使うか */
  useDistantEmissive: boolean;
}

/**
 * VisualStylePreset — 色・光・霧の設定をまとめた美術設計型
 * 地域ごとに上書き可能。
 */
export interface VisualStylePreset {
  /** 一意な識別子 */
  id: string;
  /** 日本語名 */
  nameJa: string;
  /** 空の設定 */
  sky: SkyConfig;
  /** 霧の設定 */
  fog: FogConfig;
  /** 光の設定 */
  light: LightConfig;
  /** ポストエフェクトのヒント（省略可） */
  postHint?: PostHint;
  /** 発光素材との相性（省略可） */
  emissiveHint?: EmissiveHint;
}

/**
 * 地域カラースクリプト型
 * VisualStylePreset を基本プリセットとして参照し、差分だけ上書きする。
 */
export interface RegionColorScript {
  /** 地域ID */
  regionId: string;
  /** 地域の日本語名 */
  nameJa: string;
  /** 基本プリセットのID（参照元） */
  basePresetId: string;
  /** 上書きする設定（Partial で差分のみ） */
  overrides: {
    sky?: Partial<SkyConfig>;
    fog?: Partial<FogConfig>;
    light?: Partial<LightConfig>;
    postHint?: Partial<PostHint>;
    emissiveHint?: Partial<EmissiveHint>;
  };
  /** 地域の世界観メモ */
  impressionJa: string;
}
