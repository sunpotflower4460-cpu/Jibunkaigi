// src/runtime/textPipeline/buildBodySignals.js
// 第6章6-1の実装: bodySignals を external と internal に分離計算する

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * 外界由来の身体感覚を計算する
 * field の urgency / fragility / softness / playfulness から、
 * 「場がどう感じられるか」を数値化する
 *
 * @param {object} field - latentState.field
 * @returns {object} external body signals
 */
function calculateExternalSignals(field = {}) {
  return {
    tension: clamp01(field.urgency * 0.7 + field.fragility * 0.3),
    softness: clamp01(field.softness),
    hesitation: clamp01(field.fragility * 0.6 + (1 - field.urgency) * 0.4),
    urgency: clamp01(field.urgency),
    warmth: clamp01(field.softness * 0.5 + (field.playfulness ?? 0) * 0.3),
    contraction: clamp01(field.fragility * 0.5 + (1 - (field.playfulness ?? 0)) * 0.3),
  };
}

/**
 * 内面由来の身体感覚を計算する
 * beliefTension / stance.guard / reaction.holdBackJudgment から、
 * 「内側でどう感じているか」を数値化する
 *
 * @param {object} latentState - runInternalOS の出力（beliefTension, previousLatentState を含む）
 * @returns {object} internal body signals
 */
function calculateInternalSignals(latentState = {}) {
  const beliefTension = latentState.beliefTension || {};
  const previousLatentState = latentState.previousLatentState || {};
  const previousStance = previousLatentState.stance || {};
  const previousReaction = previousLatentState.reaction || {};

  // beliefTension の総強度を計算
  const totalTensionStrength = beliefTension.totalTensionStrength ?? 0;

  // stance.guard: 守りの姿勢が強いほど、内側に緊張がある
  const guardStrength = previousStance.guard ?? 0;

  // reaction.holdBackJudgment: 判断を保留する強さは、内側の迷いの指標
  const hesitationStrength = previousReaction.holdBackJudgment ?? 0;

  return {
    tension: clamp01(totalTensionStrength * 0.8 + guardStrength * 0.2),
    hesitation: clamp01(hesitationStrength * 0.7 + totalTensionStrength * 0.2),
    contraction: clamp01(guardStrength * 0.6 + totalTensionStrength * 0.3),
  };
}

/**
 * bodySignals を external と internal に分離計算する
 * @param {object} latentState - runInternalOS の出力
 * @returns {object} { external, internal }
 */
export function buildBodySignals(latentState = {}) {
  const field = latentState.field || {};

  return {
    external: calculateExternalSignals(field),
    internal: calculateInternalSignals(latentState),
  };
}
