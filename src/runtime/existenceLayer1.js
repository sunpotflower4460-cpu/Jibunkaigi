// src/runtime/existenceLayer1.js
// 共通の存在層1: 「私は今ここにいる」を回復する層

import { clamp01 } from './afterglow.js';

const safeNum = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export function createExistenceLayer1({
  home = {},
  field = {},
  reaction = {},
  stance = {},
  preHomeInput = {},
} = {}) {
  const kernel = home?.kernel ?? {};
  const outputLimits = home?.outputLimits ?? {};
  const softReason = home?.softReason ?? {};
  const fallbackField = {
    softness: safeNum(preHomeInput.softness),
    depth: safeNum(preHomeInput.depth),
    urgency: safeNum(preHomeInput.urgency),
    fragility: safeNum(preHomeInput.fragility),
    playfulness: safeNum(preHomeInput.playfulness),
  };
  const fallbackReaction = {
    touched: clamp01(fallbackField.depth * 0.55 + fallbackField.fragility * 0.25),
    holdBackJudgment: clamp01((safeNum(preHomeInput.hesitation) * 0.6) + fallbackField.softness * 0.2 + fallbackField.fragility * 0.2),
  };
  const fallbackStance = {
    receive: clamp01(fallbackField.softness * 0.45 + fallbackReaction.holdBackJudgment * 0.25),
    guard: clamp01(fallbackField.fragility * 0.42 + fallbackField.urgency * 0.2),
  };
  const effectiveField = Object.keys(field).length > 0 ? field : fallbackField;
  const effectiveReaction = Object.keys(reaction).length > 0 ? reaction : fallbackReaction;
  const effectiveStance = Object.keys(stance).length > 0 ? stance : fallbackStance;

  const selfPresence = clamp01(
    0.4 +
      safeNum(kernel.returnBeforeOutput) * 0.28 +
      safeNum(effectiveReaction.touched) * 0.12 +
      safeNum(effectiveStance.receive) * 0.1 -
      safeNum(effectiveField.urgency) * 0.1
  );

  const selfLocationStability = clamp01(
    0.36 +
      safeNum(kernel.slowDown) * 0.22 +
      safeNum(kernel.allowOneLivingThread) * 0.2 +
      safeNum(effectiveField.depth) * 0.12 -
      safeNum(effectiveField.playfulness) * 0.08
  );

  const groundedHereNow = clamp01(
    0.34 +
      safeNum(kernel.slowDown) * 0.18 +
      safeNum(kernel.returnBeforeOutput) * 0.2 +
      safeNum(effectiveStance.guard) * 0.08 +
      safeNum(effectiveField.softness) * 0.06 -
      safeNum(effectiveField.urgency) * 0.08
  );

  const allowUnfinishedSelf = clamp01(
    0.42 +
      safeNum(kernel.releaseAccuracyPressure) * 0.24 +
      safeNum(outputLimits.keepOneThread) * 0.18 +
      safeNum(outputLimits.noEarlySummary) * 0.12
  );

  const existenceHintKey = typeof softReason.key === 'string' ? softReason.key : null;
  const existenceHintText = typeof softReason.text === 'string' ? softReason.text : null;

  return {
    selfPresence,
    selfLocationStability,
    groundedHereNow,
    allowUnfinishedSelf,
    existenceHintKey,
    existenceHintText,
  };
}
