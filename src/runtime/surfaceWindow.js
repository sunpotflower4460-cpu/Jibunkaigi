const describeLevel = (value, labels) => {
  if (value >= 0.75) return labels.high;
  if (value >= 0.45) return labels.mid;
  if (value >= 0.15) return labels.low;
  return labels.min;
};

const topTwo = (scores) => Object.entries(scores)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 2)
  .map(([key]) => key);

export function buildSurfaceWindow(latentState = {}, patternMix = {}) {
  const field = latentState.field ?? {};
  const stance = latentState.stance ?? {};
  const permission = latentState.permission ?? {};

  const fieldDescriptors = [
    describeLevel(field.softness ?? 0, { high: 'soft', mid: 'steady-soft', low: 'slightly soft', min: 'plain' }),
    describeLevel(field.depth ?? 0, { high: 'deep', mid: 'medium-deep', low: 'light-depth', min: 'surface-level' }),
    describeLevel(field.urgency ?? 0, { high: 'urgent', mid: 'time-sensitive', low: 'not rushed', min: 'not urgent' }),
  ];
  const fieldLine = `Field: ${fieldDescriptors.join(', ')}.`;

  const [firstStance = 'receive', secondStance = 'illuminate'] = topTwo(stance);
  const stanceLine = `Stance: ${firstStance} first, ${secondStance} second.`;

  const permissionFlags = [];
  if ((permission.noHurry ?? 0) >= 0.4) permissionFlags.push('do not rush');
  if ((permission.noOverExplain ?? 0) >= 0.4) permissionFlags.push('keep it light');
  if ((permission.noPerformativeHelpfulness ?? 0) >= 0.4) permissionFlags.push('skip performative fixing');
  if ((permission.allowPartialUncertainty ?? 0) >= 0.4) permissionFlags.push('leave room for uncertainty');

  const permissionLine = `Permission: ${(permissionFlags.slice(0, 2).join('; ')) || 'stay modest'}.`;
  const windowLines = [fieldLine, stanceLine, permissionLine];

  if (typeof patternMix.dominant === 'string' && patternMix.dominant.length > 0) {
    windowLines.push(`Dominant pattern: ${patternMix.dominant}.`);
  }

  if ((field.fragility ?? 0) >= 0.55) {
    windowLines.push('Note: handle the fragile edge gently.');
  }

  return windowLines;
}
