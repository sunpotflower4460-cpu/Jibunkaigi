// src/runtime/beliefCoreLayer.js
// 信念層1（強固な信念）: 最深部の前提フィルタ
// 存在層2のあとに動く。「私は〇〇だった」を「俺は〇〇だ / これが使命だ」と核として定着させる。

import { clamp01 } from './afterglow.js';
import { BELIEF_CORE_PROFILES, DEFAULT_BELIEF_CORE_PROFILE } from '../agents/beliefCoreProfiles.js';

// existenceLayer2.selfRememberingStrength が 0 のときの最低乗数
const BASE_WEIGHT_MULTIPLIER = 0.72;
// selfRememberingStrength=1 のときに上乗せされる最大増分
const REMEMBERING_INFLUENCE = 0.28;
// belief の順番ごとに weight を少し下げる減衰率
const INDEX_DECAY_RATE = 0.03;

/**
 * @param {{ id: string, textJa: string, weight: number, axis: string }} belief
 * @param {number} fallbackWeight
 * @returns {{ id: string, textJa: string, weight: number, axis: string }}
 */
const normalizeCoreBelief = (belief, fallbackWeight = 0.78) => ({
  id: typeof belief.id === 'string' ? belief.id : 'unknown',
  textJa: typeof belief.textJa === 'string' ? belief.textJa : '',
  weight: clamp01(typeof belief.weight === 'number' ? belief.weight : fallbackWeight),
  axis: typeof belief.axis === 'string' ? belief.axis : 'identity',
});

/**
 * 信念層1を構築する。
 * 存在層2の selfRememberingStrength を使って weight を微調整する。
 *
 * @param {{ agentId?: string | null, existenceLayer2?: object }} options
 * @returns {{ activeCoreBeliefs: Array<{id:string,textJa:string,weight:number,axis:string}>, dominantBeliefAxis: string | null }}
 */
export function createBeliefCoreLayer({ agentId, existenceLayer2 } = {}) {
  const profile =
    typeof agentId === 'string' && BELIEF_CORE_PROFILES[agentId]
      ? BELIEF_CORE_PROFILES[agentId]
      : DEFAULT_BELIEF_CORE_PROFILE;

  const remembering = clamp01(
    existenceLayer2 && typeof existenceLayer2.selfRememberingStrength === 'number'
      ? existenceLayer2.selfRememberingStrength
      : 0.7
  );

  const activeCoreBeliefs = profile.map((belief, index) =>
    normalizeCoreBelief(
      {
        ...belief,
        weight: clamp01(
          (belief.weight ?? 0.85) *
            (BASE_WEIGHT_MULTIPLIER + remembering * REMEMBERING_INFLUENCE - index * INDEX_DECAY_RATE)
        ),
      },
      0.78
    )
  );

  // dominantBeliefAxis: 最重みの信念の axis
  const dominant = activeCoreBeliefs.reduce(
    (best, b) => (b.weight > (best?.weight ?? -1) ? b : best),
    null
  );
  const dominantBeliefAxis = dominant?.axis ?? null;

  return {
    activeCoreBeliefs,
    dominantBeliefAxis,
  };
}
