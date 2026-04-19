/**
 * bindMixedNodes.js
 * 顕在層 v0.1 Mixed Cluster Phase: Bind minimal implementation
 *
 * PURPOSE:
 * - NOT final selection (select phase comes later)
 * - NOT complete sentence generation
 * - Connect activated thoughts/feelings/moves into small meaningful mixed clusters
 *
 * IMPORTANT PRINCIPLES:
 * 1. bind は「最終選択」ではない - まだ何を話すか決めない
 * 2. bind は完成文生成ではない - cluster を作るだけ
 * 3. thought を核にする - feeling/move はそこに結びつく
 * 4. relation があるものをまず優先する
 * 5. 単独粒子も残す - bind されなくても single cluster として保持
 * 6. tensions_with も切り捨てない - 摩擦を含む塊として保持
 */

const DEFAULT_BIND_THRESHOLD = 0.35;

/**
 * Calculate bind score for a mixed cluster
 *
 * mixedBindScore =
 *   relation.weight * 0.4
 *   + thoughtScore * 0.25
 *   + linkedNodeScore * 0.20
 *   + axisOverlapBonus * 0.15
 *
 * @param {object} relation - Relation between nodes
 * @param {object} thoughtNode - Thought node with activation score
 * @param {object} linkedNode - Feeling or move node with activation score
 * @param {object} context - Context with dominantAxes
 * @returns {number} Bind score (0-1)
 */
const calculateMixedBindScore = (relation, thoughtNode, linkedNode, _context = {}) => {
  if (!relation || !thoughtNode || !linkedNode) return 0;

  const relationWeight = relation.weight || 0;
  const thoughtScore = thoughtNode.score || 0;
  const linkedScore = linkedNode.score || 0;

  // Check axis overlap between thought and linked node
  const thoughtAxes = thoughtNode.dominantAxis || [];
  const linkedAxes = linkedNode.dominantAxis || [];
  const axisOverlap = thoughtAxes.filter(axis => linkedAxes.includes(axis)).length;
  const axisOverlapBonus = axisOverlap > 0 ? Math.min(0.15, axisOverlap * 0.08) : 0;

  const bindScore =
    relationWeight * 0.4 +
    thoughtScore * 0.25 +
    linkedScore * 0.20 +
    axisOverlapBonus;

  return Math.max(0, Math.min(1, bindScore));
};

/**
 * Generate unique mixed cluster ID
 * @param {string} type - 'single' or 'bound'
 * @param {string[]} thoughtIds - Thought IDs in this cluster
 * @param {string[]} feelingIds - Feeling IDs in this cluster
 * @param {string[]} moveIds - Move IDs in this cluster
 * @returns {string}
 */
const generateMixedClusterId = (type, thoughtIds, feelingIds, moveIds) => {
  if (type === 'single') {
    const allIds = [...thoughtIds, ...feelingIds, ...moveIds];
    if (allIds.length === 1) {
      return `mixed_cluster_single_${allIds[0]}`;
    }
  }
  const allIds = [...thoughtIds, ...feelingIds, ...moveIds].sort();
  return `mixed_cluster_bound_${allIds.join('_')}`;
};

/**
 * Calculate cluster score from nodes
 * For bound clusters: weighted average of node scores
 * For single clusters: just the node score
 *
 * @param {object[]} thoughts - Thoughts in this cluster
 * @param {object[]} feelings - Feelings in this cluster
 * @param {object[]} moves - Moves in this cluster
 * @param {object[]} relations - Relations used in this cluster
 * @returns {number}
 */
const calculateMixedClusterScore = (thoughts, feelings, moves, relations = []) => {
  const allNodes = [...thoughts, ...feelings, ...moves];
  if (allNodes.length === 0) return 0;

  if (allNodes.length === 1) {
    return allNodes[0].score || 0;
  }

  // For bound clusters, weighted average with thought as primary
  const thoughtScore = thoughts.reduce((sum, t) => sum + (t.score || 0), 0) / Math.max(1, thoughts.length);
  const feelingScore = feelings.reduce((sum, f) => sum + (f.score || 0), 0) / Math.max(1, feelings.length);
  const moveScore = moves.reduce((sum, m) => sum + (m.score || 0), 0) / Math.max(1, moves.length);

  const thoughtWeight = 0.5;
  const feelingWeight = feelings.length > 0 ? 0.25 : 0;
  const moveWeight = moves.length > 0 ? 0.25 : 0;

  const totalWeight = thoughtWeight + feelingWeight + moveWeight;
  const normalizedScore =
    (thoughtScore * thoughtWeight +
      feelingScore * feelingWeight +
      moveScore * moveWeight) / totalWeight;

  // Small boost from having relations
  const relationBoost = relations.length > 0 ? 0.05 : 0;

  return Math.min(1, normalizedScore + relationBoost);
};

/**
 * Extract dominant axes from mixed nodes
 * @param {object[]} thoughts - Thoughts with dominantAxis arrays
 * @param {object[]} feelings - Feelings with dominantAxis arrays
 * @param {object[]} moves - Moves with dominantAxis arrays
 * @returns {string[]}
 */
const extractMixedDominantAxes = (thoughts, feelings, moves) => {
  const axisCount = {};

  [...thoughts, ...feelings, ...moves].forEach((node) => {
    const axes = node.dominantAxis || [];
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
 * Extract relation types from relations
 * @param {object[]} relations - Relations in this cluster
 * @returns {string[]}
 */
const extractRelationTypes = (relations) => {
  const typeCount = {};

  relations.forEach((rel) => {
    const type = rel.relationType || 'unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  return Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);
};

/**
 * Bind activated thoughts/feelings/moves into mixed clusters
 *
 * Strategy: thought-centered grouping
 * 1. For each activated thought
 * 2. Find feelings/moves connected by relations
 * 3. Calculate bind scores
 * 4. Create mixed cluster if score above threshold
 * 5. Keep unbound nodes as single clusters
 *
 * @param {object} input - Input with activated nodes and relations
 * @param {object[]} input.activatedThoughts - Activated thought nodes
 * @param {object[]} input.activatedFeelings - Activated feeling nodes
 * @param {object[]} input.activatedMoves - Activated move nodes
 * @param {object[]} input.relations - Relations between nodes
 * @param {number} [input.bindThreshold] - Minimum bind score (default 0.35)
 * @returns {object} - MixedCluster result with clusters and meta
 */
export const bindMixedNodes = ({
  activatedThoughts = [],
  activatedFeelings = [],
  activatedMoves = [],
  relations = [],
  bindThreshold = DEFAULT_BIND_THRESHOLD,
} = {}) => {
  const clusters = [];
  const boundThoughts = new Set();
  const boundFeelings = new Set();
  const boundMoves = new Set();

  // Build relation lookup maps
  const relationsFrom = new Map();
  relations.forEach(rel => {
    if (!relationsFrom.has(rel.from)) {
      relationsFrom.set(rel.from, []);
    }
    relationsFrom.get(rel.from).push(rel);
  });

  // Thought-centered clustering
  activatedThoughts.forEach(thought => {
    const thoughtId = thought.nodeId;
    const outgoingRels = relationsFrom.get(thoughtId) || [];

    if (outgoingRels.length === 0) {
      // No relations: create single thought cluster
      return;
    }

    // Find connected feelings and moves
    const connectedFeelings = [];
    const connectedMoves = [];
    const clusterRelations = [];

    outgoingRels.forEach(rel => {
      const targetId = rel.to;

      // Check if target is an activated feeling
      const feeling = activatedFeelings.find(f => f.nodeId === targetId);
      if (feeling && !boundFeelings.has(targetId)) {
        const bindScore = calculateMixedBindScore(rel, thought, feeling);
        if (bindScore >= bindThreshold) {
          connectedFeelings.push(feeling);
          clusterRelations.push(rel);
          boundFeelings.add(targetId);
        }
      }

      // Check if target is an activated move
      const move = activatedMoves.find(m => m.nodeId === targetId);
      if (move && !boundMoves.has(targetId)) {
        const bindScore = calculateMixedBindScore(rel, thought, move);
        if (bindScore >= bindThreshold) {
          connectedMoves.push(move);
          clusterRelations.push(rel);
          boundMoves.add(targetId);
        }
      }
    });

    // Create cluster if we have at least one connection
    if (connectedFeelings.length > 0 || connectedMoves.length > 0) {
      const thoughtIds = [thoughtId];
      const feelingIds = connectedFeelings.map(f => f.nodeId);
      const moveIds = connectedMoves.map(m => m.nodeId);

      const cluster = {
        id: generateMixedClusterId('bound', thoughtIds, feelingIds, moveIds),
        thoughtIds,
        feelingIds,
        moveIds,
        relationIds: clusterRelations.map(r => r.id),
        clusterType: 'bound',
        score: calculateMixedClusterScore([thought], connectedFeelings, connectedMoves, clusterRelations),
        dominantAxis: extractMixedDominantAxes([thought], connectedFeelings, connectedMoves),
        relationTypes: extractRelationTypes(clusterRelations),
      };

      clusters.push(cluster);
      boundThoughts.add(thoughtId);
    }
  });

  // Create single clusters for unbound nodes
  activatedThoughts.forEach(thought => {
    if (!boundThoughts.has(thought.nodeId)) {
      clusters.push({
        id: generateMixedClusterId('single', [thought.nodeId], [], []),
        thoughtIds: [thought.nodeId],
        feelingIds: [],
        moveIds: [],
        relationIds: [],
        clusterType: 'single',
        score: thought.score || 0,
        dominantAxis: thought.dominantAxis || [],
        relationTypes: [],
      });
    }
  });

  activatedFeelings.forEach(feeling => {
    if (!boundFeelings.has(feeling.nodeId)) {
      clusters.push({
        id: generateMixedClusterId('single', [], [feeling.nodeId], []),
        thoughtIds: [],
        feelingIds: [feeling.nodeId],
        moveIds: [],
        relationIds: [],
        clusterType: 'single',
        score: feeling.score || 0,
        dominantAxis: feeling.dominantAxis || [],
        relationTypes: [],
      });
    }
  });

  activatedMoves.forEach(move => {
    if (!boundMoves.has(move.nodeId)) {
      clusters.push({
        id: generateMixedClusterId('single', [], [], [move.nodeId]),
        thoughtIds: [],
        feelingIds: [],
        moveIds: [move.nodeId],
        relationIds: [],
        clusterType: 'single',
        score: move.score || 0,
        dominantAxis: move.dominantAxis || [],
        relationTypes: [],
      });
    }
  });

  // Sort clusters by score (highest first)
  clusters.sort((a, b) => b.score - a.score);

  const totalActivatedNodes = activatedThoughts.length + activatedFeelings.length + activatedMoves.length;
  const boundClusterCount = clusters.filter(c => c.clusterType === 'bound').length;
  const singleClusterCount = clusters.filter(c => c.clusterType === 'single').length;

  return {
    clusters,
    clusterMeta: {
      totalActivatedNodes,
      totalClusters: clusters.length,
      boundClusterCount,
      singleClusterCount,
    },
  };
};
