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
  const reaction = generateReaction(normalizedInput, field);
  const stance = selectStance(field, reaction);
  const home = createHomeLayer({ field, reaction, stance });
  const existenceLayer1 = createExistenceLayer1({ home, field, reaction, stance });
  const existenceLayer2 = createExistenceLayer2({ agentId });
  const beliefCore = createBeliefCoreLayer({ agentId, existenceLayer2 });
  const beliefBranch = createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 });
  const beliefLeaf = createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 });
  const belief = createBeliefLayers({
    agentId,
    existenceLayer1,
    existenceLayer2,
  });
  const permission = extractPermissionShape(home);

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
  };

  const previousLatentState = normalizeLatentState(safePreviousLatentState);
  const latentState = previousLatentState
    ? blendLatentState(previousLatentState, freshLatentState)
    : freshLatentState;

  // Home Layer の軽い反映: slowDown が高い時は構造寄りを少し抑える
  const homeInfluence = latentState.home?.kernel?.slowDown ?? 0;
  const patternMix = mixLatentPatterns(latentState, {
    previousMix: safePreviousMix,
    homeInfluence,
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
    },
  };
}
