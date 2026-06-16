/**
 * Extract matchable attention signals from emergingField.
 * focusPoints are the primary Japanese-first attention mechanism;
 * attentionTargets remain as legacy fallback for compatibility.
 */

export const normalizeFocusPointSignals = (focusPoints = []) => {
  if (!Array.isArray(focusPoints)) return [];

  return focusPoints
    .map((point) => {
      if (!point) return '';
      if (typeof point === 'string') return point;
      return point.signal || '';
    })
    .map((value) => String(value).trim())
    .filter(Boolean);
};

export const getPrimaryAttentionSignals = (emergingField = {}) => {
  const focusSignals = normalizeFocusPointSignals(emergingField?.focusPoints);
  if (focusSignals.length > 0) return focusSignals;
  return Array.isArray(emergingField?.attentionTargets)
    ? emergingField.attentionTargets
    : [];
};
