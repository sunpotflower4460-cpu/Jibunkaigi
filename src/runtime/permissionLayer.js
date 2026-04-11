const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function createPermissionLayer({ field = {}, reaction = {}, stance = {} } = {}) {
  const softness = field.softness ?? 0;
  const depth = field.depth ?? 0;
  const urgency = field.urgency ?? 0;
  const fragility = field.fragility ?? 0;

  const protect = reaction.protect ?? 0;
  const clarify = reaction.clarify ?? 0;
  const holdBackJudgment = reaction.holdBackJudgment ?? 0;

  const receive = stance.receive ?? 0;
  const illuminate = stance.illuminate ?? 0;
  const structure = stance.structure ?? 0;

  const noHurry = clamp01(0.2 + softness * 0.2 + fragility * 0.24 + receive * 0.22 - urgency * 0.2);
  const noOverExplain = clamp01(0.18 + depth * 0.12 + holdBackJudgment * 0.22 + receive * 0.12 - structure * 0.14 - clarify * 0.1);
  const noPerformativeHelpfulness = clamp01(0.2 + protect * 0.22 + holdBackJudgment * 0.2 + illuminate * 0.08 - urgency * 0.08);
  const allowPartialUncertainty = clamp01(0.18 + depth * 0.14 + holdBackJudgment * 0.28 + fragility * 0.14 - structure * 0.08);

  return {
    noHurry,
    noOverExplain,
    noPerformativeHelpfulness,
    allowPartialUncertainty,
  };
}
