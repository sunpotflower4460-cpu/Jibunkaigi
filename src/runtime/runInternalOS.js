import { estimateField } from './fieldEstimator.js';
import { createInitialInternalState } from './internalState.js';
import { createHomeLayer, extractPermissionShape } from './homeLayer.js';
import { computeHomeNeutralizationState, applyHomeRetry, buildHomeNeutralizationPreview } from './homeNeutralizationCheck.js';
import { generateReaction } from './reactionGenerator.js';
import { mixLatentPatterns } from './routerMixer.js';
import { selectStance } from './stanceSelector.js';
import { buildSurfaceWindow } from './surfaceWindow.js';
import { blendLatentState, normalizeLatentState } from './afterglow.js';
import { createExistenceLayer1 } from './existenceLayer1.js';
import { createExistenceLayer2 } from './existenceLayer2.js';
import { createBeliefLayers } from './beliefLayers.js';
import { createBeliefCoreLayer } from './beliefCoreLayer.js';
import { createBeliefBranchLayer } from './beliefBranchLayer.js';
import { createBeliefLeafLayer } from './beliefLeafLayer.js';
import { createMakerSeed } from '../agents/shared/makerSeed.js';
import { buildPreconditionFilter } from './buildPreconditionFilter.js';
import { buildPreconditionBias, buildPreconditionBiasPreview } from './buildPreconditionBias.js';
import { createBeliefTensionLayer } from './beliefTensionLayer.js';
import { buildDecisionPreviews, createDecisionLayer } from './decisionLayer.js';
import { activateThoughts } from './activateThoughts.js';
import { activateFeelings } from './activateFeelings.js';
import { activateMoves } from './activateMoves.js';
import { bindThoughts } from './bindThoughts.js';
import { bindMixedNodes } from './bindMixedNodes.js';
import { selectThoughtClusters } from './selectThoughtClusters.js';
import { selectMixedClusters } from './selectMixedClusters.js';
import { buildConsciousIntent, formatConsciousIntentForDebug } from './buildConsciousIntent.js';
import { buildLengthPlan, formatLengthPlanForDebug } from './buildLengthPlan.js';
import { buildSurfacePlan, formatSurfacePlanForDebug } from './buildSurfacePlan.js';
import { buildFinalDecisionSubstrate, formatFinalDecisionSubstrateForDebug } from './buildFinalDecisionSubstrate.js';
import { estimateMicroSignals } from './estimateMicroSignals.js';
import { estimateState } from './stateEstimate.js';
import { buildFusedState } from './fusedState.js';
import { buildProtoMeaning } from './protoMeaning.js';
import { radialCondensation } from './attention/radialCondensation.js';
import { buildBodySignals } from './textPipeline/buildBodySignals.js';
import {
  getMicroSignalValue,
  MICRO_SIGNAL_BIAS_MAP,
  MICRO_SIGNAL_BIAS_MAX_DELTA,
  MICRO_SIGNAL_TUNING_DEBUG_CONFIG,
} from './config/microSignalBias.js';
import { getNodeRelations } from '../reservoir/loadReservoir.js';
import { TraceStage } from './trace/agentTraceBuilder.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const clampSignedDelta = (value) => Math.max(
  -MICRO_SIGNAL_BIAS_MAX_DELTA,
  Math.min(MICRO_SIGNAL_BIAS_MAX_DELTA, Number(value) || 0),
);

const mergeSignals = (base = {}, delta = {}) => {
  const keys = new Set([...Object.keys(base), ...Object.keys(delta)]);
  return Object.fromEntries(
    [...keys].map((key) => [key, clamp01((base[key] ?? 0) + (delta[key] ?? 0))])
  );
};

/**
 * belief axis ごとの軽い reaction delta を返す。
 * 数値は base reaction を置き換えず、重心だけ少し寄せるための微調整量。
 *
 * @param {string | null} axis
 * @returns {Record<string, number>}
 */
const getAxisReactionDelta = (axis) => {
  switch (axis) {
    case 'illumination':
      return { touched: 0.12, curiosity: 0.15 };
    case 'structure':
      return { clarify: 0.2, holdBackJudgment: 0.05 };
    case 'holding':
    case 'presence':
      return { protect: 0.16, holdBackJudgment: 0.15 };
    case 'tenderness':
      return { protect: 0.18, holdBackJudgment: 0.16 };
    case 'grounding':
      return { protect: 0.14, touched: 0.08 };
    case 'reflection':
    case 'preverbal':
    case 'resonance':
      return { touched: 0.12, holdBackJudgment: 0.14 };
    case 'mission':
      return { clarify: 0.1, curiosity: 0.09 };
    case 'realism':
      return { clarify: 0.18, protect: 0.08 };
    default:
      return {};
  }
};

/**
 * belief axis ごとの軽い stance delta を返す。
 * 反応から立った stance を壊さず、見る方向だけを少し寄せる。
 *
 * @param {string | null} axis
 * @returns {Record<string, number>}
 */
const getAxisStanceDelta = (axis) => {
  switch (axis) {
    case 'illumination':
      return { illuminate: 0.24, nudge: 0.08 };
    case 'structure':
      return { structure: 0.22, guard: 0.06 };
    case 'holding':
    case 'presence':
      return { receive: 0.18, guard: 0.16 };
    case 'tenderness':
      return { receive: 0.24, guard: 0.12 };
    case 'grounding':
      return { guard: 0.18, structure: 0.1 };
    case 'reflection':
    case 'preverbal':
    case 'resonance':
      return { receive: 0.18, illuminate: 0.12 };
    case 'mission':
      return { illuminate: 0.1, structure: 0.1 };
    case 'realism':
      return { structure: 0.2, guard: 0.08 };
    default:
      return {};
  }
};

const getAxisFieldDelta = (axis) => {
  switch (axis) {
    case 'illumination':
      return { softness: 0.05, depth: 0.09 };
    case 'structure':
      return { softness: -0.05, depth: 0.12 };
    case 'holding':
      return { softness: 0.11, fragility: 0.08 };
    case 'presence':
      return { softness: 0.08, depth: 0.06 };
    case 'tenderness':
      return { softness: 0.14, fragility: 0.09 };
    case 'grounding':
      return { softness: -0.02, depth: 0.08, urgency: 0.03 };
    case 'reflection':
    case 'preverbal':
    case 'resonance':
      return { softness: 0.06, depth: 0.08 };
    case 'mission':
      return { depth: 0.07, urgency: 0.04 };
    case 'realism':
      return { softness: -0.08, depth: 0.1, urgency: 0.05 };
    default:
      return {};
  }
};

const buildMicroSignalLayerDelta = (layerKey, microSignals = {}) => {
  const delta = {};
  const bySignal = {};

  Object.entries(MICRO_SIGNAL_BIAS_MAP).forEach(([signalKey, config]) => {
    const layerMapping = config?.layers?.[layerKey];
    if (!layerMapping || typeof layerMapping !== 'object') return;

    const intensity = clamp01(getMicroSignalValue(microSignals, signalKey));
    if (intensity <= 0) return;

    const axes = {};
    Object.entries(layerMapping).forEach(([axis, weight]) => {
      const axisDelta = clampSignedDelta(intensity * (Number(weight) || 0));
      if (axisDelta === 0) return;
      axes[axis] = axisDelta;
      delta[axis] = clampSignedDelta((delta[axis] ?? 0) + axisDelta);
    });

    if (Object.keys(axes).length > 0) {
      bySignal[signalKey] = {
        intensity,
        axes,
      };
    }
  });

  return { delta, bySignal };
};

const buildMicroSignalBiasDebugLayer = (axes = [], baseLayer = {}, deltaLayer = {}, finalLayer = {}) => ({
  axes: Object.fromEntries(
    axes.map((axis) => [
      axis,
      {
        base: clamp01(baseLayer[axis] ?? 0),
        delta: clampSignedDelta(deltaLayer[axis] ?? 0),
        final: clamp01(finalLayer[axis] ?? 0),
      },
    ]),
  ),
});

const buildMicroSignalBiasDebug = ({
  baseField = {},
  field = {},
  baseReaction = {},
  reaction = {},
  baseStance = {},
  stance = {},
  microSignals = {},
} = {}) => {
  const fieldDelta = buildMicroSignalLayerDelta('field', microSignals);
  const reactionDelta = buildMicroSignalLayerDelta('reaction', microSignals);
  const stanceDelta = buildMicroSignalLayerDelta('stance', microSignals);

  return {
    maxDelta: MICRO_SIGNAL_BIAS_MAX_DELTA,
    config: MICRO_SIGNAL_TUNING_DEBUG_CONFIG.bias,
    field: {
      ...buildMicroSignalBiasDebugLayer(
        ['softness', 'depth', 'urgency', 'fragility', 'playfulness'],
        baseField,
        fieldDelta.delta,
        field,
      ),
      bySignal: fieldDelta.bySignal,
    },
    reaction: {
      ...buildMicroSignalBiasDebugLayer(
        ['touched', 'protect', 'clarify', 'curiosity', 'holdBackJudgment'],
        baseReaction,
        reactionDelta.delta,
        reaction,
      ),
      bySignal: reactionDelta.bySignal,
    },
    stance: {
      ...buildMicroSignalBiasDebugLayer(
        ['receive', 'illuminate', 'structure', 'guard', 'nudge'],
        baseStance,
        stanceDelta.delta,
        stance,
      ),
      bySignal: stanceDelta.bySignal,
    },
  };
};

/**
 * preconditionBias を reaction に混ぜる。
 * Home の急がなさ、Existence の存在感、Belief の軸を足し引きして
 * 即応・即断・演技っぽさを少し弱める。
 *
 * @param {object} reaction
 * @param {object} preconditionBias
 * @param {object} microSignals
 * @returns {object}
 */
const applyReactionBias = (reaction = {}, preconditionBias = {}, microSignals = {}) => {
  const bias = preconditionBias?.preconditionBias ?? preconditionBias;
  const rawLatent = preconditionBias?.rawLatent ?? {};
  const preconditionFilter = preconditionBias?.preconditionFilter ?? {};
  const pacing = bias?.pacing ?? {};
  const focus = bias?.focus ?? {};
  const meaning = bias?.meaning ?? {};
  const identity = bias?.identity ?? {};
  const tensionStrength = clamp01(rawLatent?.beliefTension?.totalTensionStrength ?? 0);
  const latentHome = rawLatent?.home ?? {};
  const latentExistence1 = rawLatent?.existence1 ?? {};
  const latentBelief = preconditionFilter?.belief ?? {};
  const microSignalDelta = buildMicroSignalLayerDelta('reaction', microSignals).delta;
  const identityPresenceBias = clamp01(
    (identity.selfPresence ?? 0) * 0.35 +
    (identity.hereNowStability ?? 0) * 0.25 +
    (identity.selfRememberingStrength ?? 0) * 0.4
  );

  return mergeSignals(reaction, {
    touched:
      (pacing.slowDown ?? 0) * 0.12 +
      (pacing.returnBias ?? 0) * 0.12 +
      identityPresenceBias * 0.1 +
      (latentExistence1.selfPresence ?? 0) * 0.06 +
      tensionStrength * 0.08 +
      (identity.firstPersonSoftness ?? 0) * 0.06 +
      (microSignalDelta.touched ?? 0) +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).touched ?? 0),
    protect:
      (pacing.returnBias ?? 0) * 0.12 +
      (identity.hereNowStability ?? 0) * 0.08 +
      (identity.selfPresence ?? 0) * 0.06 +
      (latentHome.kernel?.returnBeforeOutput ?? 0) * 0.06 +
      tensionStrength * 0.05 +
      (microSignalDelta.protect ?? 0) +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).protect ?? 0),
    clarify:
      -((pacing.slowDown ?? 0) * 0.08) -
      ((meaning.antiEarlySolution ?? 0) * 0.06) -
      ((latentHome.outputLimits?.noEarlySolution ?? 0) * 0.04) -
      ((meaning.antiEarlySummary ?? 0) * 0.02) +
      (microSignalDelta.clarify ?? 0) +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).clarify ?? 0),
    curiosity:
      -((focus.oneThreadBias ?? 0) * 0.03) -
      ((focus.antiOverExpansion ?? 0) * 0.04) +
      ((latentBelief.activeLeafBeliefs?.length ?? 0) > 0 ? 0.02 : 0) +
      (microSignalDelta.curiosity ?? 0) +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).curiosity ?? 0),
    holdBackJudgment:
      (pacing.slowDown ?? 0) * 0.2 +
      (pacing.returnBias ?? 0) * 0.18 +
      (identity.unfinishedAllowed ?? 0) * 0.16 +
      (latentExistence1.unfinishedAllowed ?? 0) * 0.1 +
      (identity.firstPersonSoftness ?? 0) * 0.1 +
      identityPresenceBias * 0.08 +
      (microSignalDelta.holdBackJudgment ?? 0) +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).holdBackJudgment ?? 0),
  });
};

/**
 * reaction から立った stance に対して、preconditionBias 由来の軽い寄せを足す。
 * 一点性・意味軸・存在感を重心として加えるだけで、既存 stance を全廃しない。
 *
 * @param {object} stance
 * @param {object} preconditionBias
 * @param {object} microSignals
 * @returns {object}
 */
const applyStanceBias = (stance = {}, preconditionBias = {}, microSignals = {}) => {
  const bias = preconditionBias?.preconditionBias ?? preconditionBias;
  const rawLatent = preconditionBias?.rawLatent ?? {};
  const pacing = bias?.pacing ?? {};
  const focus = bias?.focus ?? {};
  const meaning = bias?.meaning ?? {};
  const identity = bias?.identity ?? {};
  const tensionStrength = clamp01(rawLatent?.beliefTension?.totalTensionStrength ?? 0);
  const latentExistence1 = rawLatent?.existence1 ?? {};
  const latentHome = rawLatent?.home ?? {};
  const microSignalDelta = buildMicroSignalLayerDelta('stance', microSignals).delta;
  const identityPresenceBias = clamp01(
    (identity.selfPresence ?? 0) * 0.3 +
    (identity.hereNowStability ?? 0) * 0.25 +
    (identity.selfRememberingStrength ?? 0) * 0.45
  );

  return mergeSignals(stance, {
    receive:
      (pacing.slowDown ?? 0) * 0.18 +
      (pacing.returnBias ?? 0) * 0.14 +
      identityPresenceBias * 0.12 +
      (latentExistence1.firstPersonSoftness ?? 0) * 0.06 +
      (microSignalDelta.receive ?? 0) +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).receive ?? 0),
    illuminate:
      (microSignalDelta.illuminate ?? 0) +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).illuminate ?? 0) +
      (identity.selfRememberingStrength ?? 0) * 0.06 +
      tensionStrength * 0.06,
    structure:
      -((pacing.slowDown ?? 0) * 0.16) -
      ((meaning.antiEarlySummary ?? 0) * 0.12) -
      ((latentHome.outputLimits?.noEarlySummary ?? 0) * 0.06) -
      ((meaning.antiEarlySolution ?? 0) * 0.12) +
      (microSignalDelta.structure ?? 0) +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).structure ?? 0),
    guard:
      (focus.antiOverExpansion ?? 0) * 0.1 +
      identityPresenceBias * 0.08 +
      tensionStrength * 0.08 +
      (microSignalDelta.guard ?? 0) +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).guard ?? 0),
    nudge:
      -((focus.oneThreadBias ?? 0) * 0.08) -
      ((meaning.antiEarlySolution ?? 0) * 0.1) +
      (microSignalDelta.nudge ?? 0) +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).nudge ?? 0),
  });
};

/**
 * preconditionBias を field に混ぜる。
 * 既存の latent 由来 bias を保ったまま、micro-signal の薄い delta を加える。
 *
 * @param {object} field
 * @param {object} context
 * @param {object} microSignals
 * @returns {object}
 */
const applyFieldBias = (field = {}, {
  rawLatent = {},
  preconditionFilter = {},
  preconditionBias = {},
} = {}, microSignals = {}) => {
  const bias = preconditionBias?.preconditionBias ?? preconditionBias;
  const home = rawLatent?.home ?? {};
  const existence1 = rawLatent?.existence1 ?? {};
  const existence2 = rawLatent?.existence2 ?? {};
  const beliefTension = rawLatent?.beliefTension ?? {};
  const derived = preconditionFilter?.derived ?? {};
  const biasIdentity = bias?.identity ?? {};
  const biasFocus = bias?.focus ?? {};
  const biasPacing = bias?.pacing ?? {};
  const biasMeaning = bias?.meaning ?? {};
  const tensionStrength = clamp01(beliefTension.totalTensionStrength ?? 0);
  const identityPlayfulnessBoost = getIdentityPlayfulnessBoost(existence2.agentIdentityKey);
  const microSignalDelta = buildMicroSignalLayerDelta('field', microSignals).delta;
  const axisFieldDelta = getAxisFieldDelta(biasMeaning.dominantBeliefAxis);

  return {
    softness: clamp01(
      (field.softness ?? 0) +
      (home.kernel?.slowDown ?? 0) * 0.15 +
      (biasIdentity.firstPersonSoftness ?? 0) * 0.08 +
      (axisFieldDelta.softness ?? 0) +
      (microSignalDelta.softness ?? 0) +
      identityPlayfulnessBoost
    ),
    depth: clamp01(
      (field.depth ?? 0) +
      (biasFocus.oneThreadBias ?? 0) * 0.12 +
      (existence1.hereNowStability ?? 0) * 0.06 +
      (axisFieldDelta.depth ?? 0) +
      (microSignalDelta.depth ?? 0) +
      tensionStrength * 0.06
    ),
    urgency: clamp01(
      (field.urgency ?? 0) -
      (biasPacing.slowDown ?? 0) * 0.18 +
      (axisFieldDelta.urgency ?? 0) +
      (microSignalDelta.urgency ?? 0) +
      tensionStrength * 0.05
    ),
    fragility: clamp01(
      (field.fragility ?? 0) +
      (existence1.unfinishedAllowed ?? 0) * 0.08 +
      (derived.returnBias ?? 0) * 0.06 +
      (axisFieldDelta.fragility ?? 0) +
      (microSignalDelta.fragility ?? 0) +
      tensionStrength * 0.08
    ),
    playfulness: clamp01(
      (field.playfulness ?? 0) -
      (biasFocus.oneThreadBias ?? 0) * 0.08 +
      (microSignalDelta.playfulness ?? 0) +
      identityPlayfulnessBoost
    ),
  };
};

function getIdentityPlayfulnessBoost(identityKey = '') {
  if (typeof identityKey !== 'string') return 0;

  const normalizedIdentityKey = identityKey.toLowerCase();

  if (normalizedIdentityKey.includes('creative')) return 0.02;

  return 0;
}

const buildNormalizedExistence1 = (existenceLayer1 = {}) => ({
  selfPresence: clamp01(existenceLayer1.selfPresence ?? 0),
  hereNowStability: clamp01(
    ((existenceLayer1.groundedHereNow ?? 0) + (existenceLayer1.selfLocationStability ?? 0)) / 2
  ),
  unfinishedAllowed: clamp01(existenceLayer1.allowUnfinishedSelf ?? 0),
  firstPersonSoftness: clamp01(existenceLayer1.selfPresence ?? 0),
  existenceHintKey: existenceLayer1.existenceHintKey ?? null,
  existenceHintText: existenceLayer1.existenceHintText ?? null,
});

const buildNormalizedExistence2 = (existenceLayer2 = {}) => ({
  agentIdentityKey: existenceLayer2.agentIdentityKey ?? null,
  identityFeelingText:
    existenceLayer2.identityFeelingText ??
    existenceLayer2.agentIdentityText ??
    null,
  recalledSelfTraits: Array.isArray(existenceLayer2.recalledSelfTraits)
    ? existenceLayer2.recalledSelfTraits
    : [],
  selfRememberingStrength: clamp01(existenceLayer2.selfRememberingStrength ?? 0),
});

const buildLayerBoundaryFlags = (preconditionTrace = [], latentState = {}) => {
  const lastLatentIndex = preconditionTrace
    .map((event, index) => event.startsWith('latent:') ? index : -1)
    .reduce((max, index) => Math.max(max, index), -1);
  const findAfterLatent = (eventName) => {
    const eventIndex = preconditionTrace.indexOf(eventName);
    return eventIndex !== -1 && eventIndex > lastLatentIndex;
  };

  return {
    latentSubstrateBuilt:
      Boolean(latentState.makerSeed) &&
      Boolean(latentState.home) &&
      Boolean(latentState.homeNeutralization) &&
      Boolean(latentState.existence1) &&
      Boolean(latentState.existence2) &&
      Boolean(latentState.beliefCore) &&
      Boolean(latentState.beliefBranch) &&
      Boolean(latentState.beliefLeaf) &&
      Boolean(latentState.beliefTension),
    preconditionFilterBuilt: Boolean(latentState.preconditionFilter),
    preconditionBiasBuilt: Boolean(latentState.preconditionBias),
    dynamicFieldBuiltAfterLatent: findAfterLatent('dynamic:after-field'),
    dynamicReactionBuiltAfterLatent: findAfterLatent('dynamic:after-reaction'),
    dynamicStanceBuiltAfterLatent: findAfterLatent('dynamic:after-stance'),
  };
};

export function runInternalOS(input, options = {}) {
  const normalizedInput = typeof input === 'string' ? input : '';
  const normalizedOptions = options && typeof options === 'object' ? options : {};
  const agentId = typeof normalizedOptions.agentId === 'string' ? normalizedOptions.agentId : null;
  const othersField = Array.isArray(normalizedOptions.othersField) ? normalizedOptions.othersField : [];
  const lengthPreference = ['short', 'medium', 'long'].includes(normalizedOptions.lengthPreference)
    ? normalizedOptions.lengthPreference
    : 'medium';

  // trace オブジェクトを options から取得（オプショナル）
  const trace = normalizedOptions.trace ?? null;

  // INPUT段階をトレースに記録
  if (trace) {
    trace.push(TraceStage.INPUT, {
      input: normalizedInput,
      agentId,
      lengthPreference,
      hasAfterglowSeed: !!(normalizedOptions.previousMix || normalizedOptions.previousLatentState),
    });
  }

  // Double defense: normalize previousMix and previousLatentState
  const safePreviousMix =
    normalizedOptions.previousMix && typeof normalizedOptions.previousMix === 'object'
      ? normalizedOptions.previousMix
      : null;

  const safePreviousLatentState =
    normalizedOptions.previousLatentState && typeof normalizedOptions.previousLatentState === 'object'
      ? normalizedOptions.previousLatentState
      : null;
  const microSignals =
    normalizedOptions.microSignals && typeof normalizedOptions.microSignals === 'object'
      ? normalizedOptions.microSignals
      : estimateMicroSignals(normalizedInput);
  const lexicalState = estimateState(normalizedInput);

  // MICRO_SIGNAL段階をトレースに記録
  if (trace) {
    trace.push(TraceStage.MICRO_SIGNAL, { microSignals, lexicalState });
  }
  // D-stream derived layers stay observational/supportive.
  // They inform later dynamic layers but do not replace the main field/reaction/stance path.
  const fusedState = buildFusedState({
    state: lexicalState,
    microSignals,
  });
  const baseField = estimateField(normalizedInput, { microSignals });
  const baseReactionForHome = generateReaction(normalizedInput, baseField);
  const baseStanceForHome = selectStance(baseField, baseReactionForHome);

  const initialState = createInitialInternalState();

  // ════════════════════════════════════════════════════════════════════
  // LATENT PREMISE CHAIN (潜在前提層)
  // Raw latent layers remain alive and are not compressed.
  // Maker Seed → Home → Existence Layer 1 → Existence Layer 2
  // → Belief Core → Belief Branch → Belief Leaf → Belief Tension
  // → buildPreconditionFilter (helper view derived from raw layers)
  // → field / reaction / stance (post-precondition dynamic layers)
  // → decision → surface / builder
  // ════════════════════════════════════════════════════════════════════

  const preconditionTrace = [];

  // Step 1: Maker Seed
  const makerSeed = createMakerSeed();
  preconditionTrace.push('latent:after-maker-seed');
  if (trace) {
    trace.push(TraceStage.LATENT_MAKER_SEED, { makerSeed });
  }

  // Step 2: Home Layer
  const baseHome = createHomeLayer({
    field: baseField,
    reaction: baseReactionForHome,
    stance: baseStanceForHome,
    makerSeed,
  });
  preconditionTrace.push('latent:after-home');
  if (trace) {
    trace.push(TraceStage.LATENT_HOME, {
      baseHome,
      baseField,
      baseReactionForHome,
      baseStanceForHome,
    });
  }

  // Step 2.5: Home Neutralization Check
  const neutralizationCheck = computeHomeNeutralizationState(baseHome);

  let effectiveHome = baseHome;
  let homeRetried = false;
  let homeRetryCount = 0;

  if (neutralizationCheck.retryRecommended) {
    effectiveHome = applyHomeRetry(baseHome);
    homeRetried = true;
    homeRetryCount = 1;
  }

  const homeNeutralization = {
    ...neutralizationCheck,
    retried: homeRetried,
    retryCount: homeRetryCount,
  };
  preconditionTrace.push('latent:after-home-check');
  if (trace) {
    trace.push(TraceStage.LATENT_HOME_CHECK, { homeNeutralization, effectiveHome });
  }

  // Step 3: Existence Layer 1
  const existenceLayer1 = createExistenceLayer1({
    home: effectiveHome,
    field: baseField,
    reaction: baseReactionForHome,
    stance: baseStanceForHome,
  });
  preconditionTrace.push('latent:after-existence1');
  if (trace) {
    trace.push(TraceStage.LATENT_EXISTENCE, { existenceLayer1 });
  }

  // Step 4: Existence Layer 2
  const existenceLayer2 = createExistenceLayer2({ agentId });
  preconditionTrace.push('latent:after-existence2');
  if (trace) {
    trace.push(TraceStage.LATENT_EXISTENCE_2, { existenceLayer2 });
  }

  // Step 5: Belief Core Layer
  const beliefCore = createBeliefCoreLayer({ agentId, existenceLayer2 });
  preconditionTrace.push('latent:after-belief-core');
  if (trace) {
    trace.push(TraceStage.LATENT_BELIEF_CORE, { beliefCore });
  }

  // Step 6: Belief Branch Layer
  const beliefBranch = createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 });
  preconditionTrace.push('latent:after-belief-branch');
  if (trace) {
    trace.push(TraceStage.LATENT_BELIEF_BRANCH, { beliefBranch });
  }

  // Step 7: Belief Leaf Layer
  const beliefLeaf = createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 });
  preconditionTrace.push('latent:after-belief-leaf');
  if (trace) {
    trace.push(TraceStage.LATENT_BELIEF_LEAF, { beliefLeaf });
  }

  // Step 8: Belief Tension Layer
  const beliefTension = createBeliefTensionLayer({
    input: normalizedInput,
    activeCoreBeliefs: beliefCore.activeCoreBeliefs ?? [],
    activeBranchBeliefs: beliefBranch.activeBranchBeliefs ?? [],
    activeLeafBeliefs: beliefLeaf.activeLeafBeliefs ?? [],
  });
  preconditionTrace.push('latent:after-belief-tension');
  if (trace) {
    trace.push(TraceStage.LATENT_BELIEF_TENSION, { beliefTension });
  }

  const belief = createBeliefLayers({ agentId, existenceLayer1, existenceLayer2 });

  // Step 9: Build Precondition Filter (helper view derived from raw layers)
  // This is NOT a summary or compression of the latent layers.
  // It is a helper view to make raw layers easier to read by downstream layers.
  // Raw latent layers remain alive and preserved in internalState.
  const preconditionFilter = buildPreconditionFilter({
    makerSeed,
    home: effectiveHome,
    existenceLayer1,
    existenceLayer2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });
  preconditionTrace.push('latent:after-precondition-filter');
  if (trace) {
    trace.push(TraceStage.PRECONDITION_FILTER, { preconditionFilter });
  }

  // ════════════════════════════════════════════════════════════════════
  // POST-PRECONDITION DYNAMIC LAYERS (後段動的層)
  // field / reaction / stance are recomputed here as dynamic layers
  // that occur AFTER the latent premise layers have been established.
  // They are influenced by the latent substrate via preconditionBias.
  // ════════════════════════════════════════════════════════════════════

  const preconditionBias = buildPreconditionBias(preconditionFilter);
  if (trace) {
    trace.push(TraceStage.PRECONDITION_BIAS, { preconditionBias });
  }
  // ProtoMeaning remains an assistive observation layer over the main latent pipeline.
  const protoMeaning = buildProtoMeaning(fusedState, {
    agentId,
    userText: normalizedInput,
    dominantBeliefAxis: beliefCore?.dominantBeliefAxis ?? null,
    dominantTensionAxis: beliefTension?.dominantTensionAxis ?? null,
    identityKey: existenceLayer2?.agentIdentityKey ?? null,
  });
  const existence1 = buildNormalizedExistence1(existenceLayer1);
  const existence2 = buildNormalizedExistence2(existenceLayer2);
  const dynamicBiasContext = {
    rawLatent: {
      makerSeed,
      home: effectiveHome,
      homeNeutralization,
      existence1,
      existence2,
      beliefCore,
      beliefBranch,
      beliefLeaf,
      beliefTension,
    },
    preconditionFilter,
    preconditionBias,
  };

  // Dynamic field: how the latent self perceives the current input
  const field = applyFieldBias(baseField, dynamicBiasContext, microSignals);
  preconditionTrace.push('dynamic:after-field');
  if (trace) {
    trace.push(TraceStage.DYNAMIC_FIELD, { field, baseField });
  }

  // Dynamic reaction: how the latent self reacts to this field, biased by precondition
  const baseReaction = generateReaction(normalizedInput, field);
  const reaction = applyReactionBias(baseReaction, dynamicBiasContext, microSignals);
  preconditionTrace.push('dynamic:after-reaction');
  if (trace) {
    trace.push(TraceStage.DYNAMIC_REACTION, { reaction, baseReaction });
  }

  // Dynamic stance: how the latent self stands in this moment, biased by precondition
  const baseStance = selectStance(field, reaction);
  const stance = applyStanceBias(baseStance, dynamicBiasContext, microSignals);
  preconditionTrace.push('dynamic:after-stance');
  if (trace) {
    trace.push(TraceStage.DYNAMIC_STANCE, { stance, baseStance });
  }
  const microSignalBiasDebug = buildMicroSignalBiasDebug({
    baseField,
    field,
    baseReaction,
    reaction,
    baseStance,
    stance,
    microSignals,
  });
  const permission = extractPermissionShape(effectiveHome, {
    dominantBeliefAxis: beliefCore.dominantBeliefAxis,
  });
  if (trace) {
    trace.push(TraceStage.PERMISSION, { permission });
  }

  const decision = createDecisionLayer({
    preconditionFilter,
    preconditionBias,
    beliefTension,
    reaction,
    stance,
  });
  preconditionTrace.push('dynamic:after-decision');
  if (trace) {
    trace.push(TraceStage.DECISION, { decision });
  }

  // ════════════════════════════════════════════════════════════════════
  // EMERGING FIELD (emergingField)
  // Phase 4: Build context for thought activation
  // Synthesize attention targets, resonance axes, body signals, and atmosphere
  // from precondition layers and dynamic state
  // P-4: Add focusPoints from radial condensation (Japanese-first attention)
  // ════════════════════════════════════════════════════════════════════

  // Extract attention targets from user text and belief tension
  // LEGACY BACKWARD COMPATIBILITY: attentionTargets は旧経路
  // - focusPoints が primary attention mechanism (Japanese-first, radial condensation)
  // - attentionTargets は weak support / backward compatibility のみ
  // - attentionTargets は英語向けの split ベースであり、日本語に不向き
  // TODO: 将来的に削除候補 (条件: focusPoints 系の安定とテスト充実)
  const attentionTargets = [];
  if (normalizedInput) {
    // Simple keyword extraction (in future, this could be more sophisticated)
    const words = normalizedInput.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    attentionTargets.push(...words.slice(0, 3));
  }
  if (beliefTension?.activeTensions?.length > 0) {
    beliefTension.activeTensions.slice(0, 2).forEach(t => {
      if (t.axis) attentionTargets.push(t.axis);
    });
  }

  // P-4: Extract focusPoints via radial condensation (3 channels)
  // PRIMARY ATTENTION MECHANISM: focusPoints を優先使用すること
  const focusPoints = radialCondensation({
    userText: normalizedInput,
    afterglowSeed: safePreviousMix,
    previousLatentState: safePreviousLatentState,
    beliefTension,
    topN: 3,
  });

  // Collect resonance axes from belief layers
  const resonanceAxes = [];
  if (beliefCore?.dominantBeliefAxis) {
    resonanceAxes.push(beliefCore.dominantBeliefAxis);
  }
  if (beliefBranch?.dominantBranchAxis) {
    resonanceAxes.push(beliefBranch.dominantBranchAxis);
  }
  if (beliefTension?.dominantTensionAxis) {
    resonanceAxes.push(beliefTension.dominantTensionAxis);
  }

  // P-6: Build bodySignals with external/internal separation
  // DESIGN DECISION: Two bodySignals structures serve different purposes
  // 1. latentState.bodySignals = { external, internal } (SPLIT VERSION)
  //    - Used by buildFieldText() for detecting internal/external mismatch
  //    - Example: "場は静かだが、内側に緊張が残る" (field is calm but internal tension remains)
  // 2. emergingField.bodySignals = { tension, softness, ... } (FLAT VERSION)
  //    - Used by buildConsciousIntent() for simple body state reading
  //    - Provides direct access for quick reference without split complexity
  const bodySignalsSnapshot = buildBodySignals({
    field,
    beliefTension,
    previousLatentState: safePreviousLatentState,
  });

  // Flatten for emergingField (backward compatibility)
  // This flat version is intentionally kept for buildConsciousIntent() which doesn't need split view
  const bodySignals = {
    tension: clamp01(field.urgency * 0.7 + field.fragility * 0.3),
    softness: clamp01(field.softness),
    hesitation: clamp01(field.fragility * 0.6 + (1 - field.urgency) * 0.4),
    urgency: clamp01(field.urgency),
    warmth: clamp01(field.softness * 0.5 + field.playfulness * 0.3),
    contraction: clamp01(field.fragility * 0.5 + (1 - field.playfulness) * 0.3),
  };

  // Build atmosphere from stance and reaction
  const atmosphere = [];
  if (stance.receive > 0.6) atmosphere.push('receiving');
  if (stance.guard > 0.6) atmosphere.push('protective');
  if (stance.illuminate > 0.5) atmosphere.push('illuminating');
  if (reaction.touched > 0.6) atmosphere.push('touched');
  if (reaction.holdBackJudgment > 0.5) atmosphere.push('open');

  const emergingField = {
    attentionTargets, // LEGACY: Kept for backward compatibility only, focusPoints is primary
    focusPoints, // P-4: Primary attention mechanism (Japanese-first, radial condensation)
    resonanceAxes,
    bodySignals,
    atmosphere,
  };

  // ════════════════════════════════════════════════════════════════════
  // ACTIVATE THOUGHTS (Phase 4)
  // Use emergingField + precondition layers to activate thought particles
  // This is NOT selection or final utterance - just surfacing likely thoughts
  // ════════════════════════════════════════════════════════════════════

  const activatedThoughtsResult = activateThoughts({
    agentId,
    userText: normalizedInput,
    preconditionBias,
    beliefTension,
    emergingField,
    protoMeaning,
    stateAxes: lexicalState,
    topN: 5,
  });

  const activatedThoughts = {
    items: activatedThoughtsResult.activatedThoughts || [],
    topThoughtIds: activatedThoughtsResult.topThoughtIds || [],
    activationMeta: activatedThoughtsResult.activationMeta || {
      totalCandidates: 0,
      selectedCount: 0,
      dominantAxes: [],
    },
  };
  preconditionTrace.push('dynamic:after-activate-thoughts');
  if (trace) {
    trace.push(TraceStage.ACTIVATION, {
      activatedThoughts,
      activatedFeelings: null, // まだこの時点では未処理
      activatedMoves: null,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // ACTIVATE FEELINGS (L2 Phase)
  // Surface feeling particles that naturally rise in this context
  // Feeling particles have higher bodyAffinity influence
  // ════════════════════════════════════════════════════════════════════

  const activatedFeelingsResult = activateFeelings({
    agentId,
    userText: normalizedInput,
    preconditionBias,
    beliefTension,
    emergingField,
    stateAxes: lexicalState,
    topN: 4,
  });

  const activatedFeelings = {
    items: activatedFeelingsResult.activatedFeelings || [],
    topFeelingIds: activatedFeelingsResult.topFeelingIds || [],
    activationMeta: activatedFeelingsResult.activationMeta || {
      totalCandidates: 0,
      selectedCount: 0,
      dominantAxes: [],
    },
  };
  preconditionTrace.push('dynamic:after-activate-feelings');

  // ════════════════════════════════════════════════════════════════════
  // ACTIVATE MOVES (L2 Phase)
  // Surface move particles (directional inclinations) that naturally rise
  // Move particles are influenced by focus/pacing from preconditionBias
  // ════════════════════════════════════════════════════════════════════

  const activatedMovesResult = activateMoves({
    agentId,
    userText: normalizedInput,
    preconditionBias,
    beliefTension,
    emergingField,
    stateAxes: lexicalState,
    topN: 4,
  });

  const activatedMoves = {
    items: activatedMovesResult.activatedMoves || [],
    topMoveIds: activatedMovesResult.topMoveIds || [],
    activationMeta: activatedMovesResult.activationMeta || {
      totalCandidates: 0,
      selectedCount: 0,
      dominantAxes: [],
    },
  };
  preconditionTrace.push('dynamic:after-activate-moves');
  // ACTIVATION段階の完全版を更新（thoughts/feelings/moves全て揃った時点で）
  if (trace) {
    // 前のACTIVATIONイベントを完全版で上書き
    const lastActivationIndex = trace.events.findLastIndex(e => e.stage === TraceStage.ACTIVATION);
    if (lastActivationIndex >= 0) {
      trace.events[lastActivationIndex] = {
        stage: TraceStage.ACTIVATION,
        timestamp: Date.now(),
        payload: {
          activatedThoughts,
          activatedFeelings,
          activatedMoves,
        },
      };
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // BIND THOUGHTS (Phase 5)
  // Use activated thoughts + relations to create small thought clusters
  // This is NOT final selection - just grouping related thoughts
  // ════════════════════════════════════════════════════════════════════

  const nodeRelations = getNodeRelations(agentId);
  const boundThoughtsResult = bindThoughts({
    activatedThoughts: activatedThoughts.items,
    relations: nodeRelations,
    bindThreshold: 0.35,
  });

  const boundThoughts = {
    clusters: boundThoughtsResult.clusters || [],
    clusterMeta: boundThoughtsResult.clusterMeta || {
      totalActivatedThoughts: 0,
      totalClusters: 0,
      boundClusterCount: 0,
      singleClusterCount: 0,
    },
  };
  preconditionTrace.push('dynamic:after-bind-thoughts');

  // ════════════════════════════════════════════════════════════════════
  // BIND MIXED NODES (Mixed Cluster Phase)
  // Use activated thoughts/feelings/moves + relations to create mixed clusters
  // thought-centered grouping: thought + nearby feeling/move
  // This is NOT final selection - just grouping thought/feeling/move together
  // ════════════════════════════════════════════════════════════════════

  const boundMixedNodesResult = bindMixedNodes({
    activatedThoughts: activatedThoughts.items,
    activatedFeelings: activatedFeelings.items,
    activatedMoves: activatedMoves.items,
    relations: nodeRelations,
    bindThreshold: 0.35,
  });

  const boundMixedNodes = {
    clusters: boundMixedNodesResult.clusters || [],
    clusterMeta: boundMixedNodesResult.clusterMeta || {
      totalActivatedNodes: 0,
      totalClusters: 0,
      boundClusterCount: 0,
      singleClusterCount: 0,
    },
  };
  preconditionTrace.push('dynamic:after-bind-mixed-nodes');

  // ════════════════════════════════════════════════════════════════════
  // SELECT THOUGHT CLUSTERS (Phase 6)
  // Choose which clusters naturally rise to foreground in this moment
  // This is NOT final utterance - just selecting primary + optional secondary
  // ════════════════════════════════════════════════════════════════════

  const selectedThoughtsResult = selectThoughtClusters({
    agentId,
    clusters: boundThoughts.clusters,
    preconditionBias,
    beliefTension,
    othersField,
    lengthPreference,
  });

  const selectedThoughts = {
    selected: selectedThoughtsResult.selected || [],
    selectionMeta: selectedThoughtsResult.selectionMeta || {
      totalClusters: 0,
      selectedCount: 0,
      dominantSelectedAxis: [],
    },
  };
  preconditionTrace.push('dynamic:after-select-thoughts');

  // ════════════════════════════════════════════════════════════════════
  // SELECT MIXED CLUSTERS (Mixed Cluster Phase 2)
  // Choose which mixed clusters naturally rise to foreground in this moment
  // This is NOT final utterance - just selecting primary + optional secondary
  // Priority: if mixed clusters exist, use them over thought-only clusters
  // ════════════════════════════════════════════════════════════════════

  const selectedMixedClustersResult = selectMixedClusters({
    agentId,
    clusters: boundMixedNodes.clusters,
    preconditionBias,
    beliefTension,
    othersField,
    lengthPreference,
  });

  const selectedMixedClusters = {
    selected: selectedMixedClustersResult.selected || [],
    selectionMeta: selectedMixedClustersResult.selectionMeta || {
      totalClusters: 0,
      selectedCount: 0,
      dominantSelectedAxis: [],
    },
  };
  preconditionTrace.push('dynamic:after-select-mixed-clusters');
  // MATERIAL_PICK段階（activation, bind, select の完全版）
  if (trace) {
    trace.push(TraceStage.MATERIAL_PICK, {
      activatedThoughts,
      activatedFeelings,
      activatedMoves,
      boundThoughts,
      boundMixedNodes,
      selectedThoughts,
      selectedMixedClusters,
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // BUILD CONSCIOUS INTENT (Phase 7)
  // Transform selected thought clusters into internal intention state
  // This is NOT final utterance - just internal "what do I want to say"
  // ════════════════════════════════════════════════════════════════════

  const consciousIntent = buildConsciousIntent({
    agentId,
    selectedMixedClusters,
    selectedThoughts,
    boundMixedNodes,
    boundThoughts,
    emergingField,
    preconditionBias,
    beliefTension,
    othersField,
  });
  preconditionTrace.push('dynamic:after-conscious-intent');

  // ════════════════════════════════════════════════════════════════════
  // BUILD LENGTH PLAN (Phase 7)
  // Determine natural speaking volume based on internal state
  // This is NOT token count - just directional intention for length
  // ════════════════════════════════════════════════════════════════════

  const lengthPlan = buildLengthPlan({
    userSelectedLength: lengthPreference,
    consciousIntent,
    selectedThoughts,
    preconditionBias,
  });
  preconditionTrace.push('dynamic:after-length-plan');

  // ════════════════════════════════════════════════════════════════════
  // BUILD SURFACE PLAN (Surface v0.2)
  // Transform internal state into surface-ready plan
  // Reads mixed clusters (when available), feelings, moves, and builds
  // emotionalColor, motionBias, othersPresence for natural surface generation
  // ════════════════════════════════════════════════════════════════════

  const surfacePlan = buildSurfacePlan({
    selectedMixedClusters,
    selectedThoughts,
    boundMixedNodes,
    boundThoughts,
    activatedFeelings,
    activatedMoves,
    consciousIntent,
    lengthPlan,
    beliefTension,
    preconditionBias,
    othersField,
    isMirror: agentId === 'master',
  });
  preconditionTrace.push('dynamic:after-surface-plan');

  // ════════════════════════════════════════════════════════════════════
  // BUILD FINAL DECISION SUBSTRATE (v0.1)
  // Thicken the substrate that LLM sees for final decision
  // Provide multiple foreground seeds (thought/feeling/move/tension)
  // instead of just 1-2 thoughts
  // Design doc: 次段階設計書 - Final Decision Substrate を厚くする v0.1
  // ════════════════════════════════════════════════════════════════════

  const finalDecisionSubstrate = buildFinalDecisionSubstrate({
    agentId,
    lengthPreference,
    selectedMixedClusters,
    boundMixedNodes,
    activatedThoughts,
    activatedFeelings,
    activatedMoves,
    consciousIntent,
    lengthPlan,
    beliefTension,
    othersField,
    preconditionBias,
  });
  preconditionTrace.push('dynamic:after-final-decision-substrate');

  const freshLatentState = {
    ...initialState,
    // Raw latent layers (live latent substrate) — preserved as-is, not compressed
    makerSeed,
    home: effectiveHome,
    homeNeutralization,
    existence1,
    existence2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
    beliefTension,
    // Derived helper views from raw latent layers
    preconditionFilter,
    preconditionBias,
    microSignals,
    fusedState,
    protoMeaning,
    // Post-precondition dynamic layers
    field,
    reaction,
    stance,
    permission,
    // P-6: bodySignals with external/internal separation
    bodySignals: bodySignalsSnapshot,
    // Decision layer
    decision,
    // Activated thoughts (Phase 4)
    activatedThoughts,
    // Activated feelings (L2 Phase)
    activatedFeelings,
    // Activated moves (L2 Phase)
    activatedMoves,
    // Bound thoughts (Phase 5)
    boundThoughts,
    // Bound mixed nodes (Mixed Cluster Phase)
    boundMixedNodes,
    // Selected thoughts (Phase 6)
    selectedThoughts,
    // Selected mixed clusters (Mixed Cluster Phase 2)
    selectedMixedClusters,
    // Conscious intent (Phase 7)
    consciousIntent,
    // Length plan (Phase 7)
    lengthPlan,
    // Surface plan (Surface v0.2)
    surfacePlan,
    // Final Decision Substrate (v0.1)
    finalDecisionSubstrate,
    // Legacy/backward compatibility
    existence: {
      layer1: existenceLayer1,
      layer2: existenceLayer2,
    },
    belief,
  };

  const previousLatentState = normalizeLatentState(safePreviousLatentState);
  const blendedBase = previousLatentState
    ? blendLatentState(previousLatentState, freshLatentState)
    : freshLatentState;
  const latentState = previousLatentState
    ? {
        ...blendedBase,
        makerSeed,
        home: effectiveHome,
        homeNeutralization,
        existence1,
        existence2,
        beliefCore,
        beliefBranch,
        beliefLeaf,
        beliefTension,
        preconditionFilter,
        preconditionBias,
        microSignals,
        fusedState,
        protoMeaning,
        bodySignals: bodySignalsSnapshot,
        decision,
        activatedThoughts,
        activatedFeelings,
        activatedMoves,
        boundThoughts,
        boundMixedNodes,
        selectedThoughts,
        selectedMixedClusters,
        consciousIntent,
        lengthPlan,
        surfacePlan,
        finalDecisionSubstrate,
        existence: {
          layer1: existenceLayer1,
          layer2: existenceLayer2,
        },
        belief,
      }
    : freshLatentState;

  const biasForDebug = latentState.preconditionBias ?? preconditionBias;
  const decisionForDebug = latentState.decision ?? decision;
  const layerBoundaryFlags = buildLayerBoundaryFlags(preconditionTrace, latentState);
  const preconditionBiasPreview = buildPreconditionBiasPreview(biasForDebug);
  const {
    feltSensePreview,
    speakIntentPreview,
    restraintPreview,
    decisionMetaPreview,
  } = buildDecisionPreviews(decisionForDebug);
  const dominantBeliefAxis = biasForDebug?.meaning?.dominantBeliefAxis ?? null;
  const focusBiasApplied =
    (biasForDebug?.focus?.oneThreadBias ?? 0) >= 0.35 ||
    (biasForDebug?.focus?.antiOverExpansion ?? 0) >= 0.35;
  const meaningBiasApplied =
    Boolean(dominantBeliefAxis) ||
    (biasForDebug?.meaning?.activeCoreBeliefs?.length ?? 0) > 0 ||
    (biasForDebug?.meaning?.activeBranchBeliefs?.length ?? 0) > 0;
  const identityBiasApplied =
    biasForDebug?.identity?.identityKey ??
    ((biasForDebug?.identity?.selfRememberingStrength ?? 0) >= 0.35 ? 'self-remembering' : null);

  // Home Layer の軽い反映: slowDown が高い時は構造寄りを少し抑える
  const homeInfluence = latentState.home?.kernel?.slowDown ?? 0;
  const patternMix = mixLatentPatterns(latentState, {
    previousMix: safePreviousMix,
    homeInfluence,
    preconditionBias: latentState.preconditionBias,
  });

  const surfaceWindow = buildSurfaceWindow(latentState);

  // RESIDUE段階（patternMix と surfaceWindow の生成）
  if (trace) {
    trace.push(TraceStage.RESIDUE, {
      patternMix,
      surfaceWindow,
    });
  }

  return {
    latentState,
    emergingField,
    surfaceWindow,
    patternMix,
    debugInfo: {
      version: 'maker-seed-v1',
      inputLength: normalizedInput.length,
      optionKeys: Object.keys(normalizedOptions),
      dominantPattern: patternMix.dominant,
      usedAfterglow: Boolean(previousLatentState),
      // Latent premise layer presence indicators
      latentLayersPresent: {
        makerSeed: Boolean(latentState.makerSeed),
        home: Boolean(latentState.home),
        existence1: Boolean(latentState.existence1),
        existence2: Boolean(latentState.existence2),
        beliefCore: Boolean(latentState.beliefCore),
        beliefBranch: Boolean(latentState.beliefBranch),
        beliefLeaf: Boolean(latentState.beliefLeaf),
        beliefTension: Boolean(latentState.beliefTension),
      },
      // Derived helper views presence
      derivedPreconditionPresent: {
        preconditionFilter: Boolean(latentState.preconditionFilter),
        preconditionBias: Boolean(latentState.preconditionBias),
      },
      // Post-precondition dynamic layers presence
      dynamicLayersPresent: {
        field: Boolean(latentState.field),
        reaction: Boolean(latentState.reaction),
        stance: Boolean(latentState.stance),
        decision: Boolean(latentState.decision),
      },
      latentSubstrateBuilt: layerBoundaryFlags.latentSubstrateBuilt,
      preconditionFilterBuilt: layerBoundaryFlags.preconditionFilterBuilt,
      preconditionBiasBuilt: layerBoundaryFlags.preconditionBiasBuilt,
      dynamicFieldBuiltAfterLatent: layerBoundaryFlags.dynamicFieldBuiltAfterLatent,
      dynamicReactionBuiltAfterLatent: layerBoundaryFlags.dynamicReactionBuiltAfterLatent,
      dynamicStanceBuiltAfterLatent: layerBoundaryFlags.dynamicStanceBuiltAfterLatent,
      layerBoundaryStatus: {
        latent: layerBoundaryFlags.latentSubstrateBuilt ? 'complete' : 'incomplete',
        derived:
          layerBoundaryFlags.preconditionFilterBuilt && layerBoundaryFlags.preconditionBiasBuilt
            ? 'filter/bias ready'
            : 'filter/bias pending',
        dynamic:
          `field/reaction/stance after latent = ${
            layerBoundaryFlags.dynamicFieldBuiltAfterLatent &&
            layerBoundaryFlags.dynamicReactionBuiltAfterLatent &&
            layerBoundaryFlags.dynamicStanceBuiltAfterLatent
          }`,
      },
      // Layer boundary summary
      layerBoundarySummary: 'latent: maker/home/home-check/existence/belief/tension → derived: filter/bias → dynamic: field/reaction/stance → decision/surface',
      makerSeedActive: Boolean(latentState.makerSeed),
      homeLayerActive: Boolean(latentState.home),
      existenceHintKey: latentState.existence?.layer1?.existenceHintKey ?? null,
      agentIdentityKey: latentState.existence?.layer2?.agentIdentityKey ?? null,
      beliefLensKeys: [
        latentState.belief?.layer1?.[0]?.id,
        latentState.belief?.layer2?.[0]?.id,
        latentState.belief?.layer3?.[0]?.id,
      ].filter(Boolean),
      beliefCorePreview: latentState.beliefCore?.activeCoreBeliefs?.slice(0, 2).map((b) => b.id) ?? [],
      dominantBeliefAxis: latentState.beliefCore?.dominantBeliefAxis ?? null,
      beliefBranchPreview: latentState.beliefBranch?.activeBranchBeliefs?.slice(0, 2).map((b) => b.id) ?? [],
      dominantBranchAxis: latentState.beliefBranch?.dominantBranchAxis ?? null,
      beliefLeafPreview: latentState.beliefLeaf?.activeLeafBeliefs?.slice(0, 3).map((b) => b.id) ?? [],
      dominantLeafAxis: latentState.beliefLeaf?.dominantLeafAxis ?? null,
      preconditionFilterPreview: latentState.preconditionFilter
        ? {
            present: latentState.preconditionFilter.makerSeedPresent,
            identityAxis: latentState.preconditionFilter.derived?.identityAxis ?? null,
            dominantBeliefAxis: latentState.preconditionFilter.derived?.dominantBeliefAxis ?? null,
            slowingBias: latentState.preconditionFilter.derived?.slowingBias ?? 0,
            returnBias: latentState.preconditionFilter.derived?.returnBias ?? 0,
            oneLivingThreadBias: latentState.preconditionFilter.derived?.oneLivingThreadBias ?? 0,
          }
        : null,
      preconditionBiasPreview,
      focusBiasApplied,
      meaningBiasApplied,
      identityBiasApplied,
      microSignals,
      microSignalBias: microSignalBiasDebug,
      microSignalTuning: MICRO_SIGNAL_TUNING_DEBUG_CONFIG,
      // Precondition chain trace — dev/debug only, not exposed to UX
      preconditionTrace,
      existence1Present: Boolean(latentState.existence1),
      existence2Key: latentState.existence2?.agentIdentityKey ?? null,
      beliefCoreCount: latentState.beliefCore?.activeCoreBeliefs?.length ?? 0,
      beliefBranchCount: latentState.beliefBranch?.activeBranchBeliefs?.length ?? 0,
      beliefLeafCount: latentState.beliefLeaf?.activeLeafBeliefs?.length ?? 0,
      beliefTotalBranchCount: latentState.beliefBranch?.totalBranchCount ?? 0,
      beliefTotalLeafCount: latentState.beliefLeaf?.totalLeafCount ?? 0,
      // belief active counts summary (dev-only)
      activeBeliefCounts: {
        core: latentState.beliefCore?.activeCoreBeliefs?.length ?? 0,
        branch: latentState.beliefBranch?.activeBranchBeliefs?.length ?? 0,
        leaf: latentState.beliefLeaf?.activeLeafBeliefs?.length ?? 0,
      },
      activeCorePreview: latentState.beliefCore?.activeCoreBeliefs?.map((b) => b.id) ?? [],
      activeBranchPreview: latentState.beliefBranch?.activeBranchBeliefs?.map((b) => b.id) ?? [],
      activeLeafPreview: latentState.beliefLeaf?.activeLeafBeliefs?.map((b) => b.id) ?? [],
      // belief tension (dev-only)
      beliefTensionPreview: (latentState.beliefTension?.activeTensions ?? []).map((t) => ({
        beliefId: t.beliefId,
        tensionType: t.tensionType,
        strength: t.strength,
        axis: t.axis,
      })),
      dominantTensionAxis: latentState.beliefTension?.dominantTensionAxis ?? null,
      totalTensionStrength: latentState.beliefTension?.totalTensionStrength ?? 0,
      feltSensePreview,
      speakIntentPreview,
      restraintPreview,
      decisionMetaPreview,
      preconditionFilterPresent: Boolean(latentState.preconditionFilter),
      // Home Neutralization (dev-only) — 残留圧チェック結果
      homeNeutralizationPreview: buildHomeNeutralizationPreview(latentState.homeNeutralization ?? homeNeutralization),
      // Conscious intent preview (Phase 7, dev-only)
      consciousIntentPreview: formatConsciousIntentForDebug(latentState.consciousIntent ?? consciousIntent),
      // Length plan preview (Phase 7, dev-only)
      lengthPlanPreview: formatLengthPlanForDebug(latentState.lengthPlan ?? lengthPlan),
      // Surface plan preview (Surface v0.2, dev-only)
      surfacePlanPreview: formatSurfacePlanForDebug(latentState.surfacePlan ?? surfacePlan),
      // Final Decision Substrate preview (v0.1, dev-only)
      finalDecisionSubstratePreview: formatFinalDecisionSubstrateForDebug(latentState.finalDecisionSubstrate ?? finalDecisionSubstrate),
    },
  };
}
