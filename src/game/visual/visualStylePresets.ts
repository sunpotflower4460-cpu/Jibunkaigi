// src/game/visual/visualStylePresets.ts
// Vinus-craft 基本ビジュアルスタイルプリセット
// 色設定をここに集約し、コード中への散在を防ぐ

import type { VisualStylePreset } from './visualStyleTypes.js';
import { AtmospherePalette } from './atmospherePalette.js';

/**
 * Venus Golden Mist — 金霧の金星
 *
 * Vinus-craft の基本プリセット。
 * 白金・琥珀・金白の淡い霧。
 * くすみすぎず、明るいがまぶしすぎない。
 * 金色文明の残光が霧に溶けたような空気。
 */
export const PRESET_VENUS_GOLDEN_MIST: VisualStylePreset = {
  id: 'venus_golden_mist',
  nameJa: '金霧の金星',

  sky: {
    topColor: AtmospherePalette.skyTop,          // 淡いクリームゴールド
    midColor: AtmospherePalette.skyMid,           // 薄い琥珀
    horizonColor: AtmospherePalette.skyHorizon,   // 白金霧
    lowerMistColor: AtmospherePalette.skyLowerMist, // 霧と混ざる金
  },

  fog: {
    baseColor: AtmospherePalette.fogBase,         // 薄い金白
    nearColor: AtmospherePalette.fogNear,          // 近距離は薄く
    farColor: AtmospherePalette.fogFar,            // 遠距離で白金
    densityRange: [0.02, 0.15],                   // 低め〜中：霧が奥行きになる
    heightFogStrength: 0.3,                        // 谷底は少し濃い
  },

  light: {
    ambientColor: AtmospherePalette.ambientWhiteGold, // やわらかい白金
    ambientIntensity: 0.65,                        // 明るいが平坦にならない
    sunColor: AtmospherePalette.sunWhiteGold,      // 白金
    sunIntensity: 1.1,                             // 暖かい・まぶしすぎない
    shadowTint: AtmospherePalette.shadowBrownGold, // 深い茶金
  },

  postHint: {
    contrast: 1.05,    // わずかにコントラスト
    saturation: 0.92,  // 控えめに上品
    warmth: 1.08,      // 少し暖かい
    exposure: 1.0,     // 標準
  },

  emissiveHint: {
    glowBlendStrength: 0.4,                        // 霧との自然なにじみ
    emissiveTint: AtmospherePalette.emissiveGlowStone,
    useDistantEmissive: true,                      // 遠くの発光点を表現
  },
};

/**
 * 全プリセット一覧
 * 地域カラースクリプトはこの一覧から basePresetId で参照する。
 */
export const ALL_PRESETS: Record<string, VisualStylePreset> = {
  [PRESET_VENUS_GOLDEN_MIST.id]: PRESET_VENUS_GOLDEN_MIST,
};

/**
 * プリセットIDからプリセットを取得する
 * 見つからない場合はデフォルト（Venus Golden Mist）を返す
 */
export function getPresetById(id: string): VisualStylePreset {
  return ALL_PRESETS[id] ?? PRESET_VENUS_GOLDEN_MIST;
}
