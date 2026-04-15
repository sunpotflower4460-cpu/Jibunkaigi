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

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const mergeSignals = (base = {}, delta = {}) => {
  const keys = new Set([...Object.keys(base), ...Object.keys(delta)]);
  return Object.fromEntries(
    [...keys].map((key) => [key, clamp01((base[key] ?? 0) + (delta[key] ?? 0))])
  );
};

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
  const makerSeed = createMakerSeed();
  const field = estimateField(normalizedInput);
  const baseReaction = generateReaction(normalizedInput, field);
  const baseStance = selectStance(field, baseReaction);
  const baseHome = createHomeLayer({ field, reaction: baseReaction, stance: baseStance });
  const baseExistenceLayer1 = createExistenceLayer1({
    home: baseHome,
    field,
    reaction: baseReaction,
    stance: baseStance,
  });
  const existenceLayer2 = createExistenceLayer2({ agentId });
  const beliefCore = createBeliefCoreLayer({ agentId, existenceLayer2 });
  const beliefBranch = createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 });
  const beliefLeaf = createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 });
  const basePreconditionFilter = buildPreconditionFilter({
    makerSeed,
    home: baseHome,
    existenceLayer1: baseExistenceLayer1,
    existenceLayer2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });

  const initialPreconditionBias = buildPreconditionBias(basePreconditionFilter);
  const reaction = applyReactionBias(baseReaction, initialPreconditionBias);
  const stance = applyStanceBias(selectStance(field, reaction), initialPreconditionBias);
  const home = createHomeLayer({ field, reaction, stance });
  const existenceLayer1 = createExistenceLayer1({ home, field, reaction, stance });
  const belief = createBeliefLayers({
    agentId,
    existenceLayer1,
    existenceLayer2,
  });
  const permission = extractPermissionShape(home);

  // Phase 6 + 7: 前提層を閉じて precondition bias を後段へ染み込ませる
  const preconditionFilter = buildPreconditionFilter({
    makerSeed,
    home,
    existenceLayer1,
    existenceLayer2,
    beliefCore,
    beliefBranch,
    beliefLeaf,
  });
  const preconditionBias = buildPreconditionBias(preconditionFilter);

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
    beliefCore,
    beliefBranch,
    beliefLeaf,
    belief,
    preconditionFilter,
    preconditionBias,
  };

  const previousLatentState = normalizeLatentState(safePreviousLatentState);
  const latentState = previousLatentState
    ? blendLatentState(previousLatentState, freshLatentState)
    : freshLatentState;
  const biasForDebug = latentState.preconditionBias ?? preconditionBias;
  const preconditionBiasPreview = buildPreconditionBiasPreview(biasForDebug);
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
      identityBiasApplied: preconditionBias?.identity?.identityKey ?? null,
    },
  };
}
