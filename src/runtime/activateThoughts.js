/**
 * activateThoughts.js
 * 顕在層 v0.1 Phase 4: Activate minimal implementation
 *
 * PURPOSE:
 * - NOT final selection (select phase comes later)
 * - NOT complete sentence generation
 * - Determine which thought particles naturally rise to attention given current context
 *
 * IMPORTANT PRINCIPLES:
 * 1. activate は「選択」ではなく「浮かびやすさの前景化」
 * 2. 完成文を生成しない - 粒子を活性化するだけ
 * 3. anti-triggers は activate 段階で効かせる (スコア減点)
 * 4. 加算式でスコアリング (柔らかく活性化)
 * 5. shared と agent thought 両方を見る
 * 6. Phase 4 は thought 粒子のみ (feeling/move は後)
 */

import { getThoughtReservoir } from '../reservoir/loadReservoir.js';

const AGENT_ALIAS_MAP = {
  creative: 'joe',
};

/**
 * Normalize string for matching (lowercase, trim)
 * @param {string} text
 * @returns {string}
 */
const normalizeText = (text) => {
  return String(text || '').toLowerCase().trim();
};

const canonicalizeAgentId = (agentId) => AGENT_ALIAS_MAP[normalizeText(agentId)] || normalizeText(agentId);

const extractNarrativeTokens = (protoMeaning = {}) => {
  if (!Array.isArray(protoMeaning?.narrative)) return [];

  const cues = new Set();

  protoMeaning.narrative.forEach((line) => {
    const normalizedLine = normalizeText(line);
    if (!normalizedLine) return;

    if (/残|火種|消していない|芯/.test(normalizedLine)) {
      ['remaining', 'alive', 'remnant', 'core', 'mattering'].forEach((cue) => cues.add(cue));
    }
    if (/守り|壊さず/.test(normalizedLine)) {
      ['holding', 'protect', 'held-back'].forEach((cue) => cues.add(cue));
    }
    if (/届|前に出|向き/.test(normalizedLine)) {
      ['direction', 'forward', 'motion', 'want-to-emerge'].forEach((cue) => cues.add(cue));
    }
    if (/ためら|文章になる前|言葉になる前/.test(normalizedLine)) {
      ['frozen', 'stuck', 'raw', 'still-raw'].forEach((cue) => cues.add(cue));
    }
    if (/引っ込め|乱さない/.test(normalizedLine)) {
      ['suppression', 'compressed', 'held-back'].forEach((cue) => cues.add(cue));
    }
    if (/諦めかけ/.test(normalizedLine)) {
      ['pressure', 'suppression', 'compressed'].forEach((cue) => cues.add(cue));
    }
  });

  return [...cues];
};

const calculateProtoMeaningMatch = (node = {}, protoMeaning = {}) => {
  const narrativeTokens = extractNarrativeTokens(protoMeaning);
  if (!narrativeTokens.length) return 0;

  const nodeTokens = [
    node.textSeed,
    ...(Array.isArray(node.triggers) ? node.triggers : []),
    ...(Array.isArray(node.tags) ? node.tags : []),
    ...(Array.isArray(node.axis) ? node.axis : []),
  ]
    .map(normalizeText)
    .filter(Boolean);

  if (!nodeTokens.length) return 0;

  const matchCount = narrativeTokens.reduce(
    (count, token) => count + (nodeTokens.some((value) => value.includes(token) || token.includes(value)) ? 1 : 0),
    0
  );

  return Math.min(1, matchCount / Math.max(narrativeTokens.length, 1));
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
 * Calculate body affinity (weak influence for thought particles)
 * Thought particles aren't primarily body-based, so this is gentle
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

  // Gentle associations between tags and body states
  let score = 0;

  if (nodeTags.includes('loss') || nodeTags.includes('protection')) {
    score += contraction * 0.2;
  }

  if (nodeTags.includes('urgency') || nodeTags.includes('pressure')) {
    score += urgency * 0.2;
  }

  if (nodeTags.includes('care') || nodeTags.includes('holding')) {
    score += warmth * 0.15;
  }

  if (nodeTags.includes('resistance') || nodeTags.includes('defense')) {
    score += tension * 0.15;
  }

  if (nodeTags.includes('softness') || nodeTags.includes('gentle')) {
    score += softness * 0.15;
  }

  // Return gentle boost, not zero even if no match
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

    // Check body signals (high levels suppress certain particles)
    if (antiTrigger.includes('acceptance-only') && bodySignals.softness > 0.7) {
      matchCount += 0.5;
    }
    if (antiTrigger.includes('dismissal') && bodySignals.urgency > 0.8) {
      matchCount += 0.5;
    }
  });

  return totalChecks > 0 ? Math.min(1, matchCount / totalChecks) : 0;
};

/**
 * Calculate activation score for a single thought node
 *
 * Formula (additive):
 * activationScore = baseScore
 *   + triggerMatch * 0.4
 *   + agentAffinity * 0.2
 *   + resonanceMatch * 0.2
 *   + bodyAffinity * 0.2
 *   - antiTriggerMatch * 0.5
 *
 * @param {object} node - Thought node
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
    resonanceMatch * 0.2 +
    bodyAffinity * 0.2 -
    antiTriggerMatch * 0.5;

  // Build reasons for debug
  const reasons = [];
  if (triggerMatch > 0.3) reasons.push('trigger-match');
  if (agentAffinity >= 0.20) reasons.push('owner-match');
  if (resonanceMatch > 0.3) reasons.push('axis-resonance');
  if (bodyAffinity > 0.1) reasons.push('body-affinity');
  if (antiTriggerMatch > 0.3) reasons.push('anti-trigger-suppression');

  return {
    score: Math.max(0, activationScore), // Don't go negative
    reasons,
  };
};

/**
 * Activate thought particles
 *
 * @param {object} input - Activation input
 * @param {string} input.agentId - Agent ID
 * @param {string} input.userText - User input text
 * @param {object} input.preconditionBias - Precondition bias from earlier layers
 * @param {object} input.beliefTension - Belief tension from earlier layers
 * @param {object} input.emergingField - Emerging field (attention, resonance, body, atmosphere)
 * @param {number} [input.topN=5] - Number of top thoughts to return
 * @returns {object} ActivateThoughtsResult
 */
export const activateThoughts = (input = {}) => {
  const {
    agentId = 'joe',
    userText = '',
    preconditionBias = null,
    beliefTension = null,
    emergingField = null,
    protoMeaning = null,
    topN = 5,
  } = input;
  const canonicalAgentId = canonicalizeAgentId(agentId);

  // Validate agentId
  const validAgents = ['joe', 'ken', 'mina', 'ray', 'satou', 'mirror'];
  if (!validAgents.includes(canonicalAgentId)) {
    return {
      activatedThoughts: [],
      topThoughtIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };
  }

  // Load thought reservoir (shared + agent)
  const thoughtNodes = getThoughtReservoir(canonicalAgentId);

  if (!thoughtNodes || thoughtNodes.length === 0) {
    return {
      activatedThoughts: [],
      topThoughtIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };
  }

  // Score all nodes
  const scoredNodes = thoughtNodes.map((node) => {
    const { score, reasons } = calculateActivationScore(node, canonicalAgentId, {
      userText,
      preconditionBias,
      beliefTension,
      emergingField,
    });
    const protoMeaningMatch = canonicalAgentId === 'joe'
      ? calculateProtoMeaningMatch(node, protoMeaning)
      : 0;
    const protoMeaningBoost = canonicalAgentId === 'joe'
      ? score * 0.08 * protoMeaningMatch
      : 0;

    return {
      nodeId: node.id,
      owner: node.owner,
      textSeed: node.textSeed,
      score: score + protoMeaningBoost,
      baseScore: score,
      reasons,
      dominantAxis: node.axis || [],
      protoMeaningMatch,
      protoMeaningBoost,
    };
  });

  // Sort by score (descending)
  scoredNodes.sort((a, b) => b.score - a.score);

  // Select top N
  const selectedCount = Math.min(topN, scoredNodes.length);
  const activatedThoughts = scoredNodes.slice(0, selectedCount);
  const topThoughtIds = activatedThoughts.map((t) => t.nodeId);

  // Collect dominant axes from top thoughts
  const axisCount = {};
  activatedThoughts.forEach((thought) => {
    thought.dominantAxis.forEach((axis) => {
      axisCount[axis] = (axisCount[axis] || 0) + 1;
    });
  });

  const dominantAxes = Object.entries(axisCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([axis]) => axis);

  return {
    activatedThoughts,
    topThoughtIds,
    activationMeta: {
      totalCandidates: thoughtNodes.length,
      selectedCount,
      dominantAxes,
    },
  };
};

/**
 * Format activated thoughts for debug display
 * @param {object} result - ActivateThoughtsResult
 * @returns {string}
 */
export const formatActivatedThoughtsForDebug = (result) => {
  if (!result || !result.activatedThoughts || result.activatedThoughts.length === 0) {
    return 'no activated thoughts';
  }

  const { activatedThoughts, activationMeta } = result;
  const top3 = activatedThoughts.slice(0, 3).map((t) => t.nodeId).join(', ');
  const axes = activationMeta.dominantAxes.join(', ');

  return `activated: ${activationMeta.selectedCount}/${activationMeta.totalCandidates} | top: ${top3} | axes: ${axes}`;
};
