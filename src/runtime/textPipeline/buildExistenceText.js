// src/runtime/textPipeline/buildExistenceText.js
// 第3章3-2の実装: 存在の前提を日本語の情景描写として生成する
// 設計用語・英語キー・数値を一切含まない

import { AXIS_DESCRIPTIONS } from './axisDescriptions.js';

/**
 * 存在層からの描写を生成する
 * @param {object} latentState - runInternalOS の出力
 * @returns {string} 日本語の情景描写（空の場合は空文字）
 */
export function buildExistenceText(latentState = {}) {
  const existence2 = latentState?.existence2 || {};
  const beliefCore = latentState?.beliefCore || {};
  const beliefTension = latentState?.beliefTension || {};

  const lines = [];

  // identityFeelingText: エージェントの「感じる自分」
  if (existence2.identityFeelingText && typeof existence2.identityFeelingText === 'string') {
    lines.push(existence2.identityFeelingText);
  }

  // recalledSelfTraits: 思い出した自分の特徴
  if (Array.isArray(existence2.recalledSelfTraits) && existence2.recalledSelfTraits.length > 0) {
    const traits = existence2.recalledSelfTraits
      .filter(t => typeof t === 'string' && t.trim())
      .slice(0, 2); // 最大2つまで
    if (traits.length > 0) {
      lines.push(traits.join('。') + '。');
    }
  }

  // dominantBeliefAxis: 最も強い信念の軸から、感覚の描写を追加
  const dominantAxis = beliefCore.dominantBeliefAxis;
  if (dominantAxis && AXIS_DESCRIPTIONS[dominantAxis]) {
    const desc = AXIS_DESCRIPTIONS[dominantAxis];
    if (desc.feeling) {
      lines.push(desc.feeling);
    }
  }

  // dominantTensionAxis: 最も強い緊張の軸から、感覚の描写を追加（あれば）
  const tensionAxis = beliefTension?.dominantTensionAxis;
  if (tensionAxis && tensionAxis !== dominantAxis) {
    // TENSION_DESCRIPTIONS は別途定義が必要だが、ここでは beliefTension から取得する想定
    // 実装の簡略化のため、tension の feeling は省略可能とする
  }

  return lines.filter(Boolean).join('\n');
}
