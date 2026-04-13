// src/agents/registry.js
// agentId → 素材マッピング。
// activateGeneric がここから素材を取得する。

import {
  beliefFilters as joeBeliefs,
  existence as joeExistence,
  JOE_FIELD_NODES,
  memoryStore as joeMemories,
  getJoeReentry,
  JOE_REFRESH,
  buildJoeResidue,
} from './joe/index.js';

import {
  beliefFilters as rayBeliefs,
  existence as rayExistence,
  RAY_FIELD_NODES,
  memoryStore as rayMemories,
  getRayReentry,
  RAY_REFRESH,
  buildRayResidue,
} from './ray/index.js';

import {
  beliefFilters as kenBeliefs,
  existence as kenExistence,
  KEN_FIELD_NODES,
  memoryStore as kenMemories,
  getKenReentry,
  KEN_REFRESH,
  buildKenResidue,
} from './ken/index.js';

import {
  beliefFilters as minaBeliefs,
  existence as minaExistence,
  MINA_FIELD_NODES,
  memoryStore as minaMemories,
  getMinaReentry,
  MINA_REFRESH,
  buildMinaResidue,
} from './mina/index.js';

import {
  beliefFilters as satouBeliefs,
  existence as satouExistence,
  SATOU_FIELD_NODES,
  memoryStore as satouMemories,
  getSatouReentry,
  SATOU_REFRESH,
  buildSatouResidue,
} from './satou/index.js';

export const AGENT_MATERIALS = {
  creative: {
    beliefFilters: joeBeliefs,
    memoryStore: joeMemories,
    fieldNodes: JOE_FIELD_NODES,
    getReentry: getJoeReentry,
    refresh: JOE_REFRESH,
    buildResidue: buildJoeResidue,
    existence: joeExistence,
  },
  soul: {
    beliefFilters: rayBeliefs,
    memoryStore: rayMemories,
    fieldNodes: RAY_FIELD_NODES,
    getReentry: getRayReentry,
    refresh: RAY_REFRESH,
    buildResidue: buildRayResidue,
    existence: rayExistence,
  },
  strategist: {
    beliefFilters: kenBeliefs,
    memoryStore: kenMemories,
    fieldNodes: KEN_FIELD_NODES,
    getReentry: getKenReentry,
    refresh: KEN_REFRESH,
    buildResidue: buildKenResidue,
    existence: kenExistence,
  },
  empath: {
    beliefFilters: minaBeliefs,
    memoryStore: minaMemories,
    fieldNodes: MINA_FIELD_NODES,
    getReentry: getMinaReentry,
    refresh: MINA_REFRESH,
    buildResidue: buildMinaResidue,
    existence: minaExistence,
  },
  critic: {
    beliefFilters: satouBeliefs,
    memoryStore: satouMemories,
    fieldNodes: SATOU_FIELD_NODES,
    getReentry: getSatouReentry,
    refresh: SATOU_REFRESH,
    buildResidue: buildSatouResidue,
    existence: satouExistence,
  },
};
