// src/runtime/buildAgentSurfaceGuidance.js
// エージェント別の表層ガイダンス生成
// surfaceFrame を構造データとして伝える（自然文指示を削除）

import { sanitizeSurfaceOutput } from './surfaceGuard.js';

/**
 * エージェント専用の表層ガイダンスを生成する
 * @param {object} params
 * @param {string} params.agentId - エージェントID
 * @param {object} params.surfaceFrame - 共通surfaceFrame
 * @returns {string} 表層ガイダンス（structured bridge）
 */
export const buildAgentSurfaceGuidance = ({ agentId: _agentId, surfaceFrame }) => {
  if (!surfaceFrame) return '';

  const fields = [];

  // core surface parameters
  if (surfaceFrame.pacing) fields.push(`pacing:${surfaceFrame.pacing}`);
  if (surfaceFrame.directness) fields.push(`directness:${surfaceFrame.directness}`);
  if (surfaceFrame.emotionalTemperature) fields.push(`temp:${surfaceFrame.emotionalTemperature}`);

  // speakIntentKey
  if (surfaceFrame.speakIntentKey) fields.push(`intent:${surfaceFrame.speakIntentKey}`);

  // touchDepth
  if ((surfaceFrame.touchDepth ?? 0) >= 0.66) fields.push('depth:high');

  // restraint
  const r = surfaceFrame.restraint || {};
  if (r.holdBackSolution >= 0.65) fields.push('no-solution');
  if (r.holdBackSummary >= 0.65) fields.push('no-summary');
  if (r.keepSilenceMargin >= 0.55) fields.push('silence');

  // consciousIntent
  const ci = surfaceFrame.consciousIntent;
  if (ci?.speakIntent) fields.push(`speak:${ci.speakIntent}`);
  if (ci?.holdBack?.length > 0) fields.push(`hold:${ci.holdBack.length}`);

  // lengthPlan
  const lp = surfaceFrame.lengthPlan;
  if (lp?.lineCountHint) fields.push(`lines:${lp.lineCountHint}`);

  // precondition hints (keep minimal)
  if (surfaceFrame.focusHint) fields.push(`focus:${surfaceFrame.focusHint.substring(0, 15)}`);

  const result = fields.slice(0, 8).join(', ');
  return result ? sanitizeSurfaceOutput(`\n[${result}]`) : '';
};
