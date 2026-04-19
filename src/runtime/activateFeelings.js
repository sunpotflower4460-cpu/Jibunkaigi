/**
 * activateFeelings.js
 * 顕在層 v0.1 L2 Phase: Activate feeling particles
 *
 * PURPOSE:
 * - Determine which feeling particles naturally rise to attention given current context
 * - Same activation philosophy as thoughts, but with slightly higher bodyAffinity influence
 *
 * IMPORTANT PRINCIPLES:
 * 1. activate は「選択」ではなく「浮かびやすさの前景化」
 * 2. 完成文を生成しない - 粒子を活性化するだけ
 * 3. anti-triggers は activate 段階で効かせる (スコア減点)
 * 4. 加算式でスコアリング (柔らかく活性化)
 * 5. shared と agent feeling 両方を見る
 * 6. bodyAffinity を thought より少し効かせる
 */

import { getFeelingReservoir } from '../reservoir/loadReservoir.js';

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
 * Calculate body affinity (stronger influence for feeling particles)
 * Feeling particles are more body-based than thought particles
 *
 * @param {string[]} nodeTags - Node tags
 * @param {object} bodySignals - Body signals from emergingField
 * @returns {number} Body affinity score (0-1)
 */
const calculateBodyAffinity = (nodeTags = [], bodySignals = {}) => {
  if (!bodySignals) return 0;

  const {
    tension = 0,
    softness = 0,
    urgency = 0,
    warmth = 0,
    contraction = 0,
  } = bodySignals;

  // Stronger associations between tags and body states for feelings
  let score = 0;

  if (nodeTags.includes('tightness') || nodeTags.includes('contraction') || nodeTags.includes('closing')) {
    score += contraction * 0.3;
  }

  if (nodeTags.includes('pressure') || nodeTags.includes('urgency') || nodeTags.includes('tension')) {
    score += urgency * 0.3;
  }

  if (nodeTags.includes('warmth') || nodeTags.includes('care') || nodeTags.includes('gentle')) {
    score += warmth * 0.25;
  }

  if (nodeTags.includes('roughness') || nodeTags.includes('friction') || nodeTags.includes('resistance')) {
    score += tension * 0.25;
  }

  if (nodeTags.includes('softness') || nodeTags.includes('opening') || nodeTags.includes('release')) {
    score += softness * 0.25;
  }

  if (nodeTags.includes('heaviness') || nodeTags.includes('weight') || nodeTags.includes('ground')) {
    score += (tension + contraction) * 0.15;
  }

  // Return higher boost than thoughts, minimum non-zero for feelings
  return Math.max(0.05, Math.min(0.5, score));
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

    // Check body signals
    if (antiTrigger.includes('body-dismissed') && bodySignals.tension < 0.2 && bodySignals.warmth < 0.2) {
      matchCount += 0.5;
    }
    if (antiTrigger.includes('rush') && bodySignals.urgency > 0.8) {
      matchCount += 0.5;
    }
  });

  return totalChecks > 0 ? Math.min(1, matchCount / totalChecks) : 0;
};

/**
 * Calculate activation score for a single feeling node
 *
 * Formula (additive):
 * activationScore = baseScore
 *   + triggerMatch * 0.4
 *   + agentAffinity * 0.2
 *   + resonanceMatch * 0.15
 *   + bodyAffinity * 0.25   (higher than thoughts)
 *   - antiTriggerMatch * 0.5
 *
 * @param {object} node - Feeling node
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

  const bodyAffinity = calculateBodyAffinity(
    node.tags,
    context.emergingField?.bodySignals || {}
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
    bodyAffinity * 0.25 -  // Higher weight for feelings
    antiTriggerMatch * 0.5;

  // Build reasons for debug
  const reasons = [];
  if (triggerMatch > 0.3) reasons.push('trigger-match');
  if (agentAffinity >= 0.20) reasons.push('owner-match');
  if (resonanceMatch > 0.3) reasons.push('axis-resonance');
  if (bodyAffinity > 0.15) reasons.push('body-affinity');
  if (antiTriggerMatch > 0.3) reasons.push('anti-trigger-suppression');

  return {
    score: Math.max(0, activationScore), // Don't go negative
    reasons,
  };
};

/**
 * Activate feeling particles
 *
 * @param {object} input - Activation input
 * @param {string} input.agentId - Agent ID
 * @param {string} input.userText - User input text
 * @param {object} input.preconditionBias - Precondition bias from earlier layers
 * @param {object} input.beliefTension - Belief tension from earlier layers
 * @param {object} input.emergingField - Emerging field (attention, resonance, body, atmosphere)
 * @param {number} [input.topN=4] - Number of top feelings to return
 * @returns {object} ActivateFeelingsResult
 */
export const activateFeelings = (input = {}) => {
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
      activatedFeelings: [],
      topFeelingIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };
  }

  // Load feeling reservoir (shared + agent)
  const feelingNodes = getFeelingReservoir(agentId);

  if (!feelingNodes || feelingNodes.length === 0) {
    return {
      activatedFeelings: [],
      topFeelingIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };
  }

  // Score all nodes
  const scoredNodes = feelingNodes.map((node) => {
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
  const activatedFeelings = scoredNodes.slice(0, selectedCount);
  const topFeelingIds = activatedFeelings.map((f) => f.nodeId);

  // Collect dominant axes from top feelings
  const axisCount = {};
  activatedFeelings.forEach((feeling) => {
    feeling.dominantAxis.forEach((axis) => {
      axisCount[axis] = (axisCount[axis] || 0) + 1;
    });
  });

  const dominantAxes = Object.entries(axisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([axis]) => axis);

  return {
    activatedFeelings,
    topFeelingIds,
    activationMeta: {
      totalCandidates: feelingNodes.length,
      selectedCount,
      dominantAxes,
    },
  };
};

/**
 * Format activated feelings for debug display
 * @param {object} result - ActivateFeelingsResult
 * @returns {string}
 */
export const formatActivatedFeelingsForDebug = (result) => {
  if (!result || !result.activatedFeelings || result.activatedFeelings.length === 0) {
    return 'no activated feelings';
  }

  const { activatedFeelings, activationMeta } = result;
  const top3 = activatedFeelings.slice(0, 3).map((f) => f.nodeId).join(', ');
  const axes = activationMeta.dominantAxes.join(', ');

  return `activated: ${activationMeta.selectedCount}/${activationMeta.totalCandidates} | top: ${top3} | axes: ${axes}`;
};
