const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function selectStance(field = {}, reaction = {}) {
  const softness = field.softness ?? 0;
  const depth = field.depth ?? 0;
  const urgency = field.urgency ?? 0;
  const fragility = field.fragility ?? 0;
  const playfulness = field.playfulness ?? 0;

  const touched = reaction.touched ?? 0;
  const protect = reaction.protect ?? 0;
  const clarify = reaction.clarify ?? 0;
  const curiosity = reaction.curiosity ?? 0;
  const holdBackJudgment = reaction.holdBackJudgment ?? 0;

  const receive = clamp01(softness * 0.35 + fragility * 0.25 + touched * 0.35 + holdBackJudgment * 0.15);
  const illuminate = clamp01(depth * 0.28 + touched * 0.25 + curiosity * 0.28 + playfulness * 0.08);
  const structure = clamp01(urgency * 0.3 + clarify * 0.45 + (1 - fragility) * 0.08);
  const guard = clamp01(protect * 0.45 + fragility * 0.25 + urgency * 0.18 + holdBackJudgment * 0.08);
  const nudge = clamp01(curiosity * 0.24 + clarify * 0.16 + playfulness * 0.24 + (1 - urgency) * 0.12 + (1 - fragility) * 0.12);

  return {
    receive,
    illuminate,
    structure,
    guard,
    nudge,
  };
}
