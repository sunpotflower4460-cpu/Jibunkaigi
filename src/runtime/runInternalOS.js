import { estimateField } from './fieldEstimator.js';
import { createInitialInternalState } from './internalState.js';
import { createPermissionLayer } from './permissionLayer.js';
import { generateReaction } from './reactionGenerator.js';
import { mixLatentPatterns } from './routerMixer.js';
import { selectStance } from './stanceSelector.js';
import { buildSurfaceWindow } from './surfaceWindow.js';

export function runInternalOS(input, options = {}) {
  const normalizedInput = typeof input === 'string' ? input : '';
  const normalizedOptions = options && typeof options === 'object' ? options : {};
  const initialState = createInitialInternalState();
  const field = estimateField(normalizedInput);
  const reaction = generateReaction(normalizedInput, field);
  const stance = selectStance(field, reaction);
  const permission = createPermissionLayer({ field, reaction, stance });

  const latentState = {
    ...initialState,
    field,
    reaction,
    stance,
    permission,
  };

  const patternMix = mixLatentPatterns(latentState, {
    previousMix: normalizedOptions.previousMix,
  });

  const surfaceWindow = buildSurfaceWindow(latentState);

  return {
    latentState,
    surfaceWindow,
    patternMix,
    debugInfo: {
      version: 'pr4-router-mixer-minimum',
      inputLength: normalizedInput.length,
      optionKeys: Object.keys(normalizedOptions),
      dominantPattern: patternMix.dominant,
    },
  };
}
