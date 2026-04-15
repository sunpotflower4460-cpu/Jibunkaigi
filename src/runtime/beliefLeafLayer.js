// src/runtime/beliefLeafLayer.js
// 信念層3（弱い枝葉信念）: Branch からさらに分岐する、最も細かい前提フィルタ
// 存在層2 → 信念層1（Core） → 信念層2（Branch） → 信念層3（Leaf）の順で構築する。

import { clamp01 } from './afterglow.js';
import { BELIEF_LEAF_PROFILES, DEFAULT_BELIEF_LEAF_PROFILE } from '../agents/beliefLeafProfiles.js';

// Leaf は最も軽い層なので Branch より軽い係数を使う
const BASE_WEIGHT_MULTIPLIER = 0.52;
const REMEMBERING_INFLUENCE = 0.12;
const INDEX_DECAY_RATE = 0.015;
const PARENT_WEIGHT_GAP = 0.06; // Branch より更に軽くするための上限差
const MIN_LEAF_WEIGHT = 0.20;

/**
 * @param {{ id?: string, parentId?: string, textJa?: string, weight?: number, axis?: string }} belief
 * @param {{ parentWeight?: number | null, remembering?: number, index?: number }} options
 * @returns {{ id: string, parentId: string, textJa: string, weight: number, axis: string }}
 */
const normalizeLeafBelief = (belief = {}, { parentWeight = null, remembering = 0.7, index = 0 } = {}) => {
  const id = typeof belief.id === 'string' ? belief.id : 'leaf-unknown';
  const parentId = typeof belief.parentId === 'string' ? belief.parentId : 'branch-unknown';
  const textJa = typeof belief.textJa === 'string' ? belief.textJa : '';
  const axis = typeof belief.axis === 'string' ? belief.axis : 'leaf';

  const baseWeight = typeof belief.weight === 'number' ? belief.weight : 0.38;
  const scaledWeight = clamp01(
    baseWeight * (BASE_WEIGHT_MULTIPLIER + remembering * REMEMBERING_INFLUENCE - index * INDEX_DECAY_RATE)
  );
  const parentCap = typeof parentWeight === 'number' ? clamp01(parentWeight - PARENT_WEIGHT_GAP) : 1;
  const cappedWeight = parentCap > 0 ? Math.min(scaledWeight, parentCap) : scaledWeight;
  const weight = clamp01(Math.max(cappedWeight, MIN_LEAF_WEIGHT));

  return { id, parentId, textJa, weight, axis };
};

/**
 * 信念層3（Leaf Belief）を構築する。
 * Branch からさらに分岐し、最も軽く・最も数が多く・最も揺れやすい小さな傾きを前提フィルタとして作る。
 *
 * @param {{ agentId?: string | null, beliefBranch?: object, existenceLayer2?: object }} options
 * @returns {{ activeLeafBeliefs: Array<{id:string,parentId:string,textJa:string,weight:number,axis:string}>, dominantLeafAxis: string | null }}
 */
export function createBeliefLeafLayer({ agentId, beliefBranch, existenceLayer2 } = {}) {
  const profile =
    typeof agentId === 'string' && BELIEF_LEAF_PROFILES[agentId]
      ? BELIEF_LEAF_PROFILES[agentId]
      : DEFAULT_BELIEF_LEAF_PROFILE;

  const remembering = clamp01(
    existenceLayer2 && typeof existenceLayer2.selfRememberingStrength === 'number'
      ? existenceLayer2.selfRememberingStrength
      : 0.7
  );

  const parentWeightMap = new Map();
  if (Array.isArray(beliefBranch?.activeBranchBeliefs)) {
    for (const branch of beliefBranch.activeBranchBeliefs) {
      if (branch && typeof branch.id === 'string') {
        parentWeightMap.set(branch.id, typeof branch.weight === 'number' ? branch.weight : null);
      }
    }
  }

  const activeLeafBeliefs = profile.map((belief, index) =>
    normalizeLeafBelief(belief, {
      parentWeight: parentWeightMap.get(belief.parentId) ?? null,
      remembering,
      index,
    })
  );

  const dominant = activeLeafBeliefs.reduce(
    (best, b) => (b.weight > (best?.weight ?? -1) ? b : best),
    null
  );
  const dominantLeafAxis = dominant?.axis ?? null;

  return {
    activeLeafBeliefs,
    dominantLeafAxis,
  };
}
