/**
 * buildConsciousIntent.js
 * 顕在層 v0.1 Phase 7: Build conscious intent minimal implementation
 *
 * PURPOSE:
 * - NOT final utterance generation (that comes later)
 * - NOT procedural instructions like "first do X then do Y"
 * - Build internal intention state before speaking
 * - Determine "what do I want to bring forward" and "what to hold back"
 *
 * IMPORTANT PRINCIPLES:
 * 1. consciousIntent は発話文ではない - 発話直前の内的意図である
 * 2. speakIntent は「何をどう言うか」ではなく「今何を前に出したいか」
 * 3. holdBack を持たせる - これが長さブレや説明過多を抑える土台になる
 * 4. まだ発話生成の主役にしすぎない - internal state に入るだけで十分
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Build userSense labels
 * Short internal labels for what's happening with the other person
 *
 * @param {object} context - Build context
 * @returns {string[]} userSense labels
 */
const buildUserSense = (context) => {
  const {
    attentionTargets = [],
    othersField = [],
    selectedMixedClusters = null,
    selectedThoughts = null,
  } = context;

  const labels = [];

  // From attentionTargets
  if (attentionTargets.length > 0) {
    const firstTarget = attentionTargets[0];
    if (typeof firstTarget === 'string' && firstTarget.length > 0) {
      // Simple heuristic: detect question/comparison/uncertainty patterns
      if (firstTarget.includes('比') || firstTarget.includes('compare')) {
        labels.push('comparison-pain');
      } else if (firstTarget.includes('不安') || firstTarget.includes('怖') || firstTarget.includes('afraid')) {
        labels.push('afraid-of-losing-footing');
      } else if (firstTarget.includes('重') || firstTarget.includes('heavy')) {
        labels.push('unspoken-heaviness');
      }
    }
  }

  // From othersField
  if (othersField && othersField.length > 0) {
    const hasSolutionForce = othersField.some((o) =>
      o.forceTags?.includes('clarify') || o.forceTags?.includes('solve')
    );
    if (hasSolutionForce) {
      labels.push('not-ready-to-close');
    }
  }

  // Priority: read from selectedMixedClusters if available
  if (selectedMixedClusters?.selected?.length > 0) {
    const primary = selectedMixedClusters.selected.find((s) => s.role === 'primary');
    if (primary?.reasons?.includes('tension-axis-match')) {
      labels.push('mixed-questions');
    }
  } else if (selectedThoughts?.selected?.length > 0) {
    // Fallback: read from selectedThoughts
    const primary = selectedThoughts.selected.find((s) => s.role === 'primary');
    if (primary?.reasons?.includes('tension-axis-match')) {
      labels.push('mixed-questions');
    }
  }

  // Default fallback
  if (labels.length === 0) {
    labels.push('seeking-ground');
  }

  return labels.slice(0, 3);
};

/**
 * Build selfFeeling labels
 * Short internal labels for what's happening inside
 *
 * @param {object} context - Build context
 * @returns {string[]} selfFeeling labels
 */
const buildSelfFeeling = (context) => {
  const {
    bodySignals = {},
    dominantSelectedAxis = [],
    beliefTension = null,
    boundMixedNodes = null,
    selectedMixedClusters = null,
  } = context;

  const labels = [];

  // From bodySignals
  const tension = clamp01(bodySignals.tension ?? 0);
  const softness = clamp01(bodySignals.softness ?? 0);
  const urgency = clamp01(bodySignals.urgency ?? 0);
  const warmth = clamp01(bodySignals.warmth ?? 0);

  if (tension > 0.5 && urgency < 0.4) {
    labels.push('quiet-friction');
  }

  if (softness > 0.5 || warmth > 0.5) {
    labels.push('pulled-to-touch');
  }

  // Priority: extract from selectedMixedClusters and boundMixedNodes
  if (selectedMixedClusters?.selected?.length > 0 && boundMixedNodes?.clusters) {
    const primary = selectedMixedClusters.selected.find((s) => s.role === 'primary');
    if (primary) {
      const cluster = boundMixedNodes.clusters.find((c) => c.clusterId === primary.clusterId);
      if (cluster?.feelingIds && cluster.feelingIds.length > 0) {
        // Feeling nodes contribute to selfFeeling
        labels.push('pulled-to-touch');
      }
    }
  }

  // From dominantSelectedAxis
  if (dominantSelectedAxis.length > 0) {
    const firstAxis = dominantSelectedAxis[0];
    if (firstAxis === 'holding' || firstAxis === 'presence') {
      labels.push('holding-without-closing');
    } else if (firstAxis === 'structure') {
      labels.push('urge-to-clarify');
    } else if (firstAxis === 'grounding') {
      labels.push('need-to-ground');
    }
  }

  // From beliefTension
  if (beliefTension?.totalTensionStrength > 0.4) {
    labels.push('quiet-friction');
  }

  // Default fallback
  if (labels.length === 0) {
    labels.push('quiet-presence');
  }

  // Deduplicate
  return [...new Set(labels)].slice(0, 3);
};

/**
 * Build speakIntent phrase
 * Single internal phrase for what wants to come forward
 *
 * @param {object} context - Build context
 * @returns {string} speakIntent phrase
 */
const buildSpeakIntent = (context) => {
  const {
    selectedMixedClusters = null,
    selectedThoughts = null,
    dominantSelectedAxis = [],
    selfFeeling = [],
    othersField = [],
    boundMixedNodes = null,
  } = context;

  // Check if others already covered similar territory
  const othersClarified = othersField.some((o) =>
    o.forceTags?.includes('clarify') || o.forceTags?.includes('ground')
  );

  // Priority: read dominant axis from selectedMixedClusters
  let primaryAxis = null;
  if (selectedMixedClusters?.selected?.length > 0 && boundMixedNodes?.clusters) {
    const primary = selectedMixedClusters.selected.find((s) => s.role === 'primary');
    if (primary) {
      const cluster = boundMixedNodes.clusters.find((c) => c.clusterId === primary.clusterId);
      if (cluster?.dominantAxis && cluster.dominantAxis.length > 0) {
        primaryAxis = cluster.dominantAxis[0];
      }
    }
  }

  // Fallback: read from dominantSelectedAxis
  if (!primaryAxis && dominantSelectedAxis.length > 0) {
    primaryAxis = dominantSelectedAxis[0];
  }

  // From tension and primary axis
  if (primaryAxis === 'structure' && !othersClarified) {
    return 'clarify-the-knot';
  }

  if (primaryAxis === 'holding' || primaryAxis === 'presence') {
    return 'make-room-without-closing';
  }

  if (primaryAxis === 'grounding') {
    return 'return-to-footing';
  }

  if (primaryAxis === 'preverbal' || primaryAxis === 'reflection') {
    return 'reflect-the-unsettled-weight';
  }

  // From selfFeeling
  if (selfFeeling.includes('pulled-to-touch')) {
    return 'touch-the-living-point';
  }

  if (selfFeeling.includes('quiet-friction')) {
    return 'clarify-the-knot';
  }

  // Check if primary cluster has high score (priority: mixed clusters)
  if (selectedMixedClusters?.selected?.length > 0) {
    const primary = selectedMixedClusters.selected.find((s) => s.role === 'primary');
    if (primary?.score > 0.7) {
      return 'touch-the-living-point';
    }
  } else if (selectedThoughts?.selected?.length > 0) {
    const primary = selectedThoughts.selected.find((s) => s.role === 'primary');
    if (primary?.score > 0.7) {
      return 'touch-the-living-point';
    }
  }

  // Default
  return 'return-to-ground';
};

/**
 * Build holdBack items
 * What NOT to bring forward yet
 *
 * @param {object} context - Build context
 * @returns {string[]} holdBack items
 */
const buildHoldBack = (context) => {
  const {
    oneThreadBias = 0,
    antiOverExpansion = 0,
    beliefTension = null,
    othersField = [],
  } = context;

  const items = [];

  // From oneThreadBias
  if (oneThreadBias > 0.5) {
    items.push('no-over-expansion');
  }

  // From antiOverExpansion
  if (antiOverExpansion > 0.5) {
    items.push('no-over-expansion');
  }

  // From beliefTension
  if (beliefTension?.totalTensionStrength > 0.4) {
    items.push('no-early-summary');
    items.push('do-not-close');
  }

  // From othersField - avoid redundant agent references
  if (othersField && othersField.length > 0) {
    items.push('no-explicit-agent-reference');
  }

  // Avoid premature solutions
  if (antiOverExpansion > 0.4 || oneThreadBias > 0.4) {
    items.push('no-fix-yet');
  }

  // Deduplicate
  return [...new Set(items)].slice(0, 3);
};

/**
 * Build conscious intent from selected clusters and context
 *
 * Input shape:
 * {
 *   agentId: string,
 *   selectedMixedClusters: { selected: [...], selectionMeta: {...} } | null,
 *   selectedThoughts: { selected: [...], selectionMeta: {...} } | null,
 *   boundMixedNodes: { clusters: [...] } | null,
 *   boundThoughts: { clusters: [...] } | null,
 *   emergingField: { attentionTargets, resonanceAxes, bodySignals, atmosphere } | null,
 *   preconditionBias: { focus: {...}, meaning: {...}, identity: {...} } | null,
 *   beliefTension: { dominantTensionAxis, totalTensionStrength } | null,
 *   othersField: [...] | null,
 * }
 *
 * Output shape:
 * {
 *   userSense: string[],
 *   selfFeeling: string[],
 *   selectedClusterIds: string[],
 *   speakIntent: string,
 *   holdBack: string[],
 * }
 *
 * @param {object} input - BuildConsciousIntentInput
 * @returns {object} ConsciousIntent
 */
export const buildConsciousIntent = (input = {}) => {
  // Null safety
  if (!input || typeof input !== 'object') {
    return {
      userSense: [],
      selfFeeling: [],
      selectedClusterIds: [],
      speakIntent: 'return-to-ground',
      holdBack: [],
    };
  }

  const {
    agentId: _agentId = 'joe',
    selectedMixedClusters = null,
    selectedThoughts = null,
    boundMixedNodes = null,
    boundThoughts: _boundThoughts = null,
    emergingField = null,
    preconditionBias = null,
    beliefTension = null,
    othersField = null,
  } = input;

  // Extract context
  const attentionTargets = emergingField?.attentionTargets ?? [];
  const bodySignals = emergingField?.bodySignals ?? {};

  // Priority: read dominantSelectedAxis from selectedMixedClusters if available
  const dominantSelectedAxis = selectedMixedClusters?.selectionMeta?.dominantSelectedAxis?.length > 0
    ? selectedMixedClusters.selectionMeta.dominantSelectedAxis
    : (selectedThoughts?.selectionMeta?.dominantSelectedAxis ?? []);

  const oneThreadBias = clamp01(preconditionBias?.focus?.oneThreadBias ?? 0);
  const antiOverExpansion = clamp01(preconditionBias?.focus?.antiOverExpansion ?? 0);

  // Extract selectedClusterIds (priority: mixed clusters)
  const selectedClusterIds = selectedMixedClusters?.selected?.length > 0
    ? selectedMixedClusters.selected.map((s) => s.clusterId)
    : (selectedThoughts?.selected?.map((s) => s.clusterId) ?? []);

  // Build context object
  const context = {
    attentionTargets,
    othersField: Array.isArray(othersField) ? othersField : [],
    selectedMixedClusters,
    selectedThoughts,
    boundMixedNodes,
    bodySignals,
    dominantSelectedAxis,
    beliefTension,
    oneThreadBias,
    antiOverExpansion,
  };

  // Build each component
  const userSense = buildUserSense(context);
  const selfFeeling = buildSelfFeeling(context);
  const speakIntent = buildSpeakIntent({ ...context, selfFeeling });
  const holdBack = buildHoldBack(context);

  return {
    userSense,
    selfFeeling,
    selectedClusterIds,
    speakIntent,
    holdBack,
  };
};

/**
 * Format consciousIntent for debug display
 * @param {object} consciousIntent - ConsciousIntent
 * @returns {string}
 */
export const formatConsciousIntentForDebug = (consciousIntent) => {
  if (!consciousIntent || typeof consciousIntent !== 'object') {
    return 'no conscious intent';
  }

  const userSense = consciousIntent.userSense?.join(' / ') || '-';
  const selfFeeling = consciousIntent.selfFeeling?.join(' / ') || '-';
  const speakIntent = consciousIntent.speakIntent || '-';
  const holdBack = consciousIntent.holdBack?.join(', ') || '-';
  const clusterCount = consciousIntent.selectedClusterIds?.length ?? 0;

  return `userSense: ${userSense} | selfFeeling: ${selfFeeling} | speakIntent: ${speakIntent} | holdBack: ${holdBack} | clusters: ${clusterCount}`;
};
