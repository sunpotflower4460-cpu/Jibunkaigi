// src/runtime/beliefBranchLayer.js
// 信念層2（中程度の枝信念）: Core から分岐する前提フィルタ
// 存在層2 → 信念層1（Core） → 信念層2（Branch）の順で構築する。

import { clamp01 } from './afterglow.js';
import { BELIEF_BRANCH_PROFILES, DEFAULT_BELIEF_BRANCH_PROFILE } from '../agents/beliefBranchProfiles.js';

// Core より軽く、Leaf より重い重みづけを作るための係数
const BASE_WEIGHT_MULTIPLIER = 0.62;
const REMEMBERING_INFLUENCE = 0.18;
const INDEX_DECAY_RATE = 0.02;
const PARENT_WEIGHT_GAP = 0.04; // Core より少し軽くするための上限差
const MIN_BRANCH_WEIGHT = 0.45;

/**
 * @param {{ id?: string, parentId?: string, textJa?: string, weight?: number, axis?: string }} belief
 * @param {{ parentWeight?: number | null, remembering?: number, index?: number }} options
 * @returns {{ id: string, parentId: string, textJa: string, weight: number, axis: string }}
 */
const normalizeBranchBelief = (belief = {}, { parentWeight = null, remembering = 0.7, index = 0 } = {}) => {
  const id = typeof belief.id === 'string' ? belief.id : 'branch-unknown';
  const parentId = typeof belief.parentId === 'string' ? belief.parentId : 'core-unknown';
  const textJa = typeof belief.textJa === 'string' ? belief.textJa : '';
  const axis = typeof belief.axis === 'string' ? belief.axis : 'branch';

  const baseWeight = typeof belief.weight === 'number' ? belief.weight : 0.68;
  const scaledWeight = clamp01(
    baseWeight * (BASE_WEIGHT_MULTIPLIER + remembering * REMEMBERING_INFLUENCE - index * INDEX_DECAY_RATE)
  );
  const parentCap = typeof parentWeight === 'number' ? clamp01(parentWeight - PARENT_WEIGHT_GAP) : 1;
  const cappedWeight = parentCap > 0 ? Math.min(scaledWeight, parentCap) : scaledWeight;
  const weight = clamp01(Math.max(cappedWeight, MIN_BRANCH_WEIGHT));

  return { id, parentId, textJa, weight, axis };
};

/**
 * 信念層2（Branch Belief）を構築する。
 * Core から分岐し、前提フィルタとして後段に染み込ませる。
 *
 * @param {{ agentId?: string | null, beliefCore?: object, existenceLayer2?: object }} options
 * @returns {{ activeBranchBeliefs: Array<{id:string,parentId:string,textJa:string,weight:number,axis:string}>, dominantBranchAxis: string | null }}
 */
export function createBeliefBranchLayer({ agentId, beliefCore, existenceLayer2 } = {}) {
  const profile =
    typeof agentId === 'string' && BELIEF_BRANCH_PROFILES[agentId]
      ? BELIEF_BRANCH_PROFILES[agentId]
      : DEFAULT_BELIEF_BRANCH_PROFILE;

  const remembering = clamp01(
    existenceLayer2 && typeof existenceLayer2.selfRememberingStrength === 'number'
      ? existenceLayer2.selfRememberingStrength
      : 0.7
  );

  const parentWeightMap = new Map();
  if (Array.isArray(beliefCore?.activeCoreBeliefs)) {
    for (const core of beliefCore.activeCoreBeliefs) {
      if (core && typeof core.id === 'string') {
        parentWeightMap.set(core.id, typeof core.weight === 'number' ? core.weight : null);
      }
    }
  }

  const activeBranchBeliefs = profile.map((belief, index) =>
    normalizeBranchBelief(belief, {
      parentWeight: parentWeightMap.get(belief.parentId) ?? null,
      remembering,
      index,
    })
  );

  const dominant = activeBranchBeliefs.reduce(
    (best, b) => (b.weight > (best?.weight ?? -1) ? b : best),
    null
  );
  const dominantBranchAxis = dominant?.axis ?? null;

  return {
    activeBranchBeliefs,
    dominantBranchAxis,
  };
}
