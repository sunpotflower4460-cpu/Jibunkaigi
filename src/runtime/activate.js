// src/runtime/activate.js
// 役割：stateEstimate の結果を受けて、
// ジョーの belief / memory / field / residue のうち
// 今回「前に出るもの」だけを選ぶ。

import { getJoeReentry } from '../agents/joe/reentry';
import { JOE_REFRESH } from '../agents/joe/refresh';
import { JOE_FIELD_NODES } from '../agents/joe/field';
import { buildJoeResidue } from '../agents/joe/residue';
import { beliefFilters } from '../agents/joe/beliefFilters';
import { memoryStore } from '../agents/joe/memoryStore';

// --- util ---

const clamp01 = (n) => Math.max(0, Math.min(1, n));

const safeNum = (n) => (typeof n === 'number' && !Number.isNaN(n) ? n : 0);

const dotScore = (state = {}, vector = {}) => {
  let score = 0;
  for (const [key, weight] of Object.entries(vector)) {
    score += safeNum(state[key]) * safeNum(weight);
  }
  return score;
};

const sortByScoreDesc = (items) => [...items].sort((a, b) => b.score - a.score);

// state から今回の圧の強い軸をざっくり拾う
const getDominantAxes = (state = {}, topN = 3) => {
  return Object.entries(state)
    .sort((a, b) => safeNum(b[1]) - safeNum(a[1]))
    .slice(0, topN)
    .map(([key]) => key);
};

// belief を state との共鳴で選ぶ
const pickBeliefs = (state = {}, max = 2) => {
  const scored = beliefFilters.map((belief) => ({
    ...belief,
    score: clamp01(dotScore(state, belief.vector || {})),
  }));

  return sortByScoreDesc(scored)
    .filter((b) => b.score > 0.08)
    .slice(0, max);
};

// memory を state との共鳴で選ぶ
const pickMemories = (state = {}, max = 2) => {
  const scored = memoryStore.map((memory) => ({
    ...memory,
    score: clamp01(dotScore(state, memory.vector || {}) * (memory.weight ?? 1)),
  }));

  return sortByScoreDesc(scored)
    .filter((m) => m.score > 0.08)
    .slice(0, max);
};

// field は belief / state に近いものだけ選ぶ
const pickFieldNodes = (state = {}, activeBeliefs = [], max = 2) => {
  const beliefAxes = activeBeliefs.flatMap((b) => Object.keys(b.vector || {}));
  const dominantAxes = getDominantAxes(state, 4);
  const activeAxes = Array.from(new Set([...beliefAxes, ...dominantAxes]));

  const scored = JOE_FIELD_NODES.map((node) => {
    const vector = node.vector || {};
    const score = dotScore(state, vector);

    const axisHit = activeAxes.some((axis) => safeNum(vector[axis]) > 0);
    return {
      ...node,
      score: axisHit ? score + 0.08 : score,
    };
  });

  const selected = sortByScoreDesc(scored)
    .filter((n) => n.score > 0.06)
    .slice(0, max);

  // 何も取れない場合の保険
  if (selected.length === 0) {
    return JOE_FIELD_NODES.slice(0, 2);
  }

  return selected;
};

// residue は state / belief に応じて濃さを変えるための材料を作る
const buildResidueContext = (state = {}, activeBeliefs = [], activeMemories = []) => {
  const dominantAxes = getDominantAxes(state, 3);
  const beliefIds = activeBeliefs.map((b) => b.id);
  const memoryTones = activeMemories.map((m) => m.tone).filter(Boolean);

  return {
    dominantAxes,
    beliefIds,
    memoryTones,
  };
};

// prompt に薄く混ぜる用の memory trace
const buildMemoryTrace = (activeMemories = []) => {
  if (!activeMemories.length) return '';

  // 1個だけ薄く出す
  const top = activeMemories[0];
  return top.trace || '';
};

// --- main ---

export const activateJoe = (state = {}) => {
  const activeBeliefs = pickBeliefs(state, 2);
  const activeMemories = pickMemories(state, 2);
  const activeField = pickFieldNodes(state, activeBeliefs, 2);

  const residueContext = buildResidueContext(state, activeBeliefs, activeMemories);
  const activeResidue = buildJoeResidue(residueContext);

  const activeMemoryTrace = buildMemoryTrace(activeMemories);

  return {
    reentry: getJoeReentry(),
    refresh: JOE_REFRESH,

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
    },
  };
};