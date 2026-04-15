const createFieldState = () => ({
  softness: 0,
  depth: 0,
  urgency: 0,
  fragility: 0,
  playfulness: 0,
});

const createReactionState = () => ({
  touched: 0,
  protect: 0,
  clarify: 0,
  curiosity: 0,
  holdBackJudgment: 0,
});

const createStanceState = () => ({
  receive: 0,
  illuminate: 0,
  structure: 0,
  guard: 0,
  nudge: 0,
});

const createPermissionState = () => ({
  noHurry: 0,
  noOverExplain: 0,
  noPerformativeHelpfulness: 0,
  allowPartialUncertainty: 0,
});

const createExistenceLayer1State = () => ({
  selfPresence: 0,
  selfLocationStability: 0,
  groundedHereNow: 0,
  allowUnfinishedSelf: 0,
  existenceHintKey: null,
  existenceHintText: null,
});

const createExistenceLayer2State = () => ({
  agentIdentityKey: '',
  agentIdentityText: '',
  recalledSelfTraits: [],
  selfRememberingStrength: 0,
});

const createBeliefLayersState = () => ({
  layer1: [],
  layer2: [],
  layer3: [],
});

export function createInitialInternalState() {
  return {
    field: createFieldState(),
    reaction: createReactionState(),
    stance: createStanceState(),
    permission: createPermissionState(),
    existence: {
      layer1: createExistenceLayer1State(),
      layer2: createExistenceLayer2State(),
    },
    belief: createBeliefLayersState(),
  };
}
