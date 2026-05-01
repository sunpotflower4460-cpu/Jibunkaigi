// src/game/visual/regionColorScript.ts
// Vinus-craft 地域別カラースクリプト
// 各地域の色・光・霧の差分設定。基本プリセットを上書きして地域ごとの個性を出す。

import type { RegionColorScript } from './visualStyleTypes.js';
import { AtmospherePalette } from './atmospherePalette.js';

// ─────────────────────────────────────────────────────────────
// 5-1. 白金平地 / spawn_plains
// 印象: ここから暮らしが始まる
// ─────────────────────────────────────────────────────────────
export const REGION_SPAWN_PLAINS: RegionColorScript = {
  regionId: 'spawn_plains',
  nameJa: '白金平地',
  basePresetId: 'venus_golden_mist',
  impressionJa: 'ここから暮らしが始まる',
  overrides: {
    sky: {
      horizonColor: '#EDE8D0',  // 白金寄りに
      topColor: '#F5EDD8',      // 少し明るく
    },
    fog: {
      densityRange: [0.01, 0.08], // 低め：遠くまで見える
    },
    light: {
      ambientIntensity: 0.72,       // やや明るめ
      shadowTint: AtmospherePalette.shadowBrownGold, // 柔らかい茶金
    },
    postHint: {
      contrast: 1.03,
      saturation: 0.90,  // 控えめに上品
      warmth: 1.10,
      exposure: 1.02,
    },
  },
};

// ─────────────────────────────────────────────────────────────
// 5-2. 黒金裂け目 / blackgold_rift
// 印象: 星の深部が開いている
// 注意: 真っ黒にしない。発光石が道標になるように。
// ─────────────────────────────────────────────────────────────
export const REGION_BLACKGOLD_RIFT: RegionColorScript = {
  regionId: 'blackgold_rift',
  nameJa: '黒金裂け目',
  basePresetId: 'venus_golden_mist',
  impressionJa: '星の深部が開いている',
  overrides: {
    sky: {
      topColor: '#1A1208',
      midColor: '#2A1C08',
      horizonColor: '#3A2810',
      lowerMistColor: '#2A1E0C',
    },
    fog: {
      baseColor: AtmospherePalette.fogDarkGold,
      densityRange: [0.05, 0.25],  // 中：重いが見える
      heightFogStrength: 0.5,
    },
    light: {
      ambientColor: AtmospherePalette.ambientRift,
      ambientIntensity: 0.35,       // 低め：暗いが輪郭は残す
      sunIntensity: 0.6,
      shadowTint: AtmospherePalette.shadowDarkGrayPurple,
    },
    postHint: {
      contrast: 1.15,   // やや高め：local lightが映える
      saturation: 0.85,
      warmth: 0.90,
      exposure: 0.85,
    },
    emissiveHint: {
      glowBlendStrength: 0.65,  // 霧の中で発光が浮かぶ
      emissiveTint: AtmospherePalette.emissiveGlowStone,
      useDistantEmissive: true,
    },
  },
};

// ─────────────────────────────────────────────────────────────
// 5-3. 結晶洞窟 / crystal_cave
// 印象: 暗闇の中に記憶の光が残っている
// ─────────────────────────────────────────────────────────────
export const REGION_CRYSTAL_CAVE: RegionColorScript = {
  regionId: 'crystal_cave',
  nameJa: '結晶洞窟',
  basePresetId: 'venus_golden_mist',
  impressionJa: '暗闇の中に記憶の光が残っている',
  overrides: {
    sky: {
      topColor: '#0C1020',
      midColor: '#101828',
      horizonColor: '#182030',
      lowerMistColor: '#101828',
    },
    fog: {
      baseColor: AtmospherePalette.fogCrystalBlue,
      densityRange: [0.04, 0.20],
      heightFogStrength: 0.2,
    },
    light: {
      ambientColor: AtmospherePalette.ambientCave,
      ambientIntensity: 0.30,  // 低〜中：emissive lightを目立たせる
      sunColor: '#B0C0E0',
      sunIntensity: 0.4,
      shadowTint: AtmospherePalette.shadowDeepBlueGray,
    },
    postHint: {
      contrast: 1.08,
      saturation: 1.10,  // 結晶だけ少し高め
      warmth: 0.85,      // 青白い
      exposure: 0.80,
    },
    emissiveHint: {
      glowBlendStrength: 0.70,
      emissiveTint: AtmospherePalette.emissiveCrystal,
      useDistantEmissive: true,
    },
  },
};

// ─────────────────────────────────────────────────────────────
// 5-4. 霧の谷 / jelly_mist_valley
// 印象: 空気まで柔らかい
// ─────────────────────────────────────────────────────────────
export const REGION_JELLY_MIST_VALLEY: RegionColorScript = {
  regionId: 'jelly_mist_valley',
  nameJa: '霧の谷',
  basePresetId: 'venus_golden_mist',
  impressionJa: '空気まで柔らかい',
  overrides: {
    sky: {
      topColor: '#E8ECD8',
      midColor: '#D8E0C0',
      horizonColor: AtmospherePalette.fogMilkyWhite,
      lowerMistColor: AtmospherePalette.fogMistGreen,
    },
    fog: {
      baseColor: AtmospherePalette.fogMilkyWhite,
      nearColor: '#F0F2E8',
      farColor: AtmospherePalette.fogMistGreen,
      densityRange: [0.10, 0.40],  // 高め：柔らかく霞む
      heightFogStrength: 0.75,     // 下層に乳白の霧
    },
    light: {
      ambientColor: '#E8ECD8',
      ambientIntensity: 0.60,  // 柔らかめ
      sunColor: '#F0ECD8',
      sunIntensity: 0.85,
      shadowTint: '#C8D0B8',
    },
    postHint: {
      contrast: 0.98,   // 低〜中：霞んで柔らかい
      saturation: 0.95,
      warmth: 1.05,
      exposure: 1.05,
    },
    emissiveHint: {
      glowBlendStrength: 0.55,
      emissiveTint: AtmospherePalette.emissiveSoftLamp,
      useDistantEmissive: false,
    },
  },
};

// ─────────────────────────────────────────────────────────────
// 5-5. 古代遺跡 / ancient_ruins
// 印象: かつて美しかったものの残り香
// ─────────────────────────────────────────────────────────────
export const REGION_ANCIENT_RUINS: RegionColorScript = {
  regionId: 'ancient_ruins',
  nameJa: '古代遺跡',
  basePresetId: 'venus_golden_mist',
  impressionJa: 'かつて美しかったものの残り香',
  overrides: {
    sky: {
      topColor: '#E0D0A0',
      midColor: '#D8C490',
      horizonColor: AtmospherePalette.fogAmber,
      lowerMistColor: '#C8B878',
    },
    fog: {
      baseColor: AtmospherePalette.fogAmber,
      densityRange: [0.03, 0.18],  // 低〜中
      heightFogStrength: 0.25,
    },
    light: {
      ambientColor: '#D8C890',
      ambientIntensity: 0.55,  // 少し暗めの白金
      sunColor: AtmospherePalette.sunAncientGold,
      sunIntensity: 1.0,
      shadowTint: AtmospherePalette.shadowDustyBrownGold,
    },
    postHint: {
      contrast: 1.05,
      saturation: 0.82,  // 少し低め：くすみ
      warmth: 1.12,      // 乾いた金
      exposure: 0.95,
    },
    emissiveHint: {
      glowBlendStrength: 0.35,
      emissiveTint: AtmospherePalette.emissiveAtria,
      useDistantEmissive: true,
    },
  },
};

// ─────────────────────────────────────────────────────────────
// 5-6. 見晴らしの丘 / lookout_hill
// 印象: この星のかたちが少し見える
// ─────────────────────────────────────────────────────────────
export const REGION_LOOKOUT_HILL: RegionColorScript = {
  regionId: 'lookout_hill',
  nameJa: '見晴らしの丘',
  basePresetId: 'venus_golden_mist',
  impressionJa: 'この星のかたちが少し見える',
  overrides: {
    sky: {
      topColor: '#F8F0DC',        // 明るい
      midColor: '#F0E4C0',
      horizonColor: '#F0E8D0',    // 明るい金白
      lowerMistColor: '#E8DEC0',
    },
    fog: {
      densityRange: [0.01, 0.06], // 低め：遠くが見える
      heightFogStrength: 0.15,
    },
    light: {
      ambientColor: '#F0E8D0',
      ambientIntensity: 0.80,  // 高め
      sunIntensity: 1.2,
      shadowTint: AtmospherePalette.shadowBrownGold,
    },
    postHint: {
      contrast: 1.10,   // やや高め：シルエットを出す
      saturation: 0.95,
      warmth: 1.10,
      exposure: 1.05,
    },
    emissiveHint: {
      glowBlendStrength: 0.30,
      emissiveTint: AtmospherePalette.emissiveLantern,
      useDistantEmissive: true,
    },
  },
};

/**
 * 全地域カラースクリプト一覧
 */
export const ALL_REGION_SCRIPTS: Record<string, RegionColorScript> = {
  [REGION_SPAWN_PLAINS.regionId]:       REGION_SPAWN_PLAINS,
  [REGION_BLACKGOLD_RIFT.regionId]:     REGION_BLACKGOLD_RIFT,
  [REGION_CRYSTAL_CAVE.regionId]:       REGION_CRYSTAL_CAVE,
  [REGION_JELLY_MIST_VALLEY.regionId]:  REGION_JELLY_MIST_VALLEY,
  [REGION_ANCIENT_RUINS.regionId]:      REGION_ANCIENT_RUINS,
  [REGION_LOOKOUT_HILL.regionId]:       REGION_LOOKOUT_HILL,
};

/**
 * 地域IDからカラースクリプトを取得する
 */
export function getRegionScript(regionId: string): RegionColorScript | undefined {
  return ALL_REGION_SCRIPTS[regionId];
}
