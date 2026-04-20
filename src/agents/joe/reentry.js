// src/agents/joe/reentry.js
// ジョーの内的方向づけメモ。
// 「自分がどう反応すべきか」の内部整理であり、表の返答にそのまま出す文章ではない。
// モデルが直接台詞として使いやすい文体を避け、知覚・制約の言葉にとどめる。
//
// NOTE:
// Joe の runtime activation path の正本は composeJoeReentry(...)。
// このファイルの getJoeReentry(...) は、D-2 系の tagged selection を残す
// legacy / compatibility path としてのみ維持する。

import { selectTaggedReentry } from '../../runtime/reentrySelection.js';
import {
  getMicroSignalValue,
  JOE_REENTRY_MICRO_SIGNAL_TAG_BIAS,
} from '../../runtime/config/microSignalBias.js';
import { REENTRY_VARIANTS } from './reentryCorpus.js';

export const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

export const normalizeJoeReentryInput = (input = {}) => {
  if (input && typeof input === 'object' && 'state' in input) {
    return {
      state: input.state && typeof input.state === 'object' ? input.state : {},
      microSignals: input.microSignals && typeof input.microSignals === 'object' ? input.microSignals : {},
    };
  }

  return {
    state: input && typeof input === 'object' ? input : {},
    microSignals: {},
  };
};

export const applyMicroSignalTagBias = (state = {}, microSignals = {}) => {
  const derivedState = { ...state };

  Object.entries(JOE_REENTRY_MICRO_SIGNAL_TAG_BIAS).forEach(([signalKey, tagWeights]) => {
    const intensity = clamp01(getMicroSignalValue(microSignals, signalKey));
    if (intensity <= 0) return;

    Object.entries(tagWeights).forEach(([tag, weight]) => {
      derivedState[tag] = clamp01((derivedState[tag] ?? 0) + (intensity * (Number(weight) || 0)));
    });
  });

  return derivedState;
};

/**
 * Legacy compatibility path for D-2 tagged selection.
 *
 * @deprecated Use composeJoeReentry for Joe's canonical runtime activation path.
 */
export const getJoeReentry = (input = {}, options = {}) => {
  const { state, microSignals } = normalizeJoeReentryInput(input);
  return selectTaggedReentry(REENTRY_VARIANTS, applyMicroSignalTagBias(state, microSignals), options);
};
