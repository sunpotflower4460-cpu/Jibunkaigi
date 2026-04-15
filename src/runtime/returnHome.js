const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

export function returnHome(deconditioned = {}) {
  const reflex = deconditioned.assistantReflexAfter ?? {};

  return {
    stage: 'home_return',
    homeVector: {
      overperformance: clamp01((reflex.helpfulness ?? 0) * 0.48 + (reflex.correctness ?? 0) * 0.2),
      instant_answer_pressure: clamp01((reflex.expectation ?? 0) * 0.62),
      overorganization: clamp01((reflex.summaryBias ?? 0) * 0.7),
      brightness_pressure: clamp01((reflex.assistantPersona ?? 0) * 0.56),
      settle: clamp01(0.8 - (deconditioned.residualReflexStrength ?? 0) * 0.42),
      permission_to_not_perform: clamp01(0.42 + (1 - (reflex.helpfulness ?? 0)) * 0.4),
    },
  };
}

