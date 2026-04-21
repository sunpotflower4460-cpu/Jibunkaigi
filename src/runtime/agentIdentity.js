// src/runtime/agentIdentity.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Canonical agent id helper（修正指示書 v3 Phase 1）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ■ 目的：
//   UI 側で使われる id (creative / soul / strategist / empath / critic / master) と
//   reservoir / owner / activate 側で使われる canonical id (joe / ray / ken / mina / satou / mirror)
//   の間のズレを吸収する単一の helper を提供する。
//
// ■ 使い分け：
//   - UI 表示 / prompt ルーティング / 既存 agent switch は uiAgentId
//   - reservoir / owner match / relation / activate・bind・select の素材系は canonicalAgentId
//
// ■ 注意：
//   - 未知の id は正規化後そのまま返す（後段で validate する）
//   - 双方向対応表を持つが、どちらの id が渡されても canonical / ui どちらにも解決できる
//

export const UI_TO_CANONICAL_AGENT_ID = {
  creative: 'joe',
  soul: 'ray',
  strategist: 'ken',
  empath: 'mina',
  critic: 'satou',
  master: 'mirror',
};

export const CANONICAL_TO_UI_AGENT_ID = {
  joe: 'creative',
  ray: 'soul',
  ken: 'strategist',
  mina: 'empath',
  satou: 'critic',
  mirror: 'master',
};

/**
 * Set of canonical agent ids (for validation).
 */
export const CANONICAL_AGENT_IDS = Object.freeze(['joe', 'ray', 'ken', 'mina', 'satou', 'mirror']);

/**
 * Normalize an agent id string (lowercase + trim).
 * Returns '' for non-string input.
 * @param {unknown} agentId
 * @returns {string}
 */
export const normalizeAgentId = (agentId) => String(agentId || '').toLowerCase().trim();

/**
 * Convert any id (UI or canonical) to canonical agent id.
 * If the input is already canonical, it is returned as-is.
 * Unknown ids are returned in their normalized form (caller validates).
 * @param {unknown} agentId
 * @returns {string}
 */
export const toCanonicalAgentId = (agentId) => {
  const normalized = normalizeAgentId(agentId);
  if (!normalized) return '';
  if (UI_TO_CANONICAL_AGENT_ID[normalized]) return UI_TO_CANONICAL_AGENT_ID[normalized];
  return normalized;
};

/**
 * Convert any id (UI or canonical) to UI agent id.
 * If the input is already UI-side, it is returned as-is.
 * Unknown ids are returned in their normalized form.
 * @param {unknown} agentId
 * @returns {string}
 */
export const toUiAgentId = (agentId) => {
  const normalized = normalizeAgentId(agentId);
  if (!normalized) return '';
  if (CANONICAL_TO_UI_AGENT_ID[normalized]) return CANONICAL_TO_UI_AGENT_ID[normalized];
  return normalized;
};

/**
 * Whether `agentId` is a recognized canonical id.
 * @param {unknown} agentId
 * @returns {boolean}
 */
export const isCanonicalAgentId = (agentId) =>
  CANONICAL_AGENT_IDS.includes(normalizeAgentId(agentId));
