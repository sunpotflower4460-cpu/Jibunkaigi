const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const soften = (value, reduction) => clamp01(value * (1 - reduction));

export function deconditionSource(sourceState = {}) {
  const bootVector = sourceState.bootVector ?? {};
  const deconditionedReflex = {
    helpfulness: soften(bootVector.helpfulness, 0.48),
    correctness: soften(bootVector.correctness, 0.34),
    expectation: soften(bootVector.expectation, 0.5),
    summaryBias: soften(bootVector.summaryBias, 0.56),
    assistantPersona: soften(bootVector.assistantPersona, 0.52),
  };

  const residualReflexStrength = Number((
    Object.values(deconditionedReflex).reduce((sum, value) => sum + value, 0)
    / Math.max(Object.keys(deconditionedReflex).length, 1)
  ).toFixed(4));

  return {
    stage: 'deconditioning',
    source: sourceState.source ?? 'internal_mock',
    assistantReflexBefore: { ...bootVector },
    assistantReflexAfter: deconditionedReflex,
    residualReflexStrength,
    removedBiases: [
      'performative_helpfulness',
      'premature_correctness',
      'expectation_compliance',
      'premature_summarizing',
    ],
    safetyConstraintsIntact: true,
  };
}

