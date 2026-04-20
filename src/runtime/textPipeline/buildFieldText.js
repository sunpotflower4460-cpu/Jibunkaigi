// src/runtime/textPipeline/buildFieldText.js
// 第3章3-3の実装: field / stance / body の状態を日本語の情景描写として生成する
// 設計用語を一切含まない

import { AXIS_DESCRIPTIONS, STANCE_TEXT } from './axisDescriptions.js';

/**
 * field の雰囲気を描写する
 * @param {object} field - latentState.field
 * @returns {string}
 */
function describeFieldAtmosphere(field = {}) {
  const lines = [];

  // fragility: 場の壊れやすさ
  const fragility = field.fragility ?? 0;
  if (fragility > 0.7) {
    lines.push('場が、壊れやすい');
  } else if (fragility > 0.4) {
    lines.push('場に、少し脆さがある');
  }

  // softness: 場のやわらかさ
  const softness = field.softness ?? 0;
  if (softness > 0.6) {
    lines.push('空気がやわらかい');
  }

  // urgency: 急ぎの感覚
  const urgency = field.urgency ?? 0;
  if (urgency > 0.6) {
    lines.push('時間が迫っている');
  } else if (urgency > 0.3) {
    lines.push('少し急いでいる');
  }

  // depth: 深さ
  const depth = field.depth ?? 0;
  if (depth > 0.7) {
    lines.push('深い層に入っている');
  } else if (depth > 0.4) {
    lines.push('少し深く入ってもいい');
  }

  return lines.join('。');
}

/**
 * stance の重力・方向を描写する
 * @param {object} stance - latentState.stance
 * @returns {string}
 */
function describeStanceGravity(stance = {}) {
  const lines = [];

  // 上位2つの stance を取得
  const stances = Object.entries(stance)
    .filter(([, value]) => typeof value === 'number' && value > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  for (const [key, value] of stances) {
    if (STANCE_TEXT[key]) {
      // value の強さに応じて描写を変える
      if (value > 0.7) {
        lines.push(STANCE_TEXT[key].atmosphere);
      } else {
        lines.push(STANCE_TEXT[key].action);
      }
    }
  }

  return lines.join('。');
}

/**
 * body state の描写
 * @param {object} beliefCore - latentState.beliefCore
 * @returns {string}
 */
function describeBodyState(beliefCore = {}) {
  const dominantAxis = beliefCore.dominantBeliefAxis;
  if (dominantAxis && AXIS_DESCRIPTIONS[dominantAxis]) {
    const desc = AXIS_DESCRIPTIONS[dominantAxis];
    return desc.bodyState || '';
  }
  return '';
}

/**
 * field / stance / body の状態から「場の空気」を生成
 * @param {object} latentState - runInternalOS の出力
 * @returns {string} 日本語の情景描写
 */
export function buildFieldText(latentState = {}) {
  const field = latentState?.field || {};
  const stance = latentState?.stance || {};
  const beliefCore = latentState?.beliefCore || {};

  const lines = [];

  const atmosphere = describeFieldAtmosphere(field);
  if (atmosphere) {
    lines.push(atmosphere);
  }

  const gravity = describeStanceGravity(stance);
  if (gravity) {
    lines.push(gravity);
  }

  const body = describeBodyState(beliefCore);
  if (body) {
    lines.push(body);
  }

  return lines.filter(Boolean).join('。\n');
}
