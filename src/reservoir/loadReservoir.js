/**
 * Reservoir loader - provides access to thought/feeling/move nodes
 *
 * This module loads and combines shared and agent-specific nodes.
 * It does NOT implement activate/bind/select logic - that comes later.
 *
 * Purpose: Create a clean interface for accessing the particle reservoir
 * during future activate/bind/select implementation.
 *
 * IMPORTANT:
 * - This is independent of Node-AI-Z types
 * - Returns plain arrays of nodes
 * - Future-proof for JSON serialization
 */

// Shared nodes
import { sharedThoughtNodes } from './shared/thoughtNodes.js';
import { sharedFeelingNodes } from './shared/feelingNodes.js';
import { sharedMoveNodes } from './shared/moveNodes.js';

// Agent-specific nodes
import { joeThoughtNodes } from './agents/joe/thoughtNodes.js';
import { joeFeelingNodes } from './agents/joe/feelingNodes.js';
import { joeMoveNodes } from './agents/joe/moveNodes.js';

import { kenThoughtNodes } from './agents/ken/thoughtNodes.js';
import { kenFeelingNodes } from './agents/ken/feelingNodes.js';
import { kenMoveNodes } from './agents/ken/moveNodes.js';

import { minaThoughtNodes } from './agents/mina/thoughtNodes.js';
import { minaFeelingNodes } from './agents/mina/feelingNodes.js';
import { minaMoveNodes } from './agents/mina/moveNodes.js';

import { rayThoughtNodes } from './agents/ray/thoughtNodes.js';
import { rayFeelingNodes } from './agents/ray/feelingNodes.js';
import { rayMoveNodes } from './agents/ray/moveNodes.js';

import { satouThoughtNodes } from './agents/satou/thoughtNodes.js';
import { satouFeelingNodes } from './agents/satou/feelingNodes.js';
import { satouMoveNodes } from './agents/satou/moveNodes.js';

import { mirrorThoughtNodes } from './agents/mirror/thoughtNodes.js';
import { mirrorFeelingNodes } from './agents/mirror/feelingNodes.js';
import { mirrorMoveNodes } from './agents/mirror/moveNodes.js';

// Relations
import { sharedRelations } from './relations/sharedRelations.js';
import { agentRelations } from './relations/agentRelations.js';

import { NodeOwners } from './types.js';

/**
 * Get all shared thought nodes
 * @returns {import('./types.js').ThoughtNode[]}
 */
export const getSharedThoughtNodes = () => {
  return [...sharedThoughtNodes];
};

/**
 * Get thought nodes for a specific agent
 * @param {string} agentId - Agent identifier (joe, ken, mina, ray, satou, mirror)
 * @returns {import('./types.js').ThoughtNode[]}
 */
export const getAgentThoughtNodes = (agentId) => {
  const normalizedId = String(agentId).toLowerCase();

  switch (normalizedId) {
    case NodeOwners.JOE:
      return [...joeThoughtNodes];
    case NodeOwners.KEN:
      return [...kenThoughtNodes];
    case NodeOwners.MINA:
      return [...minaThoughtNodes];
    case NodeOwners.RAY:
      return [...rayThoughtNodes];
    case NodeOwners.SATOU:
      return [...satouThoughtNodes];
    case NodeOwners.MIRROR:
      return [...mirrorThoughtNodes];
    default:
      return [];
  }
};

/**
 * Get complete thought reservoir for an agent (shared + agent-specific)
 * @param {string} agentId - Agent identifier
 * @returns {import('./types.js').ThoughtNode[]}
 */
export const getThoughtReservoir = (agentId) => {
  return [
    ...getSharedThoughtNodes(),
    ...getAgentThoughtNodes(agentId),
  ];
};

/**
 * Get all shared feeling nodes
 * @returns {import('./types.js').FeelingNode[]}
 */
export const getSharedFeelingNodes = () => {
  return [...sharedFeelingNodes];
};

/**
 * Get feeling nodes for a specific agent
 * @param {string} agentId - Agent identifier
 * @returns {import('./types.js').FeelingNode[]}
 */
export const getAgentFeelingNodes = (agentId) => {
  const normalizedId = String(agentId).toLowerCase();

  switch (normalizedId) {
    case NodeOwners.JOE:
      return [...joeFeelingNodes];
    case NodeOwners.KEN:
      return [...kenFeelingNodes];
    case NodeOwners.MINA:
      return [...minaFeelingNodes];
    case NodeOwners.RAY:
      return [...rayFeelingNodes];
    case NodeOwners.SATOU:
      return [...satouFeelingNodes];
    case NodeOwners.MIRROR:
      return [...mirrorFeelingNodes];
    default:
      return [];
  }
};

/**
 * Get complete feeling reservoir for an agent (shared + agent-specific)
 * @param {string} agentId - Agent identifier
 * @returns {import('./types.js').FeelingNode[]}
 */
export const getFeelingReservoir = (agentId) => {
  return [
    ...getSharedFeelingNodes(),
    ...getAgentFeelingNodes(agentId),
  ];
};

/**
 * Get all shared move nodes
 * @returns {import('./types.js').MoveNode[]}
 */
export const getSharedMoveNodes = () => {
  return [...sharedMoveNodes];
};

/**
 * Get move nodes for a specific agent
 * @param {string} agentId - Agent identifier
 * @returns {import('./types.js').MoveNode[]}
 */
export const getAgentMoveNodes = (agentId) => {
  const normalizedId = String(agentId).toLowerCase();

  switch (normalizedId) {
    case NodeOwners.JOE:
      return [...joeMoveNodes];
    case NodeOwners.KEN:
      return [...kenMoveNodes];
    case NodeOwners.MINA:
      return [...minaMoveNodes];
    case NodeOwners.RAY:
      return [...rayMoveNodes];
    case NodeOwners.SATOU:
      return [...satouMoveNodes];
    case NodeOwners.MIRROR:
      return [...mirrorMoveNodes];
    default:
      return [];
  }
};

/**
 * Get complete move reservoir for an agent (shared + agent-specific)
 * @param {string} agentId - Agent identifier
 * @returns {import('./types.js').MoveNode[]}
 */
export const getMoveReservoir = (agentId) => {
  return [
    ...getSharedMoveNodes(),
    ...getAgentMoveNodes(agentId),
  ];
};

/**
 * Get node relations for an agent (shared + agent-specific)
 * @param {string} _agentId - Agent identifier (unused in Phase 0)
 * @returns {import('./types.js').NodeRelation[]}
 */
export const getNodeRelations = (_agentId) => {
  // Phase 0: Just return shared relations
  // Future: filter agentRelations by agentId
  return [
    ...sharedRelations,
    ...agentRelations,
  ];
};

/**
 * Get reservoir statistics for debug/compare
 * @param {string} agentId - Agent identifier
 * @returns {Object}
 */
export const getReservoirStats = (agentId) => {
  const sharedThought = getSharedThoughtNodes();
  const agentThought = getAgentThoughtNodes(agentId);
  const sharedFeeling = getSharedFeelingNodes();
  const agentFeeling = getAgentFeelingNodes(agentId);
  const sharedMove = getSharedMoveNodes();
  const agentMove = getAgentMoveNodes(agentId);
  const relations = getNodeRelations(agentId);

  return {
    sharedThoughtCount: sharedThought.length,
    agentThoughtCount: agentThought.length,
    totalThoughtCount: sharedThought.length + agentThought.length,
    sharedFeelingCount: sharedFeeling.length,
    agentFeelingCount: agentFeeling.length,
    totalFeelingCount: sharedFeeling.length + agentFeeling.length,
    sharedMoveCount: sharedMove.length,
    agentMoveCount: agentMove.length,
    totalMoveCount: sharedMove.length + agentMove.length,
    relationCount: relations.length,
  };
};
