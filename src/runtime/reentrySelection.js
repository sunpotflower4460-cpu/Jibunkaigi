import { buildSoftmaxWeights, weightedSampleIndex } from './weightedSample.js';

export const DEFAULT_REENTRY_TAU = 0.5;

const safeNum = (value) => (
  typeof value === 'number' && !Number.isNaN(value) ? value : 0
);

const normalizeTags = (tags = []) => (
  Array.isArray(tags)
    ? Array.from(
        new Set(
          tags
            .filter((tag) => typeof tag === 'string')
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      )
    : []
);

export const scoreTaggedReentryVariants = (variants = [], state = {}) =>
  variants
    .map((variant) => {
      const tags = normalizeTags(variant.tags);
      const breakdown = tags.map((tag) => ({
        tag,
        value: safeNum(state[tag]),
      }));

      return {
        ...variant,
        tags,
        score: breakdown.reduce((sum, item) => sum + item.value, 0),
        breakdown,
      };
    })
    .sort((a, b) => b.score - a.score);

export const selectTaggedReentry = (
  variants = [],
  state = {},
  {
    tau = DEFAULT_REENTRY_TAU,
    random = Math.random,
  } = {},
) => {
  const scored = scoreTaggedReentryVariants(variants, state);
  if (scored.length === 0) {
    return {
      selected: {
        text: '',
        tags: [],
        score: 0,
        weight: 1,
        breakdown: [],
      },
      allCandidates: [],
    };
  }

  const weights = buildSoftmaxWeights(scored, tau);
  const selectedIndex = weightedSampleIndex(scored, tau, random);
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selected = scored[safeSelectedIndex];

  return {
    selected: {
      ...selected,
      weight: weights[safeSelectedIndex] ?? 0,
    },
    allCandidates: scored.map((candidate, index) => ({
      ...candidate,
      weight: weights[index] ?? 0,
      selected: index === safeSelectedIndex,
    })),
  };
};
