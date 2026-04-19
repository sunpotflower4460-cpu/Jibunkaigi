// src/runtime/buildAgentInternalFrame.js
// エージェント別の内部フレーム生成
// internalOS を短ラベル中心で伝える（自然文削除）

import {
  selectTopScoredKeys,
  PERMISSION_ACTIVE_THRESHOLD,
  FRAGILITY_SOFT_HANDLING_THRESHOLD,
  MAX_INTERNAL_FRAME_LINES,
} from './buildPromptHelpers.js';

/**
 * エージェント専用の内部フレームを生成する
 * @param {object} params
 * @param {string} params.agentId - エージェントID
 * @param {object} params.internalOS - 共通internalOS
 * @param {object} params.estimatedState - 推定された状態
 * @returns {string} 内部フレーム（短ラベル列）
 */
export const buildAgentInternalFrame = ({ agentId: _agentId, internalOS, estimatedState: _estimatedState = {} }) => {
  const normalized = normalizeInternalOS(internalOS);
  const field = normalized.latentState.field ?? {};
  const stance = normalized.latentState.stance ?? {};
  const permission = normalized.latentState.permission ?? {};

  return buildUnifiedInternalFrame({ field, stance, permission });
};

const normalizeInternalOS = (internalOS) => ({
  latentState: internalOS?.latentState ?? {},
  surfaceWindow: Array.isArray(internalOS?.surfaceWindow) ? internalOS.surfaceWindow : [],
});

const buildUnifiedInternalFrame = ({ field, stance, permission }) => {
  const parts = [];

  // field
  const hasField = Object.values(field).some((v) => typeof v === 'number' && v > 0);
  if (hasField) {
    const fieldLabels = [];
    if (field.depth >= 0.66) fieldLabels.push('depth:high');
    else if (field.depth >= 0.33) fieldLabels.push('depth:mid');
    if (field.urgency >= 0.66) fieldLabels.push('urgency:high');
    else if (field.urgency >= 0.33) fieldLabels.push('urgency:mid');
    if (field.fragility >= FRAGILITY_SOFT_HANDLING_THRESHOLD) fieldLabels.push('fragile');
    if (fieldLabels.length > 0) parts.push(`field:[${fieldLabels.join(',')}]`);
  }

  // stance
  const topStances = selectTopScoredKeys(stance).slice(0, 2);
  if (topStances.length > 0) {
    parts.push(`stance:[${topStances.join(',')}]`);
  }

  // permission
  const permissionKeys = ['noHurry', 'noPerformativeHelpfulness', 'noOverExplain', 'allowPartialUncertainty'];
  const activePermissions = permissionKeys.filter((key) => (permission[key] ?? 0) >= PERMISSION_ACTIVE_THRESHOLD);
  if (activePermissions.length > 0) {
    parts.push(`permission:[${activePermissions.slice(0, 2).join(',')}]`);
  }

  return parts.slice(0, MAX_INTERNAL_FRAME_LINES).join('\n');
};
