// src/runtime/textPipeline/buildExistenceText.js
// 第3章3-2の実装: 存在の前提を日本語の情景描写として生成する
// 設計用語・英語キー・数値を一切含まない

import { AXIS_DESCRIPTIONS, TENSION_DESCRIPTIONS } from './axisDescriptions.js';

/**
 * previousLatentState から前ターンの余韻を薄く取得する
 * 説明にはせず、立ち上がり方のニュアンスを少し変えるだけ
 * @param {object} previousLatentState - 前ターンの latentState
 * @returns {string} 余韻のにじみ（なければ空文字）
 */
function extractAfterglowNuance(previousLatentState = {}) {
  const prevStance = previousLatentState?.stance || {};
  const prevPermission = previousLatentState?.permission || {};

  // 前ターンの receive が高い → 受け止め寄りのニュアンス
  if ((prevStance.receive ?? 0) > 0.6) {
    return '受け止める姿勢が残っている';
  }

  // 前ターンの guard が高い → 慎重寄りのニュアンス
  if ((prevStance.guard ?? 0) > 0.6) {
    return '少し、慎重になっている';
  }

  // 前ターンの allowSilence が高い → 静かなニュアンス
  if ((prevPermission.allowSilence ?? 0) > 0.6) {
    return '静けさが、まだ続いている';
  }

  return '';
}

/**
 * 存在層からの描写を生成する
 * @param {object} latentState - runInternalOS の出力
 * @param {object} options - オプション
 * @param {object} options.previousLatentState - 前ターンの latentState（afterglow用）
 * @returns {string} 日本語の情景描写（空の場合は空文字）
 */
export function buildExistenceText(latentState = {}, options = {}) {
  const existence2 = latentState?.existence2 || {};
  const beliefCore = latentState?.beliefCore || {};
  const beliefTension = latentState?.beliefTension || {};
  const previousLatentState = options.previousLatentState || {};

  const lines = [];

  // identityFeelingText: エージェントの「感じる自分」
  if (existence2.identityFeelingText && typeof existence2.identityFeelingText === 'string') {
    lines.push(existence2.identityFeelingText);
  }

  if (Array.isArray(beliefCore.activeCoreBeliefs)) {
    const nonIdentityBelief = beliefCore.activeCoreBeliefs
      .filter((belief) => belief?.axis !== 'identity' && typeof belief?.textJa === 'string' && belief.textJa.trim())
      .sort((left, right) => (right?.weight ?? 0) - (left?.weight ?? 0))[0];
    if (nonIdentityBelief && !lines.includes(nonIdentityBelief.textJa.trim())) {
      lines.push(nonIdentityBelief.textJa.trim());
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

  // recalledSelfTraits: 思い出した自分の特徴
  if (Array.isArray(existence2.recalledSelfTraits) && existence2.recalledSelfTraits.length > 0) {
    const traits = existence2.recalledSelfTraits
      .filter(t => typeof t === 'string' && t.trim())
      .slice(0, 2); // 最大2つまで
    if (traits.length > 0) {
      lines.push(traits.join('。') + '。');
    }
  }

  // dominantTensionAxis: 最も強い緊張の軸から、感覚の描写を追加（あれば）
  const tensionAxis = beliefTension?.dominantTensionAxis;
  if (tensionAxis && tensionAxis !== dominantAxis && TENSION_DESCRIPTIONS[tensionAxis]) {
    const desc = TENSION_DESCRIPTIONS[tensionAxis];
    const tensionLine = desc.feeling || desc.atmosphere || '';
    if (tensionLine) {
      lines.push(tensionLine);
    }
  }

  // afterglow: 前ターンの余韻を薄く反映（説明ではなく、にじみとして）
  const afterglowNuance = extractAfterglowNuance(previousLatentState);
  if (afterglowNuance && lines.length < 3) {
    lines.push(afterglowNuance);
  }

  // 最大3行まで
  return lines.filter(Boolean).slice(0, 3).join('\n');
}
