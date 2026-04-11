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

export function createInitialInternalState() {
  return {
    field: createFieldState(),
    reaction: createReactionState(),
    stance: createStanceState(),
    permission: createPermissionState(),
  };
}
