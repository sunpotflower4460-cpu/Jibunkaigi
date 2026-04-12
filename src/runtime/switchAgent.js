const AGENT_PATTERN_AFFINITY = {
  creative: {
    bright_focus: 1,
    truth_gentle: 0.92,
    curious_probe: 0.46,
    quiet_reframe: 0.18,
  },
  empath: {
    comfort_soft: 1,
    protective_hold: 0.94,
    quiet_reframe: 0.42,
    truth_gentle: 0.18,
  },
  strategist: {
    structural_map: 1,
    truth_gentle: 0.24,
    steady_guard: 0.24,
    curious_probe: 0.16,
  },
  critic: {
    steady_guard: 1,
    protective_hold: 0.72,
    structural_map: 0.4,
    truth_gentle: 0.12,
  },
  soul: {
    quiet_reframe: 1,
    truth_gentle: 0.48,
    comfort_soft: 0.34,
    curious_probe: 0.2,
  },
};

const BASE_AGENT_WEIGHT = 0.12;
const DOMINANT_BONUS = 0.08;
const LAST_AGENT_PENALTY = 0.74;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const roundWeight = (value) => Math.round(value * 10000) / 10000;

const hashUnit = (text) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash * 33) + char.charCodeAt(0)) % 4093;
  }

  return hash / 4093;
};

const secureRandomUnit = () => {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] / 4294967296;
  }

  if (globalThis.crypto?.randomUUID) {
    const seed = globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    return parseInt(seed, 16) / 4294967296;
  }

  return 0.5;
};

const normalizeSelectedPatterns = (patternMix) => {
  const selected = Array.isArray(patternMix?.selected) ? patternMix.selected : [];

  return selected
    .filter((item) => item && typeof item.id === 'string' && typeof item.weight === 'number')
    .map((item) => ({
      id: item.id,
      weight: clamp01(item.weight),
    }));
};

const normalizeAgentWeights = (weights) => {
  const total = weights.reduce((sum, item) => sum + item.score, 0);

  if (total <= 0) {
    const fallbackWeight = weights.length > 0 ? 1 / weights.length : 0;
    return weights.map((item) => ({
      id: item.id,
      weight: fallbackWeight,
    }));
  }

  return weights.map((item) => ({
    id: item.id,
    weight: roundWeight(item.score / total),
  }));
};

export const buildContextualAgentWeights = (agents, patternMix, lastAgentId = null) => {
  const normalizedPatterns = normalizeSelectedPatterns(patternMix);
  const dominant = typeof patternMix?.dominant === 'string' ? patternMix.dominant : '';

  const scoredAgents = (Array.isArray(agents) ? agents : [])
    .filter((agent) => agent && typeof agent.id === 'string')
    .map((agent) => {
      const affinity = AGENT_PATTERN_AFFINITY[agent.id] ?? {};
      const patternScore = normalizedPatterns.reduce((sum, pattern) => (
        sum + (pattern.weight * (affinity[pattern.id] ?? 0))
      ), 0);
      const dominantBoost = dominant ? ((affinity[dominant] ?? 0) * DOMINANT_BONUS) : 0;
      const tieBreaker = hashUnit(agent.id) * 0.01;
      const repeatPenalty = lastAgentId && agent.id === lastAgentId ? LAST_AGENT_PENALTY : 1;

      return {
        id: agent.id,
        score: (BASE_AGENT_WEIGHT + patternScore + dominantBoost + tieBreaker) * repeatPenalty,
      };
    });

  return normalizeAgentWeights(scoredAgents)
    .sort((a, b) => b.weight - a.weight);
};

export const pickContextualAgent = (agents, { patternMix, lastAgentId = null, randomValue = secureRandomUnit() } = {}) => {
  const normalizedAgents = Array.isArray(agents) ? agents : [];

  if (normalizedAgents.length === 0) {
    return '';
  }

  const weights = buildContextualAgentWeights(normalizedAgents, patternMix, lastAgentId);
  const boundedRandom = clamp01(randomValue);
  let cursor = 0;

  for (const item of weights) {
    cursor += item.weight;
    if (boundedRandom <= cursor) {
      return item.id;
    }
  }

  return weights[weights.length - 1]?.id ?? normalizedAgents[0]?.id ?? '';
};

export const pickRandomAgent = (agents, excludeId = null) => {
  const pool = excludeId
    ? agents.filter((a) => a.id !== excludeId)
    : agents;

  if (pool.length === 0) return agents[0]?.id ?? '';

  const index = Math.floor(secureRandomUnit() * pool.length);
  return pool[index].id;
};

export const getLastRespondingAgentId = (messages) => {
  if (!Array.isArray(messages)) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'ai' && messages[i].agentId) {
      return messages[i].agentId;
    }
  }

  return null;
};
