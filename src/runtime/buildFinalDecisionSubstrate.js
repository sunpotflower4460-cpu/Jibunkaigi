/**
 * buildFinalDecisionSubstrate.js
 * Final Decision Substrate v0.1: Thicken the substrate
 *
 * PURPOSE:
 * - NOT instructions on "how to speak"
 * - NOT procedural steps or commands
 * - Build the thickest possible foreground world for LLM to naturally decide from
 * - Provide multiple seeds (thought/feeling/move/tension) instead of just 1-2 thoughts
 *
 * CORE PRINCIPLE:
 * The Final Decision Substrate is:
 * - NOT: commands, prohibitions, procedures
 * - BUT: a bundle of what is currently in the foreground
 *
 * Agent differences come from:
 * - NOT: explanatory text about agent personality
 * - BUT: differences in which particles rise to foreground
 *
 * Design doc: 次段階設計書 - Final Decision Substrate を厚くする v0.1
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Extract foreground thought seeds from selected mixed clusters
 *
 * Strategy:
 * - Primary cluster: extract 2 thought seeds
 * - Secondary cluster (if exists): extract 1 thought seed
 * - Goal: minimum 2-3 thought seeds in foreground
 *
 * @param {object} context - Build context
 * @returns {string[]} Foreground thought seeds
 */
const extractForegroundThoughtSeeds = (context) => {
  const {
    selectedMixedClusters = null,
    boundMixedNodes = null,
    activatedThoughts = null,
  } = context;

  const seeds = [];

  if (!selectedMixedClusters?.selected || !boundMixedNodes?.clusters || !activatedThoughts?.items) {
    return seeds;
  }

  // Extract from primary cluster
  const primary = selectedMixedClusters.selected.find(s => s.role === 'primary');
  if (primary) {
    const cluster = boundMixedNodes.clusters.find(c => c.clusterId === primary.clusterId);
    if (cluster?.thoughtIds && cluster.thoughtIds.length > 0) {
      // Take top 2 thoughts from primary
      const primaryThoughts = cluster.thoughtIds
        .slice(0, 2)
        .map(tid => activatedThoughts.items.find(t => t.nodeId === tid))
        .filter(Boolean)
        .map(t => t.textSeed)
        .filter(Boolean);

      seeds.push(...primaryThoughts);
    }
  }

  // Extract from secondary cluster
  const secondary = selectedMixedClusters.selected.find(s => s.role === 'secondary');
  if (secondary) {
    const cluster = boundMixedNodes.clusters.find(c => c.clusterId === secondary.clusterId);
    if (cluster?.thoughtIds && cluster.thoughtIds.length > 0) {
      // Take top 1 thought from secondary
      const secondaryThought = cluster.thoughtIds
        .slice(0, 1)
        .map(tid => activatedThoughts.items.find(t => t.nodeId === tid))
        .filter(Boolean)
        .map(t => t.textSeed)
        .filter(Boolean);

      seeds.push(...secondaryThought);
    }
  }

  return seeds;
};

/**
 * Extract foreground feeling seeds from selected mixed clusters
 *
 * Strategy:
 * - Primary cluster: extract 1 feeling seed
 * - Secondary cluster (if exists): extract 1 feeling or move seed (prefer feeling)
 * - Goal: 1-2 feeling seeds visible
 *
 * @param {object} context - Build context
 * @returns {string[]} Foreground feeling seeds
 */
const extractForegroundFeelingSeeds = (context) => {
  const {
    selectedMixedClusters = null,
    boundMixedNodes = null,
    activatedFeelings = null,
  } = context;

  const seeds = [];

  if (!selectedMixedClusters?.selected || !boundMixedNodes?.clusters || !activatedFeelings?.items) {
    return seeds;
  }

  // Extract from primary cluster
  const primary = selectedMixedClusters.selected.find(s => s.role === 'primary');
  if (primary) {
    const cluster = boundMixedNodes.clusters.find(c => c.clusterId === primary.clusterId);
    if (cluster?.feelingIds && cluster.feelingIds.length > 0) {
      // Take top 1 feeling from primary
      const primaryFeeling = cluster.feelingIds
        .slice(0, 1)
        .map(fid => activatedFeelings.items.find(f => f.nodeId === fid))
        .filter(Boolean)
        .map(f => f.textSeed)
        .filter(Boolean);

      seeds.push(...primaryFeeling);
    }
  }

  // Extract from secondary cluster
  const secondary = selectedMixedClusters.selected.find(s => s.role === 'secondary');
  if (secondary) {
    const cluster = boundMixedNodes.clusters.find(c => c.clusterId === secondary.clusterId);
    if (cluster?.feelingIds && cluster.feelingIds.length > 0) {
      // Take top 1 feeling from secondary
      const secondaryFeeling = cluster.feelingIds
        .slice(0, 1)
        .map(fid => activatedFeelings.items.find(f => f.nodeId === fid))
        .filter(Boolean)
        .map(f => f.textSeed)
        .filter(Boolean);

      seeds.push(...secondaryFeeling);
    }
  }

  return seeds;
};

/**
 * Extract foreground move seeds from selected mixed clusters
 *
 * Strategy:
 * - Primary cluster: extract 1 move seed
 * - Secondary cluster (if exists): extract 1 move seed (if no feeling from secondary)
 * - Goal: 1-2 move seeds visible
 *
 * @param {object} context - Build context
 * @returns {string[]} Foreground move seeds
 */
const extractForegroundMoveSeeds = (context) => {
  const {
    selectedMixedClusters = null,
    boundMixedNodes = null,
    activatedMoves = null,
  } = context;

  const seeds = [];

  if (!selectedMixedClusters?.selected || !boundMixedNodes?.clusters || !activatedMoves?.items) {
    return seeds;
  }

  // Extract from primary cluster
  const primary = selectedMixedClusters.selected.find(s => s.role === 'primary');
  if (primary) {
    const cluster = boundMixedNodes.clusters.find(c => c.clusterId === primary.clusterId);
    if (cluster?.moveIds && cluster.moveIds.length > 0) {
      // Take top 1 move from primary
      const primaryMove = cluster.moveIds
        .slice(0, 1)
        .map(mid => activatedMoves.items.find(m => m.nodeId === mid))
        .filter(Boolean)
        .map(m => m.textSeed)
        .filter(Boolean);

      seeds.push(...primaryMove);
    }
  }

  // Extract from secondary cluster
  const secondary = selectedMixedClusters.selected.find(s => s.role === 'secondary');
  if (secondary) {
    const cluster = boundMixedNodes.clusters.find(c => c.clusterId === secondary.clusterId);
    if (cluster?.moveIds && cluster.moveIds.length > 0) {
      // Take top 1 move from secondary
      const secondaryMove = cluster.moveIds
        .slice(0, 1)
        .map(mid => activatedMoves.items.find(m => m.nodeId === mid))
        .filter(Boolean)
        .map(m => m.textSeed)
        .filter(Boolean);

      seeds.push(...secondaryMove);
    }
  }

  return seeds;
};

/**
 * Extract foreground tension seeds from beliefTension
 *
 * Strategy:
 * - If totalTensionStrength > 0.4, promote 0-1 tension to foreground
 * - Tension makes agent differences visible (Joe: hesitation, Ken: dual questions, etc.)
 * - Goal: 0-1 tension seed visible
 *
 * @param {object} context - Build context
 * @returns {string[]} Foreground tension seeds
 */
const extractForegroundTensionSeeds = (context) => {
  const {
    beliefTension = null,
  } = context;

  const seeds = [];

  if (!beliefTension) {
    return seeds;
  }

  const totalStrength = clamp01(beliefTension.totalTensionStrength ?? 0);

  // Only promote tension if it's strong enough
  if (totalStrength < 0.4) {
    return seeds;
  }

  // Extract dominant tension axis as a seed
  const dominantAxis = beliefTension.dominantTensionAxis;
  if (dominantAxis) {
    seeds.push(dominantAxis);
  }

  // If we have active tensions, take the first one
  if (beliefTension.activeTensions && beliefTension.activeTensions.length > 0) {
    const firstTension = beliefTension.activeTensions[0];
    if (firstTension.axis1 && firstTension.axis2) {
      seeds.push(`${firstTension.axis1} ↔ ${firstTension.axis2}`);
    }
  }

  return seeds.slice(0, 1); // Maximum 1 tension seed
};

/**
 * Build resonance from othersField
 *
 * Resonance is NOT "what others said verbatim"
 * Resonance is:
 * - gist: general sense of field
 * - force: dominant forces already active
 * - unresolved tone: what's still open
 *
 * @param {object} context - Build context
 * @returns {object} { othersGist: string[], dominantAxes: string[] }
 */
const buildResonance = (context) => {
  const {
    othersField = [],
  } = context;

  const safeOthersField = Array.isArray(othersField) ? othersField : [];

  if (safeOthersField.length === 0) {
    return {
      othersGist: [],
      dominantAxes: [],
    };
  }

  // Extract gist from others
  const gist = [];
  const axisCount = {};

  safeOthersField.forEach(entry => {
    // Collect force tags
    if (entry.forceTags && Array.isArray(entry.forceTags)) {
      entry.forceTags.forEach(force => {
        axisCount[force] = (axisCount[force] || 0) + 1;
      });
    }

    // Collect tone tags for gist
    if (entry.toneTags && Array.isArray(entry.toneTags)) {
      gist.push(...entry.toneTags);
    }
  });

  // Get dominant axes (forces that others already used)
  const dominantAxes = Object.entries(axisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([force]) => force);

  // Deduplicate gist
  const uniqueGist = [...new Set(gist)].slice(0, 2);

  return {
    othersGist: uniqueGist,
    dominantAxes,
  };
};

/**
 * Build restraint from consciousIntent and lengthPlan
 *
 * Restraint is NOT "禁止" (prohibitions)
 * Restraint is:
 * - holdBack: what to hold back
 * - closurePressure: how much pressure to close/conclude
 * - expansionBudget: how much room to expand
 *
 * @param {object} context - Build context
 * @returns {object} { holdBack: string[], closurePressure: string, expansionBudget: number }
 */
const buildRestraint = (context) => {
  const {
    consciousIntent = null,
    lengthPlan = null,
  } = context;

  const holdBack = consciousIntent?.holdBack ?? [];
  const expansionBudget = clamp01(lengthPlan?.expansionBudget ?? 0.45);
  const compressionPressure = clamp01(lengthPlan?.compressionPressure ?? 0.50);

  // Map compressionPressure to closurePressure levels
  let closurePressure = 'medium';
  if (compressionPressure > 0.65) {
    closurePressure = 'high';
  } else if (compressionPressure < 0.40) {
    closurePressure = 'low';
  }

  return {
    holdBack: holdBack.slice(0, 3),
    closurePressure,
    expansionBudget,
  };
};

/**
 * Build Final Decision Substrate
 *
 * Input shape:
 * {
 *   agentId: string,
 *   lengthPreference: 'short' | 'medium' | 'long',
 *   selectedMixedClusters: { selected: [...], selectionMeta: {...} } | null,
 *   boundMixedNodes: { clusters: [...] } | null,
 *   activatedThoughts: { items: [...] } | null,
 *   activatedFeelings: { items: [...] } | null,
 *   activatedMoves: { items: [...] } | null,
 *   consciousIntent: ConsciousIntent | null,
 *   lengthPlan: LengthPlan | null,
 *   beliefTension: BeliefTension | null,
 *   othersField: OthersField | null,
 *   preconditionBias: PreconditionBias | null,
 * }
 *
 * Output shape (FinalDecisionSubstrate):
 * {
 *   identityAnchor: {
 *     agentId: string,
 *     mode: 'short' | 'medium' | 'long',
 *   },
 *   foreground: {
 *     thoughtSeeds: string[],
 *     feelingSeeds: string[],
 *     moveSeeds: string[],
 *     tensionSeeds: string[],
 *   },
 *   resonance: {
 *     othersGist: string[],
 *     dominantAxes: string[],
 *   },
 *   restraint: {
 *     holdBack: string[],
 *     closurePressure: 'low' | 'medium' | 'high',
 *     expansionBudget: number,
 *   },
 *   boundary: {
 *     doNotLeakInternalLabels: true,
 *   },
 * }
 *
 * @param {object} input - BuildFinalDecisionSubstrateInput
 * @returns {object} FinalDecisionSubstrate
 */
export const buildFinalDecisionSubstrate = (input = {}) => {
  // Null safety
  if (!input || typeof input !== 'object') {
    return {
      identityAnchor: {
        agentId: 'joe',
        mode: 'medium',
      },
      foreground: {
        thoughtSeeds: [],
        feelingSeeds: [],
        moveSeeds: [],
        tensionSeeds: [],
      },
      resonance: {
        othersGist: [],
        dominantAxes: [],
      },
      restraint: {
        holdBack: [],
        closurePressure: 'medium',
        expansionBudget: 0.45,
      },
      boundary: {
        doNotLeakInternalLabels: true,
      },
    };
  }

  const {
    agentId = 'joe',
    lengthPreference = 'medium',
    selectedMixedClusters = null,
    boundMixedNodes = null,
    activatedThoughts = null,
    activatedFeelings = null,
    activatedMoves = null,
    consciousIntent = null,
    lengthPlan = null,
    beliefTension = null,
    othersField = null,
    preconditionBias: _preconditionBias = null,
  } = input;

  // Build context for extraction functions
  const context = {
    selectedMixedClusters,
    boundMixedNodes,
    activatedThoughts,
    activatedFeelings,
    activatedMoves,
    consciousIntent,
    lengthPlan,
    beliefTension,
    othersField,
  };

  // Extract foreground seeds
  const thoughtSeeds = extractForegroundThoughtSeeds(context);
  const feelingSeeds = extractForegroundFeelingSeeds(context);
  const moveSeeds = extractForegroundMoveSeeds(context);
  const tensionSeeds = extractForegroundTensionSeeds(context);

  // Build resonance and restraint
  const resonance = buildResonance(context);
  const restraint = buildRestraint(context);

  return {
    identityAnchor: {
      agentId,
      mode: lengthPreference,
    },
    foreground: {
      thoughtSeeds,
      feelingSeeds,
      moveSeeds,
      tensionSeeds,
    },
    resonance,
    restraint,
    boundary: {
      doNotLeakInternalLabels: true,
    },
  };
};

/**
 * Format Final Decision Substrate for debug display
 *
 * @param {object} substrate - FinalDecisionSubstrate
 * @returns {string} Formatted debug string
 */
export const formatFinalDecisionSubstrateForDebug = (substrate) => {
  if (!substrate || typeof substrate !== 'object') {
    return 'no substrate';
  }

  const agent = substrate.identityAnchor?.agentId || '-';
  const mode = substrate.identityAnchor?.mode || 'medium';
  const thoughts = substrate.foreground?.thoughtSeeds?.length ?? 0;
  const feelings = substrate.foreground?.feelingSeeds?.length ?? 0;
  const moves = substrate.foreground?.moveSeeds?.length ?? 0;
  const tensions = substrate.foreground?.tensionSeeds?.length ?? 0;
  const othersAxes = substrate.resonance?.dominantAxes?.join(', ') || '-';
  const holdBack = substrate.restraint?.holdBack?.join(', ') || '-';
  const closure = substrate.restraint?.closurePressure || 'medium';
  const expand = (substrate.restraint?.expansionBudget ?? 0).toFixed(2);

  return `agent: ${agent} / mode: ${mode} | foreground: t=${thoughts} / f=${feelings} / m=${moves} / tension=${tensions} | others: ${othersAxes} | restraint: ${holdBack} / closure=${closure} / expand=${expand}`;
};
