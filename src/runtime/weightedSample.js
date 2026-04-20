const MIN_TAU = 0.05;

const normalizeTau = (tau = 0.5) => {
  const safeTau = Number.isFinite(tau) ? tau : 0.5;
  return Math.max(safeTau, MIN_TAU);
};

const safeScore = (item) => (
  typeof item?.score === 'number' && !Number.isNaN(item.score) ? item.score : 0
);

export const buildSoftmaxWeights = (scored = [], tau = 0.5) => {
  if (!Array.isArray(scored) || scored.length === 0) return [];

  const safeTau = normalizeTau(tau);
  const maxScore = scored.reduce(
    (highest, item) => Math.max(highest, safeScore(item)),
    Number.NEGATIVE_INFINITY,
  );

  const rawWeights = scored.map((item) => Math.exp((safeScore(item) - maxScore) / safeTau));
  const total = rawWeights.reduce((sum, weight) => sum + weight, 0);

  if (!(total > 0)) {
    const uniformWeight = 1 / rawWeights.length;
    return rawWeights.map(() => uniformWeight);
  }

  return rawWeights.map((weight) => weight / total);
};

export const weightedSampleIndex = (scored = [], tau = 0.5, random = Math.random) => {
  if (!Array.isArray(scored) || scored.length === 0) return -1;

  const weights = buildSoftmaxWeights(scored, tau);
  const safeRandom = typeof random === 'function' ? random : Math.random;
  let threshold = safeRandom() * weights.reduce((sum, weight) => sum + weight, 0);

  for (let index = 0; index < weights.length; index += 1) {
    threshold -= weights[index];
    if (threshold <= 0) return index;
  }

  return weights.length - 1;
};

export const weightedSample = (scored = [], tau = 0.5, random = Math.random) => {
  const index = weightedSampleIndex(scored, tau, random);
  return index >= 0 ? scored[index] : null;
};
