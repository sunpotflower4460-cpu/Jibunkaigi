import { estimateField } from './fieldEstimator.js';
import { createInitialInternalState } from './internalState.js';
import { createHomeLayer, extractPermissionShape } from './homeLayer.js';
import { generateReaction } from './reactionGenerator.js';
import { mixLatentPatterns } from './routerMixer.js';
import { selectStance } from './stanceSelector.js';
import { buildSurfaceWindow } from './surfaceWindow.js';
import { blendLatentState, normalizeLatentState } from './afterglow.js';

export function runInternalOS(input, options = {}) {
  const normalizedInput = typeof input === 'string' ? input : '';
  const normalizedOptions = options && typeof options === 'object' ? options : {};

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
  const field = estimateField(normalizedInput);
  const reaction = generateReaction(normalizedInput, field);
  const stance = selectStance(field, reaction);
  const home = createHomeLayer({ field, reaction, stance });
  const permission = extractPermissionShape(home);

  const freshLatentState = {
    ...initialState,
    field,
    reaction,
    stance,
    home,
    permission,
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
      version: 'home-layer-v0',
      inputLength: normalizedInput.length,
      optionKeys: Object.keys(normalizedOptions),
      dominantPattern: patternMix.dominant,
      usedAfterglow: Boolean(previousLatentState),
      homeLayerActive: Boolean(latentState.home),
    },
  };
}
