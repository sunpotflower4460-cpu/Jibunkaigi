// src/runtime/beliefLayers.js
// 信念層1/2/3 を組み立てる

import { AGENT_MATERIALS } from '../agents/registry.js';
import { BELIEF_CORE, DEFAULT_BELIEF_CORE } from '../agents/beliefCore.js';
import { clamp01 } from './afterglow.js';

const normalizeBelief = (belief = {}, fallbackWeight = 0.5) => {
  const id = typeof belief.id === 'string' ? belief.id : 'unknown';
  const text = typeof belief.text === 'string' ? belief.text : '';
  const weight = clamp01(typeof belief.weight === 'number' ? belief.weight : fallbackWeight);
  const normalized = { id, text, weight };

  if (belief.vector && typeof belief.vector === 'object') {
    normalized.vector = belief.vector;
  }

  return normalized;
};

const buildCoreLayer = (agentId, existenceLayer2 = {}) => {
  const base = BELIEF_CORE[agentId] ?? DEFAULT_BELIEF_CORE;
  const remembering = clamp01(existenceLayer2.selfRememberingStrength ?? 0.7);

  return base.map((belief, index) =>
    normalizeBelief(
      {
        ...belief,
        weight: clamp01((belief.weight ?? 0.85) * (0.72 + remembering * 0.28 - index * 0.04)),
      },
      0.82
    )
  );
};

const buildMidLayer = (agentId, existenceLayer1 = {}) => {
  const materials = AGENT_MATERIALS[agentId];
  const filters = Array.isArray(materials?.beliefFilters) ? materials.beliefFilters : [];
  const baseWeight = clamp01(0.5 + (existenceLayer1.selfPresence ?? 0) * 0.15);

  if (!filters.length) {
    return [
      normalizeBelief(
        { id: 'mid-default', text: 'いまは一段深く見る', weight: baseWeight || 0.45 },
        baseWeight || 0.45
      ),
    ];
  }

  return filters.slice(0, 3).map((filter, index) =>
    normalizeBelief(
      {
        id: `mid-${filter.id}`,
        text: typeof filter.sense === 'string' ? filter.sense : filter.id,
        vector: filter.vector,
        weight: clamp01(baseWeight - index * 0.05),
      },
      baseWeight
    )
  );
};

const buildSoftLayer = (agentId, existenceLayer1 = {}, existenceLayer2 = {}) => {
  const traits = Array.isArray(existenceLayer2.recalledSelfTraits)
    ? existenceLayer2.recalledSelfTraits
    : [];
  const baseWeight = clamp01(0.38 + (existenceLayer1.allowUnfinishedSelf ?? 0) * 0.2);

  const softFromTraits = traits
    .filter((trait) => typeof trait === 'string' && trait.trim())
    .slice(0, 3)
    .map((trait, index) =>
      normalizeBelief(
        {
          id: `soft-${agentId || 'common'}-${index}`,
          text: trait,
          weight: clamp01(baseWeight - index * 0.04),
        },
        baseWeight
      )
    );

  if (softFromTraits.length) return softFromTraits;

  return [
    normalizeBelief(
      { id: 'soft-presence', text: 'まだ未完成でいていい', weight: baseWeight || 0.36 },
      baseWeight || 0.36
    ),
  ];
};

export function createBeliefLayers({
  agentId = '',
  existenceLayer1 = {},
  existenceLayer2 = {},
} = {}) {
  const layer1 = buildCoreLayer(agentId, existenceLayer2);
  const layer2 = buildMidLayer(agentId, existenceLayer1);
  const layer3 = buildSoftLayer(agentId, existenceLayer1, existenceLayer2);

  return {
    layer1,
    layer2,
    layer3,
  };
}
