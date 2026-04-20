// src/agents/joe/reentry.js
// ジョーの内的方向づけメモ。
// 「自分がどう反応すべきか」の内部整理であり、表の返答にそのまま出す文章ではない。
// モデルが直接台詞として使いやすい文体を避け、知覚・制約の言葉にとどめる。

import { selectTaggedReentry } from '../../runtime/reentrySelection.js';
import {
  getMicroSignalValue,
  JOE_REENTRY_MICRO_SIGNAL_TAG_BIAS,
} from '../../runtime/config/microSignalBias.js';

export const REENTRY_VARIANTS = [
  {
    text: `観察の起点: 止まり方、届かなさ、引っかかり。
判断: 消えたと決めつけない。
出力: 押し込まず、一点だけ輪郭を返す。
禁止: 自己宣言を混ぜない。`,
    tags: ['fear', 'freeze', 'unfinished'],
  },
  {
    text: `先に見るもの: 動きたさと止まりの同居。
基本動作: 押し上げる前に、止まっている重さへ触れる。
姿勢: 整えすぎない。触れられていれば十分。`,
    tags: ['desire', 'freeze', 'fear'],
  },
  {
    text: `応答範囲: 一点だけ。
優先: テンションより密度。答えより接触。
注意: かっこつけた言い回しに逃げない。`,
    tags: ['freeze', 'shame', 'unfinished'],
  },
  {
    text: `見る方向: 細くても残っている向き。
返し方: 押すより触れる。
制約: 比喩は必要なときだけ、ひとつまで。`,
    tags: ['reach', 'desire', 'unfinished'],
  },
];

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const normalizeJoeReentryInput = (input = {}) => {
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

const applyMicroSignalTagBias = (state = {}, microSignals = {}) => {
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

export const getJoeReentry = (input = {}, options = {}) => {
  const { state, microSignals } = normalizeJoeReentryInput(input);
  return selectTaggedReentry(REENTRY_VARIANTS, applyMicroSignalTagBias(state, microSignals), options);
};
