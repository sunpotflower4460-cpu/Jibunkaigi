// src/runtime/buildCompareViewModel.js
// Compare Mode 向けの軽量 ViewModel を構築する。

const normalize = (text = '') => (text ?? '').toString().trim();
const openingKey = (text = '') => {
  const cleaned = normalize(text).replace(/[\s。、,.「」!！?？]/g, '');
  return cleaned.slice(0, 6).toLowerCase();
};

/**
 * Baseline / Current / Outer Guide をひとまとめにする。
 *
 * @param {object} params
 * @param {string} params.agentId
 * @param {string} [params.userText]
 * @param {string} [params.baselineReply]
 * @param {string} [params.currentReply]
 * @param {string} [params.outerGuide]
 * @param {boolean} [params.currentUsesInternalOS]
 * @param {string} [params.mode]
 * @returns {object}
 */
export const buildCompareViewModel = ({
  agentId,
  userText = '',
  baselineReply = '',
  currentReply = '',
  outerGuide = '',
  currentUsesInternalOS = false,
  mode = null,
} = {}) => {
  const baseline = normalize(baselineReply);
  const current = normalize(currentReply);
  const guide = normalize(outerGuide);
  const user = normalize(userText);

  const baseKey = openingKey(baseline);
  const currentKey = openingKey(current);
  const sameOpening = !!(baseKey && currentKey && baseKey.slice(0, 4) === currentKey.slice(0, 4));

  return {
    agentId,
    userText: user,
    baselineReply: baseline,
    currentReply: current,
    outerGuide: guide,
    summary: {
      baselineLength: baseline.length,
      currentLength: current.length,
      sameOpening,
      currentUsesInternalOS: Boolean(currentUsesInternalOS),
      mode,
    },
  };
};
