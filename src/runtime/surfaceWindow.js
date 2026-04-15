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

export function buildSurfaceWindow(latentState = {}) {
  const field = latentState.field ?? {};
  const relationalField = latentState.relationalField ?? {};
  const stance = latentState.stance ?? {};
  const permission = latentState.permission ?? {};
  const gravityLabel = describeLevel(relationalField.gravity ?? 0, {
    high: 'dense',
    mid: 'present',
    low: 'light',
    min: 'plain',
  });
  const closenessLabel = describeLevel(relationalField.closeness ?? 0, {
    high: 'near',
    mid: 'approaching',
    low: 'cautious',
    min: 'distant',
  });
  const urgencyLabel = describeLevel(relationalField.urgency ?? 0, {
    high: 'pressing',
    mid: 'time-aware',
    low: 'unhurried',
    min: 'open',
  });

  const fieldLine = Object.keys(relationalField).length
    ? `Field: gravity ${gravityLabel}, closeness ${closenessLabel}, urgency ${urgencyLabel}.`
    : `Field: ${[
      describeLevel(field.softness ?? 0, { high: 'soft', mid: 'steady-soft', low: 'slightly soft', min: 'plain' }),
      describeLevel(field.depth ?? 0, { high: 'deep', mid: 'medium-deep', low: 'light-depth', min: 'surface-level' }),
      describeLevel(field.urgency ?? 0, { high: 'urgent', mid: 'time-sensitive', low: 'not rushed', min: 'not urgent' }),
    ].join(', ')}.`;

  const [firstStance = 'receive', secondStance = 'illuminate'] = topTwo(stance);
  const stanceLine = `Stance: ${firstStance} first, ${secondStance} second.`;

  const permissionFlags = [];
  if ((permission.noHurry ?? 0) >= 0.4) permissionFlags.push('do not rush');
  if ((permission.noOverExplain ?? 0) >= 0.4) permissionFlags.push('keep it light');
  if ((permission.noPerformativeHelpfulness ?? 0) >= 0.4) permissionFlags.push('skip performative fixing');
  if ((permission.allowPartialUncertainty ?? 0) >= 0.4) permissionFlags.push('leave room for uncertainty');

  const permissionLine = `Permission: ${(permissionFlags.slice(0, 2).join('; ')) || 'stay modest'}.`;
  const windowLines = [fieldLine, stanceLine, permissionLine];

  if ((relationalField.fragility ?? field.fragility ?? 0) >= 0.55) {
    windowLines.push('Note: handle the fragile edge gently.');
  }

  return windowLines;
}
