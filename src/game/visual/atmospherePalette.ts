// src/game/visual/atmospherePalette.ts
// Vinus-craft 大気色パレット
// 金色文明の残光が霧に溶けた金星世界の基本色を定義する

/**
 * Venus 大気パレット
 * ここに色を集約することで、後から美術調整しやすくする。
 * 使用側は必ずこのパレットから色を引くこと（コード中への色の散在を防ぐ）。
 */
export const AtmospherePalette = {
  // ───────────────────────────────────────────────
  // 空・上層
  // ───────────────────────────────────────────────
  /** 上空：淡いクリームゴールド */
  skyTop: '#F5ECD4',
  /** 中間空：薄い琥珀 */
  skyMid: '#E8D4A0',
  /** 地平線：白金霧 */
  skyHorizon: '#EDE4C8',
  /** 下部：霧と混ざる金 */
  skyLowerMist: '#E0D0A8',

  // ───────────────────────────────────────────────
  // 霧
  // ───────────────────────────────────────────────
  /** 基本霧：薄い金白 */
  fogBase: '#EDE8D8',
  /** 近距離霧：ほぼ透明（視認性確保） */
  fogNear: '#F5F2E8',
  /** 遠距離霧：白金でやわらかく消える */
  fogFar: '#EAE4D4',
  /** 乳白霧（霧の谷） */
  fogMilkyWhite: '#EFF0E8',
  /** 深い茶金霧（黒金裂け目） */
  fogDarkGold: '#4A3A20',
  /** 青白霧（結晶洞窟） */
  fogCrystalBlue: '#B8C8D8',
  /** 乾いた琥珀霧（古代遺跡） */
  fogAmber: '#C8A860',
  /** 薄緑金霧（霧の谷） */
  fogMistGreen: '#D8E0C0',

  // ───────────────────────────────────────────────
  // 環境光・太陽光
  // ───────────────────────────────────────────────
  /** ambient：やわらかい白金 */
  ambientWhiteGold: '#F0E8D0',
  /** ambient（洞窟）：青白 */
  ambientCave: '#C0C8D8',
  /** ambient（裂け目）：暗い灰紫 */
  ambientRift: '#2A2030',
  /** 太陽光：白金 */
  sunWhiteGold: '#FFF5E0',
  /** 太陽光（遺跡）：乾いた金 */
  sunAncientGold: '#F0D880',

  // ───────────────────────────────────────────────
  // 影・暗部
  // ───────────────────────────────────────────────
  /** 影：深い茶金 */
  shadowBrownGold: '#3A2A10',
  /** 影：灰紫（平地・洞窟） */
  shadowGrayPurple: '#2A2438',
  /** 影（結晶洞窟）：深い青灰 */
  shadowDeepBlueGray: '#182030',
  /** 影（遺跡）：くすんだ茶金 */
  shadowDustyBrownGold: '#3C2A14',
  /** 影（裂け目）：暗い灰紫 */
  shadowDarkGrayPurple: '#1A1428',

  // ───────────────────────────────────────────────
  // 発光素材
  // ───────────────────────────────────────────────
  /** 発光石：柔らかい琥珀光 */
  emissiveGlowStone: '#F0C870',
  /** 発光石ランタン：白金光 */
  emissiveLantern: '#F8E8B0',
  /** 柔光ランプ：温かい白 */
  emissiveSoftLamp: '#FFF0C8',
  /** 結晶光：青白 */
  emissiveCrystal: '#C8E0F8',
  /** Atria 光：淡い金 */
  emissiveAtria: '#F0D890',
} as const;

export type AtmospherePaletteKey = keyof typeof AtmospherePalette;
