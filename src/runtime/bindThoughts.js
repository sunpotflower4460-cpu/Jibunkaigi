/**
 * bindThoughts.js
 * 顕在層 v0.1 Phase 5: Bind minimal implementation
 *
 * PURPOSE:
 * - NOT final selection (select phase comes later)
 * - NOT complete sentence generation
 * - Connect activated thoughts into small meaningful clusters based on relations
 *
 * IMPORTANT PRINCIPLES:
 * 1. bind は「最終選択」ではない - まだ何を話すか決めない
 * 2. bind は完成文生成ではない - cluster を作るだけ
 * 3. 今回は thought だけ - feeling/move は後回し
 * 4. relation があるものをまず優先する
 * 5. 単独粒子も残す - bind されなくても single cluster として保持
 * 6. tensions_with も切り捨てない - 摩擦を含む塊として保持
 */

const DEFAULT_BIND_THRESHOLD = 0.35;

/**
 * Calculate bind score between two thoughts based on their relation
 *
 * bindScore = relation.weight * 0.5 + fromActivationScore * 0.25 + toActivationScore * 0.25
 *
 * @param {object} relation - Relation between two thoughts
 * @param {object} fromThought - Source thought with activation score
 * @param {object} toThought - Target thought with activation score
 * @returns {number} Bind score (0-1)
 */
const calculateBindScore = (relation, fromThought, toThought) => {
  if (!relation || !fromThought || !toThought) return 0;

  const relationWeight = relation.weight || 0;
  const fromScore = fromThought.score || 0;
  const toScore = toThought.score || 0;

  const bindScore = relationWeight * 0.5 + fromScore * 0.25 + toScore * 0.25;

  return Math.max(0, Math.min(1, bindScore));
};

/**
 * Generate unique cluster ID
 * @param {string} type - 'single' or 'bound'
 * @param {string[]} thoughtIds - Thought IDs in this cluster
 * @returns {string}
 */
const generateClusterId = (type, thoughtIds) => {
  if (type === 'single' && thoughtIds.length === 1) {
    return `cluster_single_${thoughtIds[0]}`;
  }
  return `cluster_bound_${thoughtIds.join('_')}`;
};

/**
 * Calculate cluster score from thoughts
 * For bound clusters: average of thought scores
 * For single clusters: just the thought score
 *
 * @param {object[]} thoughts - Thoughts in this cluster
 * @param {object[]} relations - Relations used in this cluster
 * @returns {number}
 */
const calculateClusterScore = (thoughts, relations = []) => {
  if (!thoughts || thoughts.length === 0) return 0;

  if (thoughts.length === 1) {
    return thoughts[0].score || 0;
  }

  // For bound clusters, average thought scores with slight boost from relations
  const thoughtScoreAvg = thoughts.reduce((sum, t) => sum + (t.score || 0), 0) / thoughts.length;
  const relationBoost = relations.length > 0 ? 0.05 : 0;

  return Math.min(1, thoughtScoreAvg + relationBoost);
};

/**
 * Extract dominant axes from thoughts
 * @param {object[]} thoughts - Thoughts with dominantAxis arrays
 * @returns {string[]}
 */
const extractDominantAxes = (thoughts) => {
  const axisCount = {};

  thoughts.forEach((thought) => {
    const axes = thought.dominantAxis || [];
    axes.forEach((axis) => {
      axisCount[axis] = (axisCount[axis] || 0) + 1;
    });
  });

  return Object.entries(axisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([axis]) => axis);
};

/**
 * Bind activated thoughts into clusters based on relations
 *
 * Phase 5 strategy: Pair binding only (no complex graph clustering)
 * - If two thoughts have a relation and both are activated, try to bind them
 * - If bindScore >= threshold, create a bound cluster
 * - Otherwise, leave as singles
 * - tensions_with は切り捨てず、摩擦を含む cluster として保持
 *
 * @param {object} input - BindThoughtsInput
 * @param {Array} input.activatedThoughts - Activated thoughts from Phase 4
 * @param {Array} input.relations - Node relations
 * @param {number} [input.bindThreshold=0.35] - Minimum score to bind
 * @returns {object} BindThoughtsResult
 */
export const bindThoughts = (input = {}) => {
  const {
    activatedThoughts = [],
    relations = [],
    bindThreshold = DEFAULT_BIND_THRESHOLD,
  } = input;

  // Null safety: return empty result if no thoughts
  if (!activatedThoughts || activatedThoughts.length === 0) {
    return {
      clusters: [],
      clusterMeta: {
        totalActivatedThoughts: 0,
        totalClusters: 0,
        boundClusterCount: 0,
        singleClusterCount: 0,
      },
    };
  }

  // Build lookup map for activated thoughts
  const thoughtMap = new Map();
  activatedThoughts.forEach((thought) => {
    thoughtMap.set(thought.nodeId, thought);
  });

  // Track which thoughts have been bound
  const boundThoughts = new Set();
  const clusters = [];

  // Phase 5: Simple pair binding only
  // For each relation, check if both ends are activated and try to bind
  relations.forEach((relation) => {
    const fromThought = thoughtMap.get(relation.from);
    const toThought = thoughtMap.get(relation.to);

    // Both thoughts must be activated
    if (!fromThought || !toThought) return;

    // Skip if either is already bound
    if (boundThoughts.has(relation.from) || boundThoughts.has(relation.to)) return;

    // Calculate bind score
    const bindScore = calculateBindScore(relation, fromThought, toThought);

    // If score is above threshold, create bound cluster
    if (bindScore >= bindThreshold) {
      const thoughts = [fromThought, toThought];
      const thoughtIds = [relation.from, relation.to];

      clusters.push({
        id: generateClusterId('bound', thoughtIds),
        thoughtIds,
        relationIds: [relation.id],
        clusterType: 'bound',
        score: calculateClusterScore(thoughts, [relation]),
        dominantAxis: extractDominantAxes(thoughts),
        relationTypes: [relation.relationType],
      });

      // Mark as bound
      boundThoughts.add(relation.from);
      boundThoughts.add(relation.to);
    }
  });

  // Create single clusters for unbound thoughts
  activatedThoughts.forEach((thought) => {
    if (!boundThoughts.has(thought.nodeId)) {
      clusters.push({
        id: generateClusterId('single', [thought.nodeId]),
        thoughtIds: [thought.nodeId],
        relationIds: [],
        clusterType: 'single',
        score: thought.score,
        dominantAxis: thought.dominantAxis || [],
        relationTypes: [],
      });
    }
  });

  // Sort clusters by score (descending)
  clusters.sort((a, b) => b.score - a.score);

  const boundClusterCount = clusters.filter((c) => c.clusterType === 'bound').length;
  const singleClusterCount = clusters.filter((c) => c.clusterType === 'single').length;

  return {
    clusters,
    clusterMeta: {
      totalActivatedThoughts: activatedThoughts.length,
      totalClusters: clusters.length,
      boundClusterCount,
      singleClusterCount,
    },
  };
};

/**
 * Format bound thoughts for debug display
 * @param {object} result - BindThoughtsResult
 * @returns {string}
 */
export const formatBoundThoughtsForDebug = (result) => {
  if (!result || !result.clusters || result.clusters.length === 0) {
    return 'no bound clusters';
  }

  const { clusters, clusterMeta } = result;
  const boundCount = clusterMeta.boundClusterCount || 0;
  const singleCount = clusterMeta.singleClusterCount || 0;

  const topBoundCluster = clusters.find((c) => c.clusterType === 'bound');
  const topBoundPreview = topBoundCluster
    ? `${topBoundCluster.thoughtIds.join(' + ')}`
    : 'none';

  const relationTypesPreview = topBoundCluster
    ? topBoundCluster.relationTypes.join(', ')
    : '-';

  const axes = topBoundCluster
    ? topBoundCluster.dominantAxis.slice(0, 2).join(', ')
    : '-';

  return `clusters: bound=${boundCount} / single=${singleCount} | top: ${topBoundPreview} | rel: ${relationTypesPreview} | axes: ${axes}`;
};
