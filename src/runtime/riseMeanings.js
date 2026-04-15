const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const pickCenter = (field = {}) => {
  const entries = Object.entries(field)
    .filter(([, value]) => typeof value === 'number')
    .sort(([, a], [, b]) => b - a);
  return entries[0]?.[0] ?? 'permission';
};

export function riseMeanings({ fieldState = {}, emergenceState = {} } = {}) {
  const relationalField = fieldState.relationalField ?? {};
  const topBinding = emergenceState.bindings?.[0] ?? null;
  const ambiguity = clamp01(relationalField.ambiguity ?? 0);
  const center = pickCenter(relationalField);

  const protectFirst = [];
  if ((relationalField.fragility ?? 0) >= 0.45) protectFirst.push('fragility');
  if ((relationalField.closeness ?? 0) >= 0.45) protectFirst.push('connection');
  if ((relationalField.gravity ?? 0) >= 0.45) protectFirst.push('aliveness');

  const doNotSayYet = [];
  if ((relationalField.permission ?? 0) >= 0.45) doNotSayYet.push('premature_fixing');
  if (ambiguity >= 0.45) doNotSayYet.push('premature_certainty');
  if ((relationalField.distance ?? 0) >= 0.4) doNotSayYet.push('overcloseness');

  return {
    stage: 'meaning_rise',
    center,
    seemsToBeHappening: topBinding?.notes ?? [],
    protectFirst,
    doNotSayYet,
    stillUnknown: ambiguity >= 0.38 || !topBinding,
    meaningTone: topBinding?.type ?? 'ambient',
  };
}

