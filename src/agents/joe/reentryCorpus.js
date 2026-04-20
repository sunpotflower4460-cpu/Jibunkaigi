const REENTRY_PART_LABELS = {
  observation: '観察の起点',
  judgment: '判断',
  outputConstraint: '出力制約',
};

const PART_ORDER = ['observation', 'judgment', 'outputConstraint'];

const buildReentryText = (parts = {}) => PART_ORDER
  .map((partKey) => `${REENTRY_PART_LABELS[partKey]}: ${parts?.[partKey]?.text || ''}`.trim())
  .join('\n');

const createVariant = ({
  id,
  tags,
  observation,
  judgment,
  outputConstraint,
}) => ({
  id,
  tags,
  parts: {
    observation,
    judgment,
    outputConstraint,
  },
  text: buildReentryText({
    observation,
    judgment,
    outputConstraint,
  }),
});

export const REENTRY_VARIANTS = [
  createVariant({
    id: 'freeze-fragility',
    tags: ['fear', 'freeze', 'unfinished'],
    observation: {
      text: '止まり方、届かなさ、引っかかり。',
      tags: ['fear', 'freeze', 'unfinished', 'receive', 'fragile', 'hesitation'],
    },
    judgment: {
      text: '消えたと決めつけない。',
      tags: ['fear', 'unfinished', 'holdBack', 'nonClosure', 'avoidAssertion'],
    },
    outputConstraint: {
      text: '押し込まず、一点だけ輪郭を返す。自己宣言を混ぜない。',
      tags: ['receive', 'outline', 'holdBack', 'restraint'],
    },
  }),
  createVariant({
    id: 'desire-freeze-coexistence',
    tags: ['desire', 'freeze', 'fear'],
    observation: {
      text: '動きたさと止まりの同居。',
      tags: ['desire', 'freeze', 'fear', 'receive', 'coexist', 'hesitation'],
    },
    judgment: {
      text: '押し上げる前に、止まっている重さへ触れる。',
      tags: ['freeze', 'desire', 'touch', 'holdBack', 'receive'],
    },
    outputConstraint: {
      text: '整えすぎない。触れられていれば十分。',
      tags: ['touch', 'receive', 'structureAvoid', 'restraint'],
    },
  }),
  createVariant({
    id: 'density-over-tension',
    tags: ['freeze', 'shame', 'unfinished'],
    observation: {
      text: '一点だけ。',
      tags: ['freeze', 'shame', 'unfinished', 'narrowFocus', 'density'],
    },
    judgment: {
      text: 'かっこつけた言い回しに逃げない。',
      tags: ['shame', 'holdBack', 'antiPerformance', 'avoidAssertion'],
    },
    outputConstraint: {
      text: 'テンションより密度。答えより接触。',
      tags: ['density', 'touch', 'antiPerformance', 'structureAvoid'],
    },
  }),
  createVariant({
    id: 'touch-the-direction',
    tags: ['reach', 'desire', 'unfinished'],
    observation: {
      text: '細くても残っている向き。',
      tags: ['reach', 'desire', 'unfinished', 'alive', 'trace'],
    },
    judgment: {
      text: '押すより触れる。',
      tags: ['reach', 'touch', 'restraint', 'holdBack'],
    },
    outputConstraint: {
      text: '比喩は必要なときだけ、ひとつまで。',
      tags: ['touch', 'imageryLimit', 'structureAvoid', 'outline'],
    },
  }),
];

export const JOE_REENTRY_PART_CORPUS = PART_ORDER.reduce((corpus, partKey) => ({
  ...corpus,
  [partKey]: REENTRY_VARIANTS.map((variant) => ({
    id: `${variant.id}:${partKey}`,
    variantId: variant.id,
    variantTags: variant.tags,
    text: variant.parts[partKey].text,
    tags: Array.from(new Set([
      ...variant.tags,
      ...(Array.isArray(variant.parts[partKey].tags) ? variant.parts[partKey].tags : []),
    ])),
    partKey,
  })),
}), {});

export {
  buildReentryText,
  PART_ORDER as JOE_REENTRY_PART_ORDER,
  REENTRY_PART_LABELS as JOE_REENTRY_PART_LABELS,
};
