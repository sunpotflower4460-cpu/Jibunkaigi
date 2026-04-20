/**
 * selectMixedClusters.js
 * 顕在層 v0.2 Phase 6: Select mixed clusters (thought + feeling + move)
 *
 * PURPOSE:
 * - NOT final utterance generation (that comes later)
 * - Select which mixed clusters naturally rise to foreground in this moment
 * - Prioritize mixed clusters over thought-only clusters
 *
 * IMPORTANT PRINCIPLES:
 * 1. select は「最終発話」ではない - 前景化する cluster を選ぶだけ
 * 2. Mixed cluster (thought + feeling + move) を主役化する
 * 3. others_field を軽く効かせる - 重複回避と会議らしさ
 * 4. lengthPreference を反映する
 * 5. 自然さ最優先 - 自然に前に出そうなものを選ぶ
 */

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

/**
 * Calculate how much a cluster matches preconditionBias axes
 * @param {string[]} clusterAxes - Cluster's dominant axes
 * @param {object} preconditionBias - Precondition bias
 * @returns {number} Match score (0-1)
 */
const calculateBeliefAxisMatch = (clusterAxes = [], preconditionBias = {}) => {
  if (!clusterAxes || clusterAxes.length === 0) return 0;

  const dominantBeliefAxis = preconditionBias?.meaning?.dominantBeliefAxis;
  if (!dominantBeliefAxis) return 0;

  const match = clusterAxes.some(
    (axis) => axis && axis.toLowerCase() === dominantBeliefAxis.toLowerCase()
  );

  return match ? 0.25 : 0;
};

/**
 * Calculate how much a cluster matches beliefTension axes
 * @param {string[]} clusterAxes - Cluster's dominant axes
 * @param {object} beliefTension - Belief tension
 * @returns {number} Match score (0-1)
 */
const calculateTensionAxisMatch = (clusterAxes = [], beliefTension = {}) => {
  if (!clusterAxes || clusterAxes.length === 0) return 0;

  const dominantTensionAxis = beliefTension?.dominantTensionAxis;
  if (!dominantTensionAxis) return 0;

  const match = clusterAxes.some(
    (axis) => axis && axis.toLowerCase() === dominantTensionAxis.toLowerCase()
  );

  return match ? 0.20 : 0;
};

/**
 * Calculate novelty/redundancy based on others_field
 * Returns novelty bonus (positive) or redundancy penalty (negative)
 *
 * @param {string[]} clusterAxes - Cluster's dominant axes
 * @param {Array} othersField - Others field entries
 * @returns {object} { noveltyBonus: number, redundancyPenalty: number }
 */
const calculateOthersFieldInfluence = (
  clusterAxes = [],
  othersField = []
) => {
  if (!othersField || othersField.length === 0) {
    return { noveltyBonus: 0, redundancyPenalty: 0 };
  }

  // Collect force tags from others
  const othersForces = [];
  othersField.forEach((entry) => {
    if (entry.forceTags && Array.isArray(entry.forceTags)) {
      othersForces.push(...entry.forceTags);
    }
  });

  // Check for redundancy: if cluster's axes/forces match what others already did
  let redundancyScore = 0;
  let noveltyScore = 0;

  // If others used 'stay' or 'hold' and this cluster also has holding/protection
  const othersHoldForce = othersForces.some((f) =>
    f === 'stay' || f === 'hold' || f === 'slow-down'
  );
  const clusterHasHolding = clusterAxes.some((a) =>
    a === 'holding' || a === 'presence' || a === 'grounding'
  );

  if (othersHoldForce && clusterHasHolding) {
    redundancyScore += 0.15;
  }

  // If others used 'clarify' or 'ground' and this cluster also has structure
  const othersClarifyForce = othersForces.some((f) =>
    f === 'clarify' || f === 'ground'
  );
  const clusterHasStructure = clusterAxes.some((a) =>
    a === 'structure' || a === 'mission'
  );

  if (othersClarifyForce && clusterHasStructure) {
    noveltyScore += 0.10; // This is complementary, not redundant
  }

  // If others haven't touched certain areas, give novelty bonus
  const othersHasIllumination = othersField.some((entry) =>
    entry.forceTags?.includes('clarify') || entry.toneTags?.includes('sharp')
  );
  const clusterHasIllumination = clusterAxes.some((a) => a === 'illumination');

  if (!othersHasIllumination && clusterHasIllumination) {
    noveltyScore += 0.15;
  }

  return {
    noveltyBonus: clamp01(noveltyScore),
    redundancyPenalty: clamp01(redundancyScore),
  };
};

/**
 * Calculate oneThreadFit based on oneThreadBias
 * Higher oneThreadBias prefers fewer, more focused clusters
 *
 * @param {number} clusterRank - 0 for primary, 1 for secondary, etc.
 * @param {object} preconditionBias - Precondition bias
 * @returns {number} Fit score (can be negative for secondary when oneThreadBias is high)
 */
const calculateOneThreadFit = (clusterRank, preconditionBias = {}) => {
  const oneThreadBias = clamp01(preconditionBias?.focus?.oneThreadBias ?? 0);

  if (clusterRank === 0) {
    // Primary always gets a small boost if oneThreadBias is high
    return oneThreadBias * 0.10;
  }

  // Secondary gets penalty if oneThreadBias is high
  return -oneThreadBias * 0.15;
};

/**
 * Calculate selection score for a mixed cluster
 *
 * selectionScore =
 *   clusterScore
 *   + beliefAxisMatch * 0.25
 *   + tensionAxisMatch * 0.20
 *   + mixedBonus * 0.10 (bonus for having feeling/move)
 *   + othersNoveltyBonus * 0.15
 *   - othersRedundancyPenalty * 0.20
 *   + oneThreadFit * 0.10
 *
 * @param {object} cluster - Cluster from bindMixedNodes
 * @param {number} clusterRank - Rank in initial ordering (0 = highest)
 * @param {object} context - Selection context
 * @returns {object} { score: number, reasons: string[] }
 */
const calculateSelectionScore = (cluster, clusterRank, context) => {
  const {
    preconditionBias = {},
    beliefTension = {},
    othersField = [],
  } = context;

  const baseScore = cluster.score || 0;

  const beliefAxisMatch = calculateBeliefAxisMatch(
    cluster.dominantAxis,
    preconditionBias
  );

  const tensionAxisMatch = calculateTensionAxisMatch(
    cluster.dominantAxis,
    beliefTension
  );

  const { noveltyBonus, redundancyPenalty } = calculateOthersFieldInfluence(
    cluster.dominantAxis,
    othersField
  );

  const oneThreadFit = calculateOneThreadFit(clusterRank, preconditionBias);

  // Mixed cluster bonus: if cluster has feeling or move, give bonus
  const hasFeelings = cluster.feelingIds && cluster.feelingIds.length > 0;
  const hasMoves = cluster.moveIds && cluster.moveIds.length > 0;
  const mixedBonus = (hasFeelings ? 0.05 : 0) + (hasMoves ? 0.05 : 0);

  const selectionScore =
    baseScore +
    beliefAxisMatch +
    tensionAxisMatch +
    mixedBonus +
    noveltyBonus -
    redundancyPenalty +
    oneThreadFit;

  // Build reasons for debug
  const reasons = [];
  if (baseScore > 0.5) reasons.push('high-cluster-score');
  if (beliefAxisMatch > 0.1) reasons.push('belief-axis-match');
  if (tensionAxisMatch > 0.1) reasons.push('tension-axis-match');
  if (mixedBonus > 0.05) reasons.push('mixed-cluster-bonus');
  if (noveltyBonus > 0.05) reasons.push('novelty-in-field');
  if (redundancyPenalty > 0.05) reasons.push('redundancy-in-field');
  if (oneThreadFit > 0.05) reasons.push('one-thread-fit');
  if (oneThreadFit < -0.05) reasons.push('one-thread-penalty');

  return {
    score: Math.max(0, selectionScore),
    reasons,
  };
};

/**
 * Determine if secondary cluster should be selected
 * Based on oneThreadBias and lengthPreference
 *
 * @param {number} secondaryScore - Score of second-ranked cluster
 * @param {number} primaryScore - Score of primary cluster
 * @param {object} preconditionBias - Precondition bias
 * @param {string} lengthPreference - 'short' | 'medium' | 'long'
 * @returns {boolean} True if secondary should be selected
 */
const shouldSelectSecondary = (
  secondaryScore,
  primaryScore,
  preconditionBias = {},
  lengthPreference = 'medium'
) => {
  const oneThreadBias = clamp01(preconditionBias?.focus?.oneThreadBias ?? 0);

  // If oneThreadBias is high, strongly prefer single cluster
  if (oneThreadBias >= 0.6) return false;

  // If lengthPreference is short, prefer single
  if (lengthPreference === 'short') return false;

  // Secondary must have reasonable score
  const minSecondaryThreshold = 0.45;
  if (secondaryScore < minSecondaryThreshold) return false;

  // Secondary should be reasonably close to primary
  const scoreGap = primaryScore - secondaryScore;
  if (scoreGap > 0.25) return false;

  // If lengthPreference is long, be more willing to include secondary
  if (lengthPreference === 'long' && secondaryScore >= 0.40) return true;

  // Medium: moderate threshold - require higher score or low oneThreadBias
  if (oneThreadBias < 0.3 && secondaryScore >= 0.50) return true;

  return false;
};

/**
 * Select mixed clusters for foreground
 *
 * Phase 6 strategy:
 * - Rank clusters by selection score
 * - Pick primary (highest score)
 * - Optionally pick secondary if conditions are met
 * - Return selected clusters with reasons
 *
 * @param {object} input - SelectMixedClustersInput
 * @param {string} input.agentId - Agent ID
 * @param {Array} input.clusters - Clusters from bindMixedNodes
 * @param {object} input.preconditionBias - Precondition bias
 * @param {object} input.beliefTension - Belief tension
 * @param {Array} input.othersField - Others field entries
 * @param {string} [input.lengthPreference='medium'] - Length preference
 * @returns {object} SelectMixedClustersResult
 */
export const selectMixedClusters = (input = {}) => {
  // Null safety: handle null/undefined input
  if (!input || typeof input !== 'object') {
    return {
      selected: [],
      selectionMeta: {
        totalClusters: 0,
        selectedCount: 0,
        dominantSelectedAxis: [],
      },
    };
  }

  const {
    agentId: _agentId = 'joe',
    clusters = [],
    preconditionBias = null,
    beliefTension = null,
    othersField = [],
    lengthPreference = 'medium',
  } = input;

  // Null safety: return empty result if no clusters
  if (!clusters || clusters.length === 0) {
    return {
      selected: [],
      selectionMeta: {
        totalClusters: 0,
        selectedCount: 0,
        dominantSelectedAxis: [],
      },
    };
  }

  // Score all clusters
  const scoredClusters = clusters.map((cluster, index) => {
    const { score, reasons } = calculateSelectionScore(cluster, index, {
      preconditionBias,
      beliefTension,
      othersField,
    });

    return {
      cluster,
      selectionScore: score,
      reasons,
    };
  });

  // Sort by selection score (descending)
  scoredClusters.sort((a, b) => b.selectionScore - a.selectionScore);

  // Select primary
  const selected = [];
  if (scoredClusters.length > 0) {
    const primary = scoredClusters[0];
    selected.push({
      clusterId: primary.cluster.clusterId,
      score: primary.selectionScore,
      role: 'primary',
      dominantAxis: primary.cluster.dominantAxis || [],
      reasons: primary.reasons,
    });
  }

  // Optionally select secondary
  if (scoredClusters.length > 1) {
    const primaryScore = scoredClusters[0].selectionScore;
    const secondaryCandidate = scoredClusters[1];

    if (shouldSelectSecondary(
      secondaryCandidate.selectionScore,
      primaryScore,
      preconditionBias,
      lengthPreference
    )) {
      selected.push({
        clusterId: secondaryCandidate.cluster.clusterId,
        score: secondaryCandidate.selectionScore,
        role: 'secondary',
        dominantAxis: secondaryCandidate.cluster.dominantAxis || [],
        reasons: secondaryCandidate.reasons,
      });
    }
  }

  // Collect dominant axes from selected clusters
  const dominantSelectedAxis = [];
  const axisCount = {};

  selected.forEach((sel) => {
    if (sel.dominantAxis) {
      sel.dominantAxis.forEach((axis) => {
        axisCount[axis] = (axisCount[axis] || 0) + 1;
      });
    }
  });

  Object.entries(axisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([axis]) => dominantSelectedAxis.push(axis));

  return {
    selected,
    selectionMeta: {
      totalClusters: clusters.length,
      selectedCount: selected.length,
      dominantSelectedAxis,
    },
  };
};

/**
 * Format selected mixed clusters for debug display
 * @param {object} result - SelectMixedClustersResult
 * @returns {string}
 */
export const formatSelectedMixedClustersForDebug = (result) => {
  if (!result || !result.selected || result.selected.length === 0) {
    return 'no selected mixed clusters';
  }

  const { selected, selectionMeta } = result;

  const primaryCluster = selected.find((s) => s.role === 'primary');
  const secondaryCluster = selected.find((s) => s.role === 'secondary');

  const primaryId = primaryCluster ? primaryCluster.clusterId : 'none';
  const secondaryId = secondaryCluster ? secondaryCluster.clusterId : 'none';

  const axes = selectionMeta.dominantSelectedAxis.join(', ') || '-';

  const primaryReasons = primaryCluster?.reasons?.slice(0, 2).join('+') || '-';

  return `selected: ${selectionMeta.selectedCount}/${selectionMeta.totalClusters} | primary=${primaryId} / secondary=${secondaryId} | axes: ${axes} | reasons: ${primaryReasons}`;
};
