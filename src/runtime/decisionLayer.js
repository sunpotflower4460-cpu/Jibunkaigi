/**
 * decisionLayer.js
 * Decision Layer: Bridge / Adapter position (Surface v0.2 update)
 *
 * ARCHITECTURAL ROLE CHANGE (Surface v0.2):
 * Previously: Primary decision maker for surface generation
 * Now: Bridge / Adapter layer that connects precondition layers to conscious intent
 *
 * The main surface planning responsibility has moved to:
 * - buildConsciousIntent (Phase 7)
 * - buildLengthPlan (Phase 7)
 * - buildSurfacePlan (Surface v0.2)
 *
 * This layer still provides:
 * - feltSense (emotional/tension state)
 * - intention (speak intent, touch depth, focus target)
 * - restraint (holdBack levels)
 *
 * But these are now inputs to surfacePlan, not the final surface decision.
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const getStrongestTension = (beliefTension = {}) => {
  const tensions = Array.isArray(beliefTension?.activeTensions) ? beliefTension.activeTensions : [];
  return tensions.reduce(
    (best, entry) => ((entry?.strength ?? 0) > (best?.strength ?? -1) ? entry : best),
    null
  );
};

const pickSecondaryFeeling = (primaryFeeling, dominantBeliefAxis, identityAxis) => {
  if (primaryFeeling === 'protective-pull') return 'soft-holding';
  if (dominantBeliefAxis === 'structure') return 'structural-friction';
  if (dominantBeliefAxis === 'presence' || dominantBeliefAxis === 'holding') return 'soft-holding';
  if (dominantBeliefAxis === 'illumination' || identityAxis === 'illumination') {
    return 'quiet-recognition';
  }
  if (dominantBeliefAxis === 'preverbal' || dominantBeliefAxis === 'reflection') {
    return 'unresolved-weight';
  }
  return null;
};

const decideFeeling = ({
  strongestTension,
  dominantBeliefAxis,
  identityAxis,
  focusBias,
  returnBias,
  antiEarlySolution,
}) => {
  if (strongestTension?.tensionType === 'protection') return 'soft-holding';
  if (strongestTension?.tensionType === 'pull' && strongestTension?.strength >= 0.35) {
    return 'protective-pull';
  }
  if (strongestTension?.tensionType === 'friction') return 'structural-friction';
  if (strongestTension?.tensionType === 'violation') return 'unresolved-weight';
  if (dominantBeliefAxis === 'illumination' || identityAxis === 'illumination') {
    return 'quiet-recognition';
  }
  if (dominantBeliefAxis === 'structure') return 'structural-friction';
  if (dominantBeliefAxis === 'presence' || dominantBeliefAxis === 'holding') return 'soft-holding';
  if (focusBias >= 0.55 || returnBias >= 0.55 || antiEarlySolution >= 0.6) {
    return 'quiet-recognition';
  }
  return null;
};

const buildIntentionFromFeeling = ({
  primaryFeeling,
  strongestTension,
  dominantBeliefAxis,
  focusBias,
  returnBias,
  antiEarlySummary,
  antiEarlySolution,
}) => {
  if (strongestTension?.tensionType === 'pull' || primaryFeeling === 'protective-pull') {
    return {
      speakIntentKey: 'touch_living_thread',
      speakIntentText: 'まだ切れていない一点に触れたい',
      touchDepth: clamp01(0.52 + focusBias * 0.2 + strongestTension.strength * 0.2),
      focusTarget: 'faint-thread',
    };
  }

  if (strongestTension?.tensionType === 'protection' || primaryFeeling === 'soft-holding') {
    return {
      speakIntentKey: 'make_room_before_move',
      speakIntentText: '動かす前に置ける余白をつくりたい',
      touchDepth: clamp01(0.42 + returnBias * 0.2 + antiEarlySolution * 0.15),
      focusTarget: 'fragile-edge',
    };
  }

  if (
    strongestTension?.tensionType === 'friction' ||
    primaryFeeling === 'structural-friction' ||
    dominantBeliefAxis === 'structure'
  ) {
    return {
      speakIntentKey: 'name_hidden_knot',
      speakIntentText: 'まだほどけていない結び目を短く言いたい',
      touchDepth: clamp01(0.5 + focusBias * 0.12 + antiEarlySummary * 0.16),
      focusTarget: 'hidden-knot',
    };
  }

  if (dominantBeliefAxis === 'preverbal' || dominantBeliefAxis === 'reflection') {
    return {
      speakIntentKey: 'stay_with_preverbal',
      speakIntentText: 'まだ言い切れない手前にとどまりたい',
      touchDepth: clamp01(0.46 + returnBias * 0.14 + antiEarlySummary * 0.2),
      focusTarget: 'preverbal-edge',
    };
  }

  if (antiEarlySummary >= 0.6 || antiEarlySolution >= 0.6) {
    return {
      speakIntentKey: 'reflect_unclosed_weight',
      speakIntentText: 'まだ閉じていない重さを映したい',
      touchDepth: clamp01(0.44 + returnBias * 0.16 + antiEarlySummary * 0.12),
      focusTarget: 'unclosed-weight',
    };
  }

  return {
    speakIntentKey: 'return_to_ground',
    speakIntentText: 'まず今ここに戻る言葉を置きたい',
    touchDepth: clamp01(0.32 + returnBias * 0.18),
    focusTarget: 'here-now',
  };
};

export function createDecisionLayer({
  preconditionFilter = {},
  preconditionBias = {},
  beliefTension = {},
  reaction = {},
  stance = {},
} = {}) {
  const derived = preconditionFilter?.derived ?? {};
  const home = preconditionFilter?.home ?? {};
  const meaning = preconditionBias?.meaning ?? {};
  const focus = preconditionBias?.focus ?? {};
  const pacing = preconditionBias?.pacing ?? {};
  const strongestTension = getStrongestTension(beliefTension);
  const identityAxis = derived.identityAxis ?? null;
  const dominantBeliefAxis = meaning.dominantBeliefAxis ?? derived.dominantBeliefAxis ?? null;
  const focusBias = clamp01(focus.oneThreadBias);
  const returnBias = clamp01(pacing.returnBias);
  const antiEarlySummary = clamp01(meaning.antiEarlySummary);
  const antiEarlySolution = clamp01(meaning.antiEarlySolution);
  const tensionStrength = clamp01(
    strongestTension?.strength ??
      ((beliefTension?.totalTensionStrength ?? 0) > 0
        ? Math.min(1, beliefTension.totalTensionStrength / 2)
        : 0)
  );

  const primaryFeeling = decideFeeling({
    strongestTension,
    dominantBeliefAxis,
    identityAxis,
    focusBias,
    returnBias,
    antiEarlySolution,
  });
  const secondaryFeeling = pickSecondaryFeeling(primaryFeeling, dominantBeliefAxis, identityAxis);

  const intention = buildIntentionFromFeeling({
    primaryFeeling,
    strongestTension,
    dominantBeliefAxis,
    focusBias,
    returnBias,
    antiEarlySummary,
    antiEarlySolution,
  });

  const reactionProtect = clamp01(reaction?.protect);
  const stanceReceive = clamp01(stance?.receive);
  const keepOneThread = clamp01(home?.outputLimits?.keepOneThread);

  return {
    feltSense: {
      primaryFeeling,
      secondaryFeeling,
      tensionType: strongestTension?.tensionType ?? null,
      tensionStrength,
    },
    intention,
    restraint: {
      holdBackSummary: clamp01(Math.max(home?.outputLimits?.noEarlySummary ?? 0, antiEarlySummary)),
      holdBackSolution: clamp01(Math.max(home?.outputLimits?.noEarlySolution ?? 0, antiEarlySolution)),
      holdBackExpansion: clamp01(
        Math.max(home?.outputLimits?.noOverExpansion ?? 0, focus?.antiOverExpansion ?? 0)
      ),
      keepSilenceMargin: clamp01(
        keepOneThread * 0.3 +
          returnBias * 0.3 +
          stanceReceive * 0.2 +
          reactionProtect * 0.2
      ),
    },
    decisionMeta: {
      identityAxis,
      dominantBeliefAxis,
      delegatedBy: 'self',
    },
  };
}

export function buildDecisionPreviews(decision = {}) {
  const feltSense = decision?.feltSense ?? {};
  const intention = decision?.intention ?? {};
  const restraint = decision?.restraint ?? {};
  const decisionMeta = decision?.decisionMeta ?? {};
  const restraintFlags = [];

  if (clamp01(restraint.holdBackSolution) >= 0.65) restraintFlags.push('no-solution');
  if (clamp01(restraint.holdBackSummary) >= 0.65) restraintFlags.push('no-summary');
  if (clamp01(restraint.holdBackExpansion) >= 0.65) restraintFlags.push('no-expansion');
  if (clamp01(restraint.keepSilenceMargin) >= 0.55) restraintFlags.push('keep-silence');

  return {
    feltSensePreview: {
      summary:
        feltSense.primaryFeeling || feltSense.tensionType
          ? `${feltSense.primaryFeeling ?? 'none'} / tension=${clamp01(feltSense.tensionStrength).toFixed(2)}`
          : 'none / tension=0.00',
      primaryFeeling: feltSense.primaryFeeling ?? null,
      secondaryFeeling: feltSense.secondaryFeeling ?? null,
      tensionType: feltSense.tensionType ?? null,
      tensionStrength: clamp01(feltSense.tensionStrength),
    },
    speakIntentPreview: {
      summary: intention.speakIntentKey ?? 'none',
      speakIntentKey: intention.speakIntentKey ?? null,
      speakIntentText: intention.speakIntentText ?? null,
      touchDepth: clamp01(intention.touchDepth),
      focusTarget: intention.focusTarget ?? null,
    },
    restraintPreview: {
      summary: restraintFlags.join(' / ') || 'open',
      holdBackSummary: clamp01(restraint.holdBackSummary),
      holdBackSolution: clamp01(restraint.holdBackSolution),
      holdBackExpansion: clamp01(restraint.holdBackExpansion),
      keepSilenceMargin: clamp01(restraint.keepSilenceMargin),
    },
    decisionMetaPreview: {
      summary: `${decisionMeta.delegatedBy ?? 'none'} / axis=${decisionMeta.identityAxis ?? 'none'}`,
      identityAxis: decisionMeta.identityAxis ?? null,
      dominantBeliefAxis: decisionMeta.dominantBeliefAxis ?? null,
      delegatedBy: decisionMeta.delegatedBy ?? null,
    },
  };
}
