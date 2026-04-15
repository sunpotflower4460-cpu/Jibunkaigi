import { estimateField } from './fieldEstimator.js';
import { createInitialInternalState } from './internalState.js';
import { createHomeLayer, extractPermissionShape } from './homeLayer.js';
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

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

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
      return { touched: 0.04, curiosity: 0.06 };
    case 'structure':
      return { clarify: 0.08, holdBackJudgment: 0.02 };
    case 'holding':
    case 'presence':
      return { protect: 0.06, holdBackJudgment: 0.05 };
    case 'grounding':
      return { protect: 0.05, touched: 0.03 };
    case 'reflection':
    case 'preverbal':
      return { touched: 0.05, holdBackJudgment: 0.04 };
    case 'mission':
      return { clarify: 0.04, curiosity: 0.04 };
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
      return { illuminate: 0.1, nudge: 0.03 };
    case 'structure':
      return { structure: 0.1, guard: 0.03 };
    case 'holding':
    case 'presence':
      return { receive: 0.08, guard: 0.08 };
    case 'grounding':
      return { guard: 0.08, structure: 0.04 };
    case 'reflection':
    case 'preverbal':
      return { receive: 0.09, illuminate: 0.04 };
    case 'mission':
      return { illuminate: 0.05, structure: 0.05 };
    default:
      return {};
  }
};

/**
 * preconditionBias を reaction に混ぜる。
 * Home の急がなさ、Existence の存在感、Belief の軸を足し引きして
 * 即応・即断・演技っぽさを少し弱める。
 *
 * @param {object} reaction
 * @param {object} preconditionBias
 * @returns {object}
 */
const applyReactionBias = (reaction = {}, preconditionBias = {}) => {
  const pacing = preconditionBias?.pacing ?? {};
  const focus = preconditionBias?.focus ?? {};
  const meaning = preconditionBias?.meaning ?? {};
  const identity = preconditionBias?.identity ?? {};
  const identityPresenceBias = clamp01(
    (identity.selfPresence ?? 0) * 0.35 +
    (identity.hereNowStability ?? 0) * 0.25 +
    (identity.selfRememberingStrength ?? 0) * 0.4
  );

  return mergeSignals(reaction, {
    touched:
      (pacing.slowDown ?? 0) * 0.04 +
      (pacing.returnBias ?? 0) * 0.05 +
      identityPresenceBias * 0.05 +
      (identity.firstPersonSoftness ?? 0) * 0.03 +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).touched ?? 0),
    protect:
      (pacing.returnBias ?? 0) * 0.05 +
      (identity.hereNowStability ?? 0) * 0.04 +
      (identity.selfPresence ?? 0) * 0.03 +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).protect ?? 0),
    clarify:
      -((pacing.slowDown ?? 0) * 0.1) -
      ((meaning.antiEarlySolution ?? 0) * 0.08) -
      ((meaning.antiEarlySummary ?? 0) * 0.03) +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).clarify ?? 0),
    curiosity:
      -((focus.oneThreadBias ?? 0) * 0.04) -
      ((focus.antiOverExpansion ?? 0) * 0.05) +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).curiosity ?? 0),
    holdBackJudgment:
      (pacing.slowDown ?? 0) * 0.08 +
      (pacing.returnBias ?? 0) * 0.08 +
      (identity.unfinishedAllowed ?? 0) * 0.08 +
      (identity.firstPersonSoftness ?? 0) * 0.05 +
      identityPresenceBias * 0.04 +
      (getAxisReactionDelta(meaning.dominantBeliefAxis).holdBackJudgment ?? 0),
  });
};

/**
 * reaction から立った stance に対して、preconditionBias 由来の軽い寄せを足す。
 * 一点性・意味軸・存在感を重心として加えるだけで、既存 stance を全廃しない。
 *
 * @param {object} stance
 * @param {object} preconditionBias
 * @returns {object}
 */
const applyStanceBias = (stance = {}, preconditionBias = {}) => {
  const pacing = preconditionBias?.pacing ?? {};
  const focus = preconditionBias?.focus ?? {};
  const meaning = preconditionBias?.meaning ?? {};
  const identity = preconditionBias?.identity ?? {};
  const identityPresenceBias = clamp01(
    (identity.selfPresence ?? 0) * 0.3 +
    (identity.hereNowStability ?? 0) * 0.25 +
    (identity.selfRememberingStrength ?? 0) * 0.45
  );

  return mergeSignals(stance, {
    receive:
      (pacing.slowDown ?? 0) * 0.08 +
      (pacing.returnBias ?? 0) * 0.06 +
      identityPresenceBias * 0.06 +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).receive ?? 0),
    illuminate:
      (getAxisStanceDelta(meaning.dominantBeliefAxis).illuminate ?? 0) +
      (identity.selfRememberingStrength ?? 0) * 0.03,
    structure:
      -((pacing.slowDown ?? 0) * 0.08) -
      ((meaning.antiEarlySummary ?? 0) * 0.08) -
      ((meaning.antiEarlySolution ?? 0) * 0.08) +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).structure ?? 0),
    guard:
      (focus.antiOverExpansion ?? 0) * 0.05 +
      identityPresenceBias * 0.05 +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).guard ?? 0),
    nudge:
      -((focus.oneThreadBias ?? 0) * 0.04) -
      ((meaning.antiEarlySolution ?? 0) * 0.05) +
      (getAxisStanceDelta(meaning.dominantBeliefAxis).nudge ?? 0),
  });
};

export function runInternalOS(input, options = {}) {
  const normalizedInput = typeof input === 'string' ? input : '';
  const normalizedOptions = options && typeof options === 'object' ? options : {};
  const agentId = typeof normalizedOptions.agentId === 'string' ? normalizedOptions.agentId : null;

  // Double defense: normalize previousMix and previousLatentState
  const safePreviousMix =
    normalizedOptions.previousMix && typeof normalizedOptions.previousMix === 'object'
      ? normalizedOptions.previousMix
      : null;

  const safePreviousLatentState =
    normalizedOptions.previousLatentState && typeof normalizedOptions.previousLatentState === 'object'
      ? normalizedOptions.previousLatentState
      : null;

  const initialState = createInitialInternalState();

  // ════════════════════════════════════════════════════════════════════
  // PRECONDITION CHAIN (主役層)
  // Maker Seed → Home → Existence Layer 1 → Existence Layer 2
  // → Belief Core → Belief Branch → Belief Leaf → buildPreconditionFilter
  // ════════════════════════════════════════════════════════════════════

  const preconditionTrace = [];

  // Step 1: Maker Seed
  const makerSeed = createMakerSeed();

  // field / reaction / stance are computed here as internal inputs required by
  // Home Layer. They are not standalone precondition layers; Home is the first
  // named layer in the precondition chain.
  const field = estimateField(normalizedInput);
  const baseReaction = generateReaction(normalizedInput, field);
  const baseStance = selectStance(field, baseReaction);

  // Step 2: Home Layer
  preconditionTrace.push('precondition:before-home');
  const baseHome = createHomeLayer({ field, reaction: baseReaction, stance: baseStance });
  preconditionTrace.push('precondition:after-home');

  // Step 3: Existence Layer 1
  const baseExistenceLayer1 = createExistenceLayer1({
    home: baseHome,
    field,
    reaction: baseReaction,
    stance: baseStance,
  });
  preconditionTrace.push('precondition:after-existence1');

  // Step 4: Existence Layer 2
  const existenceLayer2 = createExistenceLayer2({ agentId });
  preconditionTrace.push('precondition:after-existence2');

  // Step 5: Belief Core Layer
  const beliefCore = createBeliefCoreLayer({ agentId, existenceLayer2 });
  preconditionTrace.push('precondition:after-belief-core');

  // Step 6: Belief Branch Layer
  const beliefBranch = createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 });
  preconditionTrace.push('precondition:after-belief-branch');

  // Step 7: Belief Leaf Layer
  const beliefLeaf = createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 });
  preconditionTrace.push('precondition:after-belief-leaf');

  // Step 8: Build Precondition Filter (first pass — before bias)
  const basePreconditionFilter = buildPreconditionFilter({
    makerSeed,
    home: baseHome,
    existenceLayer1: baseExistenceLayer1,
    existenceLayer2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });

  // ════════════════════════════════════════════════════════════════════
  // DOWNSTREAM: bias application → rebuilt reaction / stance / home / existence
  // 先に reaction へ bias を混ぜ、その反応から stance を立てた上で
  // stance 側の軽い寄せをもう一段だけ足す。
  // こうすると「何に反応しやすいか」の変化が先に入り、
  // その反応を受けた stance が後追いで少し傾く。
  // ════════════════════════════════════════════════════════════════════

  const initialPreconditionBias = buildPreconditionBias(basePreconditionFilter);
  const reaction = applyReactionBias(baseReaction, initialPreconditionBias);
  const stance = applyStanceBias(selectStance(field, reaction), initialPreconditionBias);
  const home = createHomeLayer({ field, reaction, stance });
  const existenceLayer1 = createExistenceLayer1({ home, field, reaction, stance });
  const belief = createBeliefLayers({ agentId, existenceLayer1, existenceLayer2 });
  const permission = extractPermissionShape(home);

  // Final preconditionFilter (rebuilt from biased home / existenceLayer1)
  const preconditionFilter = buildPreconditionFilter({
    makerSeed,
    home,
    existenceLayer1,
    existenceLayer2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });
  preconditionTrace.push('precondition:after-build-filter');
  const preconditionBias = buildPreconditionBias(preconditionFilter);
  preconditionTrace.push('precondition:after-precondition-bias');

  const beliefTension = createBeliefTensionLayer({
    input: normalizedInput,
    activeCoreBeliefs: beliefCore.activeCoreBeliefs ?? [],
    activeBranchBeliefs: beliefBranch.activeBranchBeliefs ?? [],
    activeLeafBeliefs: beliefLeaf.activeLeafBeliefs ?? [],
  });
  preconditionTrace.push('precondition:after-belief-tension');

  const decision = createDecisionLayer({
    preconditionFilter,
    preconditionBias,
    beliefTension,
    reaction,
    stance,
  });
  preconditionTrace.push('precondition:after-decision');

  // Normalized top-level existence1 / existence2 derived from the final (biased) layers.
  // These provide a flat, canonical shape that downstream and debug can read directly.
  const existence1 = {
    selfPresence: clamp01(existenceLayer1.selfPresence ?? 0),
    hereNowStability: clamp01(
      ((existenceLayer1.groundedHereNow ?? 0) + (existenceLayer1.selfLocationStability ?? 0)) / 2
    ),
    unfinishedAllowed: clamp01(existenceLayer1.allowUnfinishedSelf ?? 0),
    firstPersonSoftness: clamp01(existenceLayer1.selfPresence ?? 0),
    existenceHintKey: existenceLayer1.existenceHintKey ?? null,
    existenceHintText: existenceLayer1.existenceHintText ?? null,
  };

  const existence2 = {
    agentIdentityKey: existenceLayer2.agentIdentityKey ?? null,
    identityFeelingText: existenceLayer2.agentIdentityText ?? null,
    recalledSelfTraits: Array.isArray(existenceLayer2.recalledSelfTraits)
      ? existenceLayer2.recalledSelfTraits
      : [],
    selfRememberingStrength: clamp01(existenceLayer2.selfRememberingStrength ?? 0),
  };

  const freshLatentState = {
    ...initialState,
    makerSeed,
    field,
    reaction,
    stance,
    home,
    permission,
    existence: {
      layer1: existenceLayer1,
      layer2: existenceLayer2,
    },
    existence1,
    existence2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
    beliefTension,
    belief,
    preconditionFilter,
    preconditionBias,
    decision,
  };

  const previousLatentState = normalizeLatentState(safePreviousLatentState);
  // After blending, always re-attach existence1/existence2 from the fresh state so
  // they are guaranteed to be present (blendLatentState does not blend these fields).
  const blendedBase = previousLatentState
    ? blendLatentState(previousLatentState, freshLatentState)
    : freshLatentState;
  const latentState = previousLatentState
    ? { ...blendedBase, existence1, existence2, beliefTension, decision }
    : freshLatentState;

  const biasForDebug = latentState.preconditionBias ?? preconditionBias;
  const decisionForDebug = latentState.decision ?? decision;
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

  return {
    latentState,
    surfaceWindow,
    patternMix,
    debugInfo: {
      version: 'maker-seed-v1',
      inputLength: normalizedInput.length,
      optionKeys: Object.keys(normalizedOptions),
      dominantPattern: patternMix.dominant,
      usedAfterglow: Boolean(previousLatentState),
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
    },
  };
}
