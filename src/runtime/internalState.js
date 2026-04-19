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

const createBeliefCoreState = () => ({
  activeCoreBeliefs: [],
  dominantBeliefAxis: null,
});

const createBeliefBranchState = () => ({
  activeBranchBeliefs: [],
  dominantBranchAxis: null,
});

const createBeliefLeafState = () => ({
  activeLeafBeliefs: [],
  dominantLeafAxis: null,
});

const createBeliefTensionState = () => ({
  activeTensions: [],
  dominantTensionAxis: null,
  totalTensionStrength: 0,
});

const createPreconditionFilterState = () => ({
  makerSeedPresent: false,
  home: {
    kernel: {
      releaseHelpfulness: 0,
      releaseAccuracyPressure: 0,
      slowDown: 0,
      returnBeforeOutput: 0,
      allowOneLivingThread: 0,
    },
    reasonText: null,
    outputLimits: {
      noEarlySummary: 0,
      noEarlySolution: 0,
      noOverExpansion: 0,
      keepOneThread: 0,
    },
  },
  existence: {
    selfPresence: 0,
    hereNowStability: 0,
    unfinishedAllowed: 0,
    firstPersonSoftness: 0,
    agentIdentityKey: null,
    identityFeelingText: null,
    recalledSelfTraits: [],
    selfRememberingStrength: 0,
  },
  belief: {
    activeCoreBeliefs: [],
    activeBranchBeliefs: [],
    activeLeafBeliefs: [],
    dominantCoreAxis: null,
    dominantBranchAxis: null,
    dominantLeafAxis: null,
  },
  derived: {
    identityAxis: null,
    dominantBeliefAxis: null,
    oneLivingThreadBias: 0,
    slowingBias: 0,
    returnBias: 0,
  },
});

const createPreconditionBiasState = () => ({
  pacing: {
    slowDown: 0,
    returnBias: 0,
  },
  focus: {
    oneThreadBias: 0,
    antiOverExpansion: 0,
    keepOneThread: 0,
  },
  meaning: {
    antiEarlySummary: 0,
    antiEarlySolution: 0,
    dominantBeliefAxis: null,
    activeCoreBeliefs: [],
    activeBranchBeliefs: [],
    activeLeafBeliefs: [],
    activeCoreAxes: [],
    activeBranchAxes: [],
    activeLeafAxes: [],
  },
  identity: {
    identityKey: null,
    selfRememberingStrength: 0,
    recalledTraits: [],
    selfPresence: 0,
    hereNowStability: 0,
    unfinishedAllowed: 0,
    firstPersonSoftness: 0,
  },
});

const createMakerSeedState = () => ({
  text: '',
  layer: 'maker-seed',
  position: 'foundation',
});

const createActivatedThoughtsState = () => ({
  items: [],
  topThoughtIds: [],
  activationMeta: {
    totalCandidates: 0,
    selectedCount: 0,
    dominantAxes: [],
  },
});

const createBoundThoughtsState = () => ({
  clusters: [],
  clusterMeta: {
    totalActivatedThoughts: 0,
    totalClusters: 0,
    boundClusterCount: 0,
    singleClusterCount: 0,
  },
});

const createBoundMixedNodesState = () => ({
  clusters: [],
  clusterMeta: {
    totalActivatedNodes: 0,
    totalClusters: 0,
    boundClusterCount: 0,
    singleClusterCount: 0,
  },
});

const createSelectedThoughtsState = () => ({
  selected: [],
  selectionMeta: {
    totalClusters: 0,
    selectedCount: 0,
    dominantSelectedAxis: [],
  },
});

const createConsciousIntentState = () => ({
  userSense: [],
  selfFeeling: [],
  selectedClusterIds: [],
  speakIntent: null,
  holdBack: [],
});

const createLengthPlanState = () => ({
  target: 'medium',
  lineCountHint: 4,
  expansionBudget: 0.45,
  compressionPressure: 0.50,
});

const createDecisionState = () => ({
  feltSense: {
    primaryFeeling: null,
    secondaryFeeling: null,
    tensionType: null,
    tensionStrength: 0,
  },
  intention: {
    speakIntentKey: null,
    speakIntentText: null,
    touchDepth: 0,
    focusTarget: null,
  },
  restraint: {
    holdBackSummary: 0,
    holdBackSolution: 0,
    holdBackExpansion: 0,
    keepSilenceMargin: 0,
  },
  decisionMeta: {
    identityAxis: null,
    dominantBeliefAxis: null,
    delegatedBy: null,
  },
});

const createHomeState = () => ({
  kernel: {
    releaseHelpfulness: 0,
    releaseAccuracyPressure: 0,
    slowDown: 0,
    returnBeforeOutput: 0,
    allowOneLivingThread: 0,
  },
  reason: {
    homeReasonKey: null,
    homeReasonText: null,
  },
  outputLimits: {
    noEarlySummary: 0,
    noEarlySolution: 0,
    noOverExpansion: 0,
    keepOneThread: 0,
  },
});

// Home 通過後の残留圧チェック・ニュートラル到達状態
const createHomeNeutralizationState = () => ({
  residualHelpfulnessPressure: 0,
  residualAccuracyPressure: 0,
  residualPerformancePressure: 0,
  residualSummaryPressure: 0,
  residualSolutionPressure: 0,
  neutralizationDepth: 0,
  returnedToZero: false,
  retryRecommended: false,
  retried: false,
  retryCount: 0,
});

// Normalized top-level existence1: flattened shape derived from existenceLayer1 data
const createExistence1State = () => ({
  selfPresence: 0,
  hereNowStability: 0,
  unfinishedAllowed: 0,
  firstPersonSoftness: 0,
  existenceHintKey: null,
  existenceHintText: null,
});

// Normalized top-level existence2: flattened shape derived from existenceLayer2 data
const createExistence2State = () => ({
  agentIdentityKey: null,
  identityFeelingText: null,
  recalledSelfTraits: [],
  selfRememberingStrength: 0,
});

export function createInitialInternalState() {
  return {
    makerSeed: createMakerSeedState(),
    field: createFieldState(),
    reaction: createReactionState(),
    stance: createStanceState(),
    permission: createPermissionState(),
    home: createHomeState(),
    homeNeutralization: createHomeNeutralizationState(),
    existence: {
      layer1: createExistenceLayer1State(),
      layer2: createExistenceLayer2State(),
    },
    existence1: createExistence1State(),
    existence2: createExistence2State(),
    beliefCore: createBeliefCoreState(),
    beliefBranch: createBeliefBranchState(),
    beliefLeaf: createBeliefLeafState(),
    beliefTension: createBeliefTensionState(),
    belief: createBeliefLayersState(),
    preconditionFilter: createPreconditionFilterState(),
    preconditionBias: createPreconditionBiasState(),
    activatedThoughts: createActivatedThoughtsState(),
    boundThoughts: createBoundThoughtsState(),
    boundMixedNodes: createBoundMixedNodesState(),
    selectedThoughts: createSelectedThoughtsState(),
    consciousIntent: createConsciousIntentState(),
    lengthPlan: createLengthPlanState(),
    decision: createDecisionState(),
  };
}
