// src/runtime/activateGeneric.js
// 汎用エージェントアクティベーション。
// activate.js のスコアリングアルゴリズムを全エージェントで共有する。
// エージェント固有のデータは registry.js から取得する。

import { AGENT_MATERIALS } from '../agents/registry.js';
import { composeJoeRuntimeReentry } from '../agents/joe/composeReentry.js';

// --- util ---

export const clamp01 = (n) => Math.max(0, Math.min(1, n));

export const safeNum = (n) =>
  typeof n === 'number' && !Number.isNaN(n) ? n : 0;

export const dotScore = (state = {}, vector = {}) => {
  let score = 0;
  for (const [key, weight] of Object.entries(vector)) {
    score += safeNum(state[key]) * safeNum(weight);
  }
  return score;
};

const sortByScoreDesc = (items) =>
  [...items].sort((a, b) => b.score - a.score);

export const getDominantAxes = (state = {}, topN = 3) =>
  Object.entries(state)
    .sort((a, b) => safeNum(b[1]) - safeNum(a[1]))
    .slice(0, topN)
    .map(([key]) => key);

// --- 共通 pick 関数 ---

export const pickBeliefs = (state = {}, beliefFilters = [], max = 2) => {
  // Convert object-based beliefFilters to array format
  const beliefFiltersArray = Array.isArray(beliefFilters)
    ? beliefFilters
    : beliefFilters && typeof beliefFilters === 'object'
    ? Object.entries(beliefFilters).map(([id, filter]) => ({ id, ...filter }))
    : [];

  const scored = beliefFiltersArray.map((belief) => ({
    ...belief,
    score: clamp01(dotScore(state, belief.vector || {})),
  }));

  const sorted = sortByScoreDesc(scored);
  const selected = sorted
    .filter((b) => b.score > 0.08)
    .slice(0, max);

  // Return all candidates with picked flag (top 5)
  const allCandidates = sorted.slice(0, 5).map((b) => ({
    id: b.id,
    score: b.score,
    vector: b.vector,
    picked: selected.some((s) => s.id === b.id),
  }));

  return {
    selected,
    allCandidates,
  };
};

export const pickMemories = (state = {}, memoryStore = [], max = 2) => {
  const scored = memoryStore.map((memory) => ({
    ...memory,
    score: clamp01(dotScore(state, memory.vector || {}) * (memory.weight ?? 1)),
  }));

  const sorted = sortByScoreDesc(scored);
  const selected = sorted
    .filter((m) => m.score > 0.08)
    .slice(0, max);

  // Return all candidates with picked flag (top 5)
  const allCandidates = sorted.slice(0, 5).map((m) => ({
    id: m.id,
    score: m.score,
    tone: m.tone,
    picked: selected.some((s) => s.id === m.id),
  }));

  return {
    selected,
    allCandidates,
  };
};

export const pickFieldNodes = (
  state = {},
  fieldNodes = [],
  activeBeliefs = [],
  max = 2,
) => {
  const beliefAxes = activeBeliefs.flatMap((b) =>
    Object.keys(b.vector || {}),
  );
  const dominantAxes = getDominantAxes(state, 4);
  const activeAxes = Array.from(new Set([...beliefAxes, ...dominantAxes]));

  const scored = fieldNodes.map((node) => {
    const vector = node.vector || {};
    const score = dotScore(state, vector);
    const axisHit = activeAxes.some((axis) => safeNum(vector[axis]) > 0);
    return {
      ...node,
      score: axisHit ? score + 0.08 : score,
    };
  });

  const sorted = sortByScoreDesc(scored);
  let selected = sorted
    .filter((n) => n.score > 0.06)
    .slice(0, max);

  // 何も取れない場合の保険
  if (selected.length === 0 && fieldNodes.length > 0) {
    selected = fieldNodes.slice(0, 2);
  }

  // Return all candidates with picked flag (top 5)
  const allCandidates = sorted.slice(0, 5).map((f) => ({
    id: f.id,
    score: f.score,
    picked: selected.some((s) => s.id === f.id),
  }));

  return {
    selected,
    allCandidates,
  };
};

const buildResidueContext = (
  state = {},
  activeBeliefs = [],
  activeMemories = [],
) => {
  const dominantAxes = getDominantAxes(state, 3);
  const beliefIds = activeBeliefs.map((b) => b.id);
  const memoryTones = activeMemories.map((m) => m.tone).filter(Boolean);

  return {
    dominantAxes,
    beliefIds,
    memoryTones,
  };
};

const buildMemoryTrace = (activeMemories = []) => {
  if (!activeMemories.length) return '';
  const top = activeMemories[0];
  return top.trace || '';
};

// --- メイン ---

/**
 * 汎用アクティベーション関数。
 * registry から agentId に対応する素材を取得し、共通アルゴリズムで活性化する。
 *
 * @param {string} agentId - エージェントID
 * @param {object} state - estimateState() の出力
 * @returns {object|null} - アクティベーション結果、または素材が無い場合 null
 */
export const activateGeneric = (agentId, state = {}, options = {}) => {
  const materials = AGENT_MATERIALS[agentId];
  if (!materials) return null;

  const beliefsResult = pickBeliefs(state, materials.beliefFilters, 2);
  const memoriesResult = pickMemories(state, materials.memoryStore, 2);
  const activeBeliefs = beliefsResult.selected;
  const activeMemories = memoriesResult.selected;
  const fieldsResult = pickFieldNodes(
    state,
    materials.fieldNodes,
    activeBeliefs,
    2,
  );
  const activeField = fieldsResult.selected;

  const residueContext = buildResidueContext(state, activeBeliefs, activeMemories);
  const activeResidue = materials.buildResidue(residueContext);

  const activeMemoryTrace = buildMemoryTrace(activeMemories);
  const reentryPick = agentId === 'creative'
    ? composeJoeRuntimeReentry(state, options)
    : materials.getReentry(state);

  return {
    reentry: reentryPick.selected,
    refresh: materials.refresh,

    activeBeliefs,
    activeMemories,
    activeField,
    activeResidue,
    activeMemoryTrace,

    debug: {
      state,
      dominantAxes: getDominantAxes(state, 4),
      pickedBeliefIds: activeBeliefs.map((b) => b.id),
      pickedMemoryIds: activeMemories.map((m) => m.id),
      pickedFieldIds: activeField.map((f) => f.id),
      reentryCandidates: reentryPick.allCandidates,
      reentryComposition: reentryPick.selected?.composition ?? null,
      // Add all candidates for V-3
      allBeliefCandidates: beliefsResult.allCandidates,
      allMemoryCandidates: memoriesResult.allCandidates,
      allFieldCandidates: fieldsResult.allCandidates,
    },
  };
};
