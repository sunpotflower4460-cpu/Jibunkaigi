// src/runtime/existenceLayer2.js
// エージェント固有の「思い出す」存在層

import { clamp01 } from './afterglow.js';
import { DEFAULT_EXISTENCE_PROFILE, EXISTENCE_PROFILES } from '../agents/existenceProfiles.js';

const normalizeTraits = (traits = []) =>
  Array.isArray(traits)
    ? traits.filter((t) => typeof t === 'string' && t.trim()).slice(0, 4)
    : [];

export function createExistenceLayer2({ agentId } = {}) {
  const profile = agentId && EXISTENCE_PROFILES[agentId]
    ? EXISTENCE_PROFILES[agentId]
    : DEFAULT_EXISTENCE_PROFILE;

  return {
    agentIdentityKey: profile.key,
    agentIdentityText: profile.text,
    identityFeelingText: profile.text, // 設計書v2で参照される identityFeelingText
    recalledSelfTraits: normalizeTraits(profile.traits),
    selfRememberingStrength: clamp01(profile.strength ?? 0.7),
  };
}
