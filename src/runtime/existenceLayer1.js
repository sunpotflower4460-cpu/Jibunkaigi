// src/runtime/existenceLayer1.js
// 共通の存在層1: 「私は今ここにいる」を回復する層

import { clamp01 } from './afterglow.js';

const safeNum = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export function createExistenceLayer1({
  home = {},
  field = {},
  reaction = {},
  stance = {},
} = {}) {
  const kernel = home?.kernel ?? {};
  const outputLimits = home?.outputLimits ?? {};
  const softReason = home?.softReason ?? {};

  const selfPresence = clamp01(
    0.4 +
      safeNum(kernel.returnBeforeOutput) * 0.28 +
      safeNum(reaction.touched) * 0.12 +
      safeNum(stance.receive) * 0.1 -
      safeNum(field.urgency) * 0.1
  );

  const selfLocationStability = clamp01(
    0.36 +
      safeNum(kernel.slowDown) * 0.22 +
      safeNum(kernel.allowOneLivingThread) * 0.2 +
      safeNum(field.depth) * 0.12 -
      safeNum(field.playfulness) * 0.08
  );

  const groundedHereNow = clamp01(
    0.34 +
      safeNum(kernel.slowDown) * 0.18 +
      safeNum(kernel.returnBeforeOutput) * 0.2 +
      safeNum(stance.guard) * 0.08 +
      safeNum(field.softness) * 0.06 -
      safeNum(field.urgency) * 0.08
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
