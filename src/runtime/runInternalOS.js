import { estimateField } from './fieldEstimator.js';
import { createInitialInternalState } from './internalState.js';
import { createPermissionLayer } from './permissionLayer.js';
import { generateReaction } from './reactionGenerator.js';
import { selectStance } from './stanceSelector.js';
import { buildSurfaceWindow } from './surfaceWindow.js';

export function runInternalOS(input, options = {}) {
  const normalizedInput = typeof input === 'string' ? input : '';
  const initialState = createInitialInternalState();
  const field = estimateField(normalizedInput, options);
  const reaction = generateReaction(normalizedInput, field, options);
  const stance = selectStance(field, reaction, options);
  const permission = createPermissionLayer({ field, reaction, stance, options });

  const latentState = {
    ...initialState,
    field,
    reaction,
    stance,
    permission,
  };

  const surfaceWindow = buildSurfaceWindow(latentState, options);

  return {
    latentState,
    surfaceWindow,
    debugInfo: {
      version: 'pr1-minimum-os',
      inputLength: normalizedInput.length,
    },
  };
}
