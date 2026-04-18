/**
 * Shared move nodes - accessible by all agents
 *
 * Phase 0: Empty for now
 * These will be populated in future phases when move particles are defined.
 *
 * Move nodes represent directional seeds - where attention wants to go.
 */

import { NodeOwners, NodeCategories } from '../types.js';

/**
 * @type {import('../types.js').MoveNode[]}
 */
export const sharedMoveNodes = [
  // Phase 0: Empty - to be populated later
  // Placeholder example (will be replaced by user):
  {
    id: 'shared-move-placeholder',
    owner: NodeOwners.SHARED,
    category: NodeCategories.MOVE,
    textSeed: 'provisional placeholder',
    tags: ['placeholder'],
    axis: [],
    triggers: [],
    weight: 0.0,
  },
];
