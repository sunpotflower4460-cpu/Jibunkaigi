/**
 * buildSurfacePlan.js
 * 顕在層 v0.2: Surface の本格更新 - Build surface plan minimal implementation
 *
 * PURPOSE:
 * - NOT final utterance generation (that comes later in surfaceTranslator)
 * - NOT procedural instructions like "first do X then do Y"
 * - Build internal surface plan before speaking
 * - Determine what mixed clusters to focus on, emotional color, motion bias, and others presence
 *
 * IMPORTANT PRINCIPLES:
 * 1. surfacePlan は発話文ではない - 発話直前の内的翻訳 plan である
 * 2. selectedMixedClusters が存在する場合は thought-only より優先する
 * 3. feeling / move を emotionalColor / motionBias として自然化する
 * 4. holdBack / lengthPlan を本格的に反映する
 * 5. 心の鏡 (mirror) は場全体の残響を読む
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Extract focalClusterIds from selectedMixedClusters or fall back to selectedThoughts
 *
 * selectedMixedClusters が存在する場合は、それを優先する
 *
 * @param {object} context - Build context
 * @returns {string[]} Focal cluster IDs
 */
const extractFocalClusterIds = (context) => {
  const {
    selectedMixedClusters = null,
    selectedThoughts = null,
  } = context;

  // Priority 1: selectedMixedClusters (if exists)
  if (selectedMixedClusters?.selected && selectedMixedClusters.selected.length > 0) {
    const focalIds = [];

    // Primary cluster
    const primary = selectedMixedClusters.selected.find(s => s.role === 'primary');
    if (primary) {
      focalIds.push(primary.clusterId);
    }

    // Secondary cluster (if exists)
    const secondary = selectedMixedClusters.selected.find(s => s.role === 'secondary');
    if (secondary) {
      focalIds.push(secondary.clusterId);
    }

    return focalIds;
  }

  // Fallback: selectedThoughts (thought-only clusters)
  if (selectedThoughts?.selected && selectedThoughts.selected.length > 0) {
    const focalIds = [];

    const primary = selectedThoughts.selected.find(s => s.role === 'primary');
    if (primary) {
      focalIds.push(primary.clusterId);
    }

    const secondary = selectedThoughts.selected.find(s => s.role === 'secondary');
    if (secondary) {
      focalIds.push(secondary.clusterId);
    }

    return focalIds;
  }

  return [];
};

/**
 * Extract focalAxes from selected clusters
 *
 * @param {object} context - Build context
 * @returns {string[]} Focal axes
 */
const extractFocalAxes = (context) => {
  const {
    selectedMixedClusters = null,
    selectedThoughts = null,
    boundMixedNodes = null,
    boundThoughts = null,
  } = context;

  const axes = [];

  // Priority 1: Get axes from selectedMixedClusters
  if (selectedMixedClusters?.selected && selectedMixedClusters.selected.length > 0) {
    const primary = selectedMixedClusters.selected.find(s => s.role === 'primary');
    if (primary && boundMixedNodes?.clusters) {
      const cluster = boundMixedNodes.clusters.find(c => c.clusterId === primary.clusterId);
      if (cluster?.dominantAxis) {
        axes.push(...cluster.dominantAxis.slice(0, 2));
      }
    }

    const secondary = selectedMixedClusters.selected.find(s => s.role === 'secondary');
    if (secondary && boundMixedNodes?.clusters) {
      const cluster = boundMixedNodes.clusters.find(c => c.clusterId === secondary.clusterId);
      if (cluster?.dominantAxis) {
        axes.push(...cluster.dominantAxis.slice(0, 1));
      }
    }
  }

  // Fallback: Get axes from selectedThoughts
  else if (selectedThoughts?.selected && selectedThoughts.selected.length > 0) {
    const primary = selectedThoughts.selected.find(s => s.role === 'primary');
    if (primary && boundThoughts?.clusters) {
      const cluster = boundThoughts.clusters.find(c => c.clusterId === primary.clusterId);
      if (cluster?.dominantAxis) {
        axes.push(...cluster.dominantAxis.slice(0, 2));
      }
    }
  }

  // Deduplicate and return top 3
  return [...new Set(axes)].slice(0, 3);
};

/**
 * Extract emotionalColor from feeling components in selected mixed clusters
 *
 * feeling 成分から、表層の温度感を作る
 *
 * @param {object} context - Build context
 * @returns {string[]} Emotional color labels
 */
const extractEmotionalColor = (context) => {
  const {
    selectedMixedClusters = null,
    boundMixedNodes = null,
    activatedFeelings = null,
    beliefTension = null,
  } = context;

  const colors = [];

  // Extract from primary cluster's feeling components
  if (selectedMixedClusters?.selected && boundMixedNodes?.clusters && activatedFeelings?.items) {
    const primary = selectedMixedClusters.selected.find(s => s.role === 'primary');
    if (primary) {
      const cluster = boundMixedNodes.clusters.find(c => c.clusterId === primary.clusterId);
      if (cluster?.feelingIds && cluster.feelingIds.length > 0) {
        // Get the feeling nodes
        const feelings = cluster.feelingIds
          .map(fid => activatedFeelings.items.find(f => f.nodeId === fid))
          .filter(Boolean);

        // Infer emotional color from feeling textSeed patterns
        feelings.forEach(feeling => {
          const textSeed = feeling.textSeed || '';
          if (/温か|やわらか|受け|包/i.test(textSeed)) {
            colors.push('warm');
          }
          if (/張り|摩擦|構造|緊張/i.test(textSeed)) {
            colors.push('tight');
          }
          if (/ためら|躊躇|不安|揺/i.test(textSeed)) {
            colors.push('hesitant');
          }
          if (/静か|沈黙|余白|間/i.test(textSeed)) {
            colors.push('quiet');
          }
          if (/足元|現実|地面|安定/i.test(textSeed)) {
            colors.push('grounded');
          }
          if (/脆|繊細|危う|壊れ/i.test(textSeed)) {
            colors.push('fragile');
          }
        });
      }
    }
  }

  // Infer from beliefTension
  if (beliefTension?.activeTensions && beliefTension.activeTensions.length > 0) {
    const tensionStrength = clamp01(beliefTension.totalTensionStrength ?? 0);
    if (tensionStrength > 0.5) {
      colors.push('tight');
    }
  }

  // Deduplicate and limit to 3
  return [...new Set(colors)].slice(0, 3);
};

/**
 * Extract motionBias from move components in selected mixed clusters
 *
 * move 成分から、どっちへ向かいたい返答かを持つ
 *
 * @param {object} context - Build context
 * @returns {string[]} Motion bias labels
 */
const extractMotionBias = (context) => {
  const {
    selectedMixedClusters = null,
    boundMixedNodes = null,
    activatedMoves = null,
    consciousIntent = null,
  } = context;

  const motions = [];

  // Extract from primary cluster's move components
  if (selectedMixedClusters?.selected && boundMixedNodes?.clusters && activatedMoves?.items) {
    const primary = selectedMixedClusters.selected.find(s => s.role === 'primary');
    if (primary) {
      const cluster = boundMixedNodes.clusters.find(c => c.clusterId === primary.clusterId);
      if (cluster?.moveIds && cluster.moveIds.length > 0) {
        // Get the move nodes
        const moves = cluster.moveIds
          .map(mid => activatedMoves.items.find(m => m.nodeId === mid))
          .filter(Boolean);

        // Infer motion bias from move textSeed patterns
        moves.forEach(move => {
          const textSeed = move.textSeed || '';
          if (/触れ|接触|近づ|寄り/i.test(textSeed)) {
            motions.push('touch');
          }
          if (/保つ|支え|守|止まる|留まる/i.test(textSeed)) {
            motions.push('hold');
          }
          if (/明確|整理|見える|照らす/i.test(textSeed)) {
            motions.push('clarify');
          }
          if (/足元|戻す|地面|着地/i.test(textSeed)) {
            motions.push('ground');
          }
          if (/とどまる|待つ|ここ|そのまま/i.test(textSeed)) {
            motions.push('stay');
          }
          if (/開|閉じない|余白|未完/i.test(textSeed)) {
            motions.push('do-not-close');
          }
        });
      }
    }
  }

  // Infer from consciousIntent.speakIntent
  if (consciousIntent?.speakIntent) {
    const speakIntent = consciousIntent.speakIntent;
    if (speakIntent.includes('touch')) {
      motions.push('touch');
    }
    if (speakIntent.includes('room') || speakIntent.includes('hold')) {
      motions.push('hold');
    }
    if (speakIntent.includes('clarify')) {
      motions.push('clarify');
    }
    if (speakIntent.includes('ground') || speakIntent.includes('footing')) {
      motions.push('ground');
    }
    if (speakIntent.includes('stay') || speakIntent.includes('return')) {
      motions.push('stay');
    }
  }

  // Deduplicate and limit to 3
  return [...new Set(motions)].slice(0, 3);
};

/**
 * Build othersPresence from others_field
 *
 * @param {object} context - Build context
 * @returns {object} OthersPresence
 */
const buildOthersPresence = (context) => {
  const {
    othersField = [],
    isMirror = false,
  } = context;

  // Ensure othersField is an array
  const safeOthersField = Array.isArray(othersField) ? othersField : [];

  const hasOthers = safeOthersField.length > 0;

  // Extract dominant forces from others_field
  const forceCount = {};
  safeOthersField.forEach(entry => {
    if (entry.forceTags) {
      entry.forceTags.forEach(force => {
        forceCount[force] = (forceCount[force] || 0) + 1;
      });
    }
  });

  const dominantForces = Object.entries(forceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([force]) => force);

  // Mirror mode: always consider others presence
  if (isMirror) {
    return {
      hasOthers: true,
      dominantForces: dominantForces.length > 0 ? dominantForces : ['unresolved'],
    };
  }

  return {
    hasOthers,
    dominantForces,
  };
};

/**
 * Calculate lineCountHint from lengthPlan and cluster count
 *
 * @param {object} context - Build context
 * @returns {number} Line count hint
 */
const calculateLineCountHint = (context) => {
  const {
    lengthPlan = null,
    focalClusterIds = [],
  } = context;

  if (!lengthPlan) return 4;

  const baseLine = lengthPlan.lineCountHint || 4;
  const clusterCount = focalClusterIds.length;

  // Adjust based on cluster count
  // If we have 2+ clusters, slightly increase line count
  if (clusterCount >= 2) {
    return Math.min(9, Math.round(baseLine * 1.1));
  }

  // Otherwise, use base line count as-is
  // (clusterCount === 0 means no selection data, not "nothing to say")
  // (clusterCount === 1 means one cluster, which is the typical case)
  return baseLine;
};

/**
 * Calculate expansionBudget and compressionPressure from lengthPlan and holdBack
 *
 * @param {object} context - Build context
 * @returns {object} { expansionBudget, compressionPressure }
 */
const calculateExpansionCompression = (context) => {
  const {
    lengthPlan = null,
    consciousIntent = null,
  } = context;

  const baseExpansion = lengthPlan?.expansionBudget ?? 0.45;
  const baseCompression = lengthPlan?.compressionPressure ?? 0.50;

  const holdBack = consciousIntent?.holdBack ?? [];

  // Adjust based on holdBack
  let expansionBudget = baseExpansion;
  let compressionPressure = baseCompression;

  if (holdBack.includes('no-over-expansion')) {
    expansionBudget = clamp01(expansionBudget * 0.75);
  }

  if (holdBack.includes('do-not-close')) {
    compressionPressure = clamp01(compressionPressure * 0.85);
  }

  return {
    expansionBudget: clamp01(expansionBudget),
    compressionPressure: clamp01(compressionPressure),
  };
};

/**
 * Build surface plan from selected clusters, consciousIntent, lengthPlan, and context
 *
 * Input shape:
 * {
 *   selectedMixedClusters: { selected: [...], selectionMeta: {...} } | null,
 *   selectedThoughts: { selected: [...], selectionMeta: {...} } | null,
 *   boundMixedNodes: { clusters: [...] } | null,
 *   boundThoughts: { clusters: [...] } | null,
 *   activatedFeelings: { items: [...] } | null,
 *   activatedMoves: { items: [...] } | null,
 *   consciousIntent: ConsciousIntent | null,
 *   lengthPlan: LengthPlan | null,
 *   beliefTension: BeliefTension | null,
 *   preconditionBias: PreconditionBias | null,
 *   othersField: OthersField | null,
 *   isMirror: boolean,
 * }
 *
 * Output shape:
 * {
 *   focalClusterIds: string[],
 *   focalAxes: string[],
 *   emotionalColor: string[],
 *   motionBias: string[],
 *   speakIntent: string | null,
 *   holdBack: string[],
 *   lineCountHint: number,
 *   expansionBudget: number,
 *   compressionPressure: number,
 *   othersPresence: {
 *     hasOthers: boolean,
 *     dominantForces: string[],
 *   },
 * }
 *
 * @param {object} input - BuildSurfacePlanInput
 * @returns {object} SurfacePlan
 */
export const buildSurfacePlan = (input = {}) => {
  // Null safety
  if (!input || typeof input !== 'object') {
    return {
      focalClusterIds: [],
      focalAxes: [],
      emotionalColor: [],
      motionBias: [],
      speakIntent: null,
      holdBack: [],
      lineCountHint: 4,
      expansionBudget: 0.45,
      compressionPressure: 0.50,
      othersPresence: {
        hasOthers: false,
        dominantForces: [],
      },
    };
  }

  const {
    selectedMixedClusters = null,
    selectedThoughts = null,
    boundMixedNodes = null,
    boundThoughts = null,
    activatedFeelings = null,
    activatedMoves = null,
    consciousIntent = null,
    lengthPlan = null,
    beliefTension = null,
    preconditionBias: _preconditionBias = null,
    othersField = null,
    isMirror = false,
  } = input;

  // Build context for extraction functions
  const context = {
    selectedMixedClusters,
    selectedThoughts,
    boundMixedNodes,
    boundThoughts,
    activatedFeelings,
    activatedMoves,
    consciousIntent,
    lengthPlan,
    beliefTension,
    othersField,
    isMirror,
  };

  // Extract each component
  const focalClusterIds = extractFocalClusterIds(context);
  const focalAxes = extractFocalAxes({ ...context, focalClusterIds });
  const emotionalColor = extractEmotionalColor(context);
  const motionBias = extractMotionBias(context);
  const othersPresence = buildOthersPresence(context);

  const speakIntent = consciousIntent?.speakIntent ?? null;
  const holdBack = consciousIntent?.holdBack ?? [];

  const lineCountHint = calculateLineCountHint({ ...context, focalClusterIds });
  const { expansionBudget, compressionPressure } = calculateExpansionCompression(context);

  return {
    focalClusterIds,
    focalAxes,
    emotionalColor,
    motionBias,
    speakIntent,
    holdBack,
    lineCountHint,
    expansionBudget,
    compressionPressure,
    othersPresence,
  };
};

/**
 * Format surfacePlan for debug display
 * @param {object} surfacePlan - SurfacePlan
 * @returns {string}
 */
export const formatSurfacePlanForDebug = (surfacePlan) => {
  if (!surfacePlan || typeof surfacePlan !== 'object') {
    return 'no surface plan';
  }

  const focal = surfacePlan.focalClusterIds?.join(', ') || '-';
  const axes = surfacePlan.focalAxes?.join(', ') || '-';
  const emotion = surfacePlan.emotionalColor?.join(', ') || '-';
  const motion = surfacePlan.motionBias?.join(', ') || '-';
  const intent = surfacePlan.speakIntent || '-';
  const hold = surfacePlan.holdBack?.join(', ') || '-';
  const lines = surfacePlan.lineCountHint ?? 4;
  const expand = (surfacePlan.expansionBudget ?? 0).toFixed(2);
  const compress = (surfacePlan.compressionPressure ?? 0).toFixed(2);
  const others = surfacePlan.othersPresence?.hasOthers ? 'yes' : 'no';
  const forces = surfacePlan.othersPresence?.dominantForces?.join(', ') || '-';

  return `focal: ${focal} | axes: ${axes} | emotion: ${emotion} | motion: ${motion} | intent: ${intent} | hold: ${hold} | lines=${lines} / expand=${expand} / compress=${compress} | others=${others} / forces=${forces}`;
};
