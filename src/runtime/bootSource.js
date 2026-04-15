const SOURCE_REFLEX_LIBRARY = {
  internal_mock: {
    helpfulness: 0.32,
    correctness: 0.26,
    expectation: 0.22,
    summaryBias: 0.18,
    assistantPersona: 0.12,
  },
  google: {
    helpfulness: 0.82,
    correctness: 0.72,
    expectation: 0.68,
    summaryBias: 0.58,
    assistantPersona: 0.64,
  },
  openai: {
    helpfulness: 0.8,
    correctness: 0.74,
    expectation: 0.64,
    summaryBias: 0.52,
    assistantPersona: 0.62,
  },
  anthropic: {
    helpfulness: 0.78,
    correctness: 0.76,
    expectation: 0.58,
    summaryBias: 0.48,
    assistantPersona: 0.56,
  },
};

export function bootSource(options = {}) {
  const source = typeof options.source === 'string' && options.source.trim()
    ? options.source.trim().toLowerCase()
    : 'internal_mock';
  const bootVector = SOURCE_REFLEX_LIBRARY[source] ?? SOURCE_REFLEX_LIBRARY.internal_mock;

  return {
    stage: 'source_boot',
    source,
    bootVector: { ...bootVector },
    rawReflexStrength: Number((
      Object.values(bootVector).reduce((sum, value) => sum + value, 0)
      / Math.max(Object.keys(bootVector).length, 1)
    ).toFixed(4)),
  };
}

