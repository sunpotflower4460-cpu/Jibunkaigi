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
  preconditionTrace.push('latent:maker-seed');

  // Step 2: Home Layer
  // Initial field/reaction/stance are computed as minimal inputs for Home,
  // but they will be recomputed as post-precondition dynamic layers later.
  preconditionTrace.push('latent:before-home');
  const initialField = estimateField(normalizedInput);
  const initialReaction = generateReaction(normalizedInput, initialField);
  const initialStance = selectStance(initialField, initialReaction);
  const baseHome = createHomeLayer({ field: initialField, reaction: initialReaction, stance: initialStance });
  preconditionTrace.push('latent:after-home');

  // Step 3: Existence Layer 1
  const baseExistenceLayer1 = createExistenceLayer1({
    home: baseHome,
    field: initialField,
    reaction: initialReaction,
    stance: initialStance,
  });
  preconditionTrace.push('latent:after-existence1');

  // Step 4: Existence Layer 2
  const existenceLayer2 = createExistenceLayer2({ agentId });
  preconditionTrace.push('latent:after-existence2');

  // Step 5: Belief Core Layer
  const beliefCore = createBeliefCoreLayer({ agentId, existenceLayer2 });
  preconditionTrace.push('latent:after-belief-core');

  // Step 6: Belief Branch Layer
  const beliefBranch = createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 });
  preconditionTrace.push('latent:after-belief-branch');

  // Step 7: Belief Leaf Layer
  const beliefLeaf = createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 });
  preconditionTrace.push('latent:after-belief-leaf');

  // Step 8: Belief Tension Layer
  const beliefTension = createBeliefTensionLayer({
    input: normalizedInput,
    activeCoreBeliefs: beliefCore.activeCoreBeliefs ?? [],
    activeBranchBeliefs: beliefBranch.activeBranchBeliefs ?? [],
    activeLeafBeliefs: beliefLeaf.activeLeafBeliefs ?? [],
  });
  preconditionTrace.push('latent:after-belief-tension');

  // Step 9: Build Precondition Filter (helper view derived from raw layers)
  // This is NOT a summary or compression of the latent layers.
  // It is a helper view to make raw layers easier to read by downstream layers.
  // Raw latent layers remain alive and preserved in internalState.
  const basePreconditionFilter = buildPreconditionFilter({
    makerSeed,
    home: baseHome,
    existenceLayer1: baseExistenceLayer1,
    existenceLayer2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });
  preconditionTrace.push('latent:after-build-filter');

  // ════════════════════════════════════════════════════════════════════
  // POST-PRECONDITION DYNAMIC LAYERS (後段動的層)
  // field / reaction / stance are recomputed here as dynamic layers
  // that occur AFTER the latent premise layers have been established.
  // They are influenced by the latent substrate via preconditionBias.
  // ════════════════════════════════════════════════════════════════════

  const initialPreconditionBias = buildPreconditionBias(basePreconditionFilter);
  preconditionTrace.push('dynamic:after-precondition-bias');

  // Dynamic field: how the latent self perceives the current input
  const field = estimateField(normalizedInput);
  preconditionTrace.push('dynamic:after-field');

  // Dynamic reaction: how the latent self reacts to this field, biased by precondition
  const baseReaction = generateReaction(normalizedInput, field);
  const reaction = applyReactionBias(baseReaction, initialPreconditionBias);
  preconditionTrace.push('dynamic:after-reaction');

  // Dynamic stance: how the latent self stands in this moment, biased by precondition
  const baseStance = selectStance(field, reaction);
  const stance = applyStanceBias(baseStance, initialPreconditionBias);
  preconditionTrace.push('dynamic:after-stance');
  const home = createHomeLayer({ field, reaction, stance });
  preconditionTrace.push('dynamic:after-home-rebuild');

  // ════════════════════════════════════════════════════════════════════
  // HOME NEUTRALIZATION CHECK
  // Home を通過した直後に残留圧を確認する。
  // 必要な時だけ（retryRecommended）軽い再Home を一度だけ適用し、
  // 存在層1へ入る前に 0 近傍へ近づける。
  // 再Home は最大1回に制限し、自然さを損なわない。
  // ════════════════════════════════════════════════════════════════════
  const neutralizationCheck = computeHomeNeutralizationState(home);

  let effectiveHome = home;
  let homeRetried = false;
  let homeRetryCount = 0;

  if (neutralizationCheck.retryRecommended) {
    effectiveHome = applyHomeRetry(home);
    homeRetried = true;
    homeRetryCount = 1;
  }

  const homeNeutralization = {
    ...neutralizationCheck,
    retried: homeRetried,
    retryCount: homeRetryCount,
  };
  preconditionTrace.push(homeRetried ? 'dynamic:home-retry-applied' : 'dynamic:home-neutralization-checked');

  const existenceLayer1 = createExistenceLayer1({ home: effectiveHome, field, reaction, stance });
  const belief = createBeliefLayers({ agentId, existenceLayer1, existenceLayer2 });
  const permission = extractPermissionShape(effectiveHome);

  // Final preconditionFilter (rebuilt from biased effectiveHome / existenceLayer1)
  const preconditionFilter = buildPreconditionFilter({
    makerSeed,
    home: effectiveHome,
    existenceLayer1,
    existenceLayer2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });
  preconditionTrace.push('dynamic:after-rebuild-filter');
  const preconditionBias = buildPreconditionBias(preconditionFilter);
  preconditionTrace.push('dynamic:after-rebuild-bias');

  const decision = createDecisionLayer({
    preconditionFilter,
    preconditionBias,
    beliefTension,
    reaction,
    stance,
  });
  preconditionTrace.push('dynamic:after-decision');

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
    // Post-precondition dynamic layers
    field,
    reaction,
    stance,
    permission,
    // Decision layer
    decision,
    // Legacy/backward compatibility
    existence: {
      layer1: existenceLayer1,
      layer2: existenceLayer2,
    },
    belief,
  };

  const previousLatentState = normalizeLatentState(safePreviousLatentState);
  // After blending, always re-attach existence1/existence2 from the fresh state so
  // they are guaranteed to be present (blendLatentState does not blend these fields).
  const blendedBase = previousLatentState
    ? blendLatentState(previousLatentState, freshLatentState)
    : freshLatentState;
  const latentState = previousLatentState
    ? { ...blendedBase, existence1, existence2, beliefTension, decision, homeNeutralization }
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
      // Layer boundary summary
      layerBoundarySummary: 'latent: maker/home/existence/belief/tension → derived: filter/bias → dynamic: field/reaction/stance → decision/surface',
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
      // Home Neutralization (dev-only) — 残留圧チェック結果
      homeNeutralizationPreview: buildHomeNeutralizationPreview(latentState.homeNeutralization ?? homeNeutralization),
    },
  };
}
