/**
 * activateMoves.js
 * 顕在層 v0.1 L2 Phase: Activate move particles
 *
 * PURPOSE:
 * - Determine which move particles (directional inclinations) naturally rise to attention
 * - Same activation philosophy as thoughts, with slight influence from focus/pacing
 *
 * IMPORTANT PRINCIPLES:
 * 1. activate は「選択」ではなく「浮かびやすさの前景化」
 * 2. 完成文を生成しない - 粒子を活性化するだけ
 * 3. anti-triggers は activate 段階で効かせる (スコア減点)
 * 4. 加算式でスコアリング (柔らかく活性化)
 * 5. shared と agent move 両方を見る
 * 6. focus/pacing の影響を少し受けやすい
 */

import { getMoveReservoir } from '../reservoir/loadReservoir.js';

/**
 * Normalize string for matching (lowercase, trim)
 * @param {string} text
 * @returns {string}
 */
const normalizeText = (text) => {
  return String(text || '').toLowerCase().trim();
};

/**
 * Check if any trigger patterns match the context
 * @param {string[]} triggers - Array of trigger patterns
 * @param {object} context - Context to match against
 * @returns {number} Match score (0-1)
 */
const calculateTriggerMatch = (triggers = [], context = {}) => {
  if (!triggers || triggers.length === 0) return 0;

  const { userText = '', attentionTargets = [], atmosphere = [] } = context;
  const normalizedUser = normalizeText(userText);
  const normalizedTargets = attentionTargets.map(normalizeText);
  const normalizedAtmosphere = atmosphere.map(normalizeText);

  let matchCount = 0;
  let totalChecks = 0;

  triggers.forEach((trigger) => {
    const normalizedTrigger = normalizeText(trigger);
    totalChecks++;

    // Check userText
    if (normalizedUser.includes(normalizedTrigger) || normalizedTrigger.includes(normalizedUser.slice(0, 10))) {
      matchCount += 1;
      return;
    }

    // Check attentionTargets
    if (normalizedTargets.some((target) => target.includes(normalizedTrigger) || normalizedTrigger.includes(target))) {
      matchCount += 0.7;
      return;
    }

    // Check atmosphere
    if (normalizedAtmosphere.some((atm) => atm.includes(normalizedTrigger) || normalizedTrigger.includes(atm))) {
      matchCount += 0.5;
      return;
    }
  });

  return totalChecks > 0 ? Math.min(1, matchCount / totalChecks) : 0;
};

/**
 * Calculate agent affinity score
 * shared: neutral (0.10)
 * owner matches agentId: higher (0.20)
 *
 * @param {string} nodeOwner - Node owner
 * @param {string} agentId - Current agent ID
 * @returns {number} Affinity score
 */
const calculateAgentAffinity = (nodeOwner, agentId) => {
  if (nodeOwner === 'shared') return 0.10;
  if (nodeOwner === agentId) return 0.20;
  return 0.05; // Other agents' nodes get small boost
};

/**
 * Calculate resonance with belief/tension axes
 * @param {string[]} nodeAxes - Node's axes
 * @param {object} context - Context with resonanceAxes, dominantBeliefAxis, dominantTensionAxis
 * @returns {number} Resonance score (0-1)
 */
const calculateResonanceMatch = (nodeAxes = [], context = {}) => {
  if (!nodeAxes || nodeAxes.length === 0) return 0;

  const { resonanceAxes = [], dominantBeliefAxis = null, dominantTensionAxis = null } = context;

  let score = 0;
  let checks = 0;

  nodeAxes.forEach((axis) => {
    const normalizedAxis = normalizeText(axis);

    // Check dominantBeliefAxis
    if (dominantBeliefAxis && normalizeText(dominantBeliefAxis) === normalizedAxis) {
      score += 0.5;
      checks++;
    }

    // Check dominantTensionAxis
    if (dominantTensionAxis && normalizeText(dominantTensionAxis) === normalizedAxis) {
      score += 0.4;
      checks++;
    }

    // Check resonanceAxes
    if (resonanceAxes.some((resAxis) => normalizeText(resAxis) === normalizedAxis)) {
      score += 0.3;
      checks++;
    }
  });

  return checks > 0 ? Math.min(1, score / checks) : 0;
};

/**
 * Calculate focus/pacing affinity (move particles are influenced by focus and pacing)
 * @param {string[]} nodeTags - Node tags
 * @param {object} preconditionBias - Precondition bias with focus/pacing
 * @returns {number} Focus/pacing affinity score (0-1)
 */
const calculateFocusPacingAffinity = (nodeTags = [], preconditionBias = {}) => {
  if (!preconditionBias) return 0;

  const { focus = {}, pacing = {} } = preconditionBias;
  const {
    oneThreadBias = 0,
    antiOverExpansion = 0,
  } = focus;
  const {
    slowDown = 0,
    returnBias = 0,
  } = pacing;

  let score = 0;

  // Focus-related tags
  if (nodeTags.includes('focus') || nodeTags.includes('single-point') || nodeTags.includes('checking')) {
    score += oneThreadBias * 0.2;
  }

  if (nodeTags.includes('not-closing') || nodeTags.includes('remaining-open') || nodeTags.includes('preserving')) {
    score += (1 - antiOverExpansion) * 0.15;
  }

  // Pacing-related tags
  if (nodeTags.includes('pausing') || nodeTags.includes('not-pushing') || nodeTags.includes('holding')) {
    score += slowDown * 0.2;
  }

  if (nodeTags.includes('returning') || nodeTags.includes('grounding') || nodeTags.includes('stabilizing')) {
    score += returnBias * 0.15;
  }

  return Math.min(0.3, score);
};

/**
 * Check if anti-triggers match (for score reduction)
 * @param {string[]} antiTriggers - Anti-trigger patterns
 * @param {object} context - Context to check against
 * @returns {number} Anti-trigger match score (0-1)
 */
const calculateAntiTriggerMatch = (antiTriggers = [], context = {}) => {
  if (!antiTriggers || antiTriggers.length === 0) return 0;

  const {
    userText = '',
    attentionTargets = [],
    atmosphere = [],
    bodySignals = {},
  } = context;

  const normalizedUser = normalizeText(userText);
  const normalizedTargets = attentionTargets.map(normalizeText);
  const normalizedAtmosphere = atmosphere.map(normalizeText);

  let matchCount = 0;
  let totalChecks = 0;

  antiTriggers.forEach((antiTrigger) => {
    const normalizedAnti = normalizeText(antiTrigger);
    totalChecks++;

    // Check userText
    if (normalizedUser.includes(normalizedAnti)) {
      matchCount += 1;
      return;
    }

    // Check attentionTargets
    if (normalizedTargets.some((target) => target.includes(normalizedAnti))) {
      matchCount += 0.8;
      return;
    }

    // Check atmosphere
    if (normalizedAtmosphere.some((atm) => atm.includes(normalizedAnti))) {
      matchCount += 0.6;
      return;
    }

    // Check body signals (high urgency suppresses certain moves)
    if (antiTrigger.includes('force-') && bodySignals.urgency > 0.8) {
      matchCount += 0.5;
    }
  });

  return totalChecks > 0 ? Math.min(1, matchCount / totalChecks) : 0;
};

/**
 * Calculate activation score for a single move node
 *
 * Formula (additive):
 * activationScore = baseScore
 *   + triggerMatch * 0.4
 *   + agentAffinity * 0.2
 *   + resonanceMatch * 0.15
 *   + focusPacingAffinity * 0.25
 *   - antiTriggerMatch * 0.5
 *
 * @param {object} node - Move node
 * @param {string} agentId - Current agent ID
 * @param {object} context - Activation context
 * @returns {object} { score: number, reasons: string[] }
 */
const calculateActivationScore = (node, agentId, context) => {
  const baseScore = node.weight || 0.5;

  const triggerMatch = calculateTriggerMatch(node.triggers, {
    userText: context.userText,
    attentionTargets: context.emergingField?.attentionTargets || [],
    atmosphere: context.emergingField?.atmosphere || [],
  });

  const agentAffinity = calculateAgentAffinity(node.owner, agentId);

  const resonanceMatch = calculateResonanceMatch(node.axis, {
    resonanceAxes: context.emergingField?.resonanceAxes || [],
    dominantBeliefAxis: context.preconditionBias?.dominantBeliefAxis || context.beliefTension?.dominantTensionAxis,
    dominantTensionAxis: context.beliefTension?.dominantTensionAxis,
  });

  const focusPacingAffinity = calculateFocusPacingAffinity(
    node.tags,
    context.preconditionBias || {}
  );

  const antiTriggerMatch = calculateAntiTriggerMatch(node.antiTriggers, {
    userText: context.userText,
    attentionTargets: context.emergingField?.attentionTargets || [],
    atmosphere: context.emergingField?.atmosphere || [],
    bodySignals: context.emergingField?.bodySignals || {},
  });

  const activationScore =
    baseScore +
    triggerMatch * 0.4 +
    agentAffinity * 0.2 +
    resonanceMatch * 0.15 +
    focusPacingAffinity * 0.25 +
    -antiTriggerMatch * 0.5;

  // Build reasons for debug
  const reasons = [];
  if (triggerMatch > 0.3) reasons.push('trigger-match');
  if (agentAffinity >= 0.20) reasons.push('owner-match');
  if (resonanceMatch > 0.3) reasons.push('axis-resonance');
  if (focusPacingAffinity > 0.1) reasons.push('focus-pacing-affinity');
  if (antiTriggerMatch > 0.3) reasons.push('anti-trigger-suppression');

  return {
    score: Math.max(0, activationScore), // Don't go negative
    reasons,
  };
};

/**
 * Activate move particles
 *
 * @param {object} input - Activation input
 * @param {string} input.agentId - Agent ID
 * @param {string} input.userText - User input text
 * @param {object} input.preconditionBias - Precondition bias from earlier layers
 * @param {object} input.beliefTension - Belief tension from earlier layers
 * @param {object} input.emergingField - Emerging field (attention, resonance, body, atmosphere)
 * @param {number} [input.topN=4] - Number of top moves to return
 * @returns {object} ActivateMovesResult
 */
export const activateMoves = (input = {}) => {
  const {
    agentId = 'joe',
    userText = '',
    preconditionBias = null,
    beliefTension = null,
    emergingField = null,
    topN = 4,
  } = input;

  // Validate agentId
  const validAgents = ['joe', 'ken', 'mina', 'ray', 'satou', 'mirror'];
  if (!validAgents.includes(agentId)) {
    return {
      activatedMoves: [],
      topMoveIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };
  }

  // Load move reservoir (shared + agent)
  const moveNodes = getMoveReservoir(agentId);

  if (!moveNodes || moveNodes.length === 0) {
    return {
      activatedMoves: [],
      topMoveIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };
  }

  // Score all nodes
  const scoredNodes = moveNodes.map((node) => {
    const { score, reasons } = calculateActivationScore(node, agentId, {
      userText,
      preconditionBias,
      beliefTension,
      emergingField,
    });

    return {
      nodeId: node.id,
      owner: node.owner,
      textSeed: node.textSeed,
      score,
      reasons,
      dominantAxis: node.axis || [],
    };
  });

  // Sort by score (descending)
  scoredNodes.sort((a, b) => b.score - a.score);

  // Select top N
  const selectedCount = Math.min(topN, scoredNodes.length);
  const activatedMoves = scoredNodes.slice(0, selectedCount);
  const topMoveIds = activatedMoves.map((m) => m.nodeId);

  // Collect dominant axes from top moves
  const axisCount = {};
  activatedMoves.forEach((move) => {
    move.dominantAxis.forEach((axis) => {
      axisCount[axis] = (axisCount[axis] || 0) + 1;
    });
  });

  const dominantAxes = Object.entries(axisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([axis]) => axis);

  return {
    activatedMoves,
    topMoveIds,
    activationMeta: {
      totalCandidates: moveNodes.length,
      selectedCount,
      dominantAxes,
    },
  };
};

/**
 * Format activated moves for debug display
 * @param {object} result - ActivateMovesResult
 * @returns {string}
 */
export const formatActivatedMovesForDebug = (result) => {
  if (!result || !result.activatedMoves || result.activatedMoves.length === 0) {
    return 'no activated moves';
  }

  const { activatedMoves, activationMeta } = result;
  const top3 = activatedMoves.slice(0, 3).map((m) => m.nodeId).join(', ');
  const axes = activationMeta.dominantAxes.join(', ');

  return `activated: ${activationMeta.selectedCount}/${activationMeta.totalCandidates} | top: ${top3} | axes: ${axes}`;
};
