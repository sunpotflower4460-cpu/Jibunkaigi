/**
 * Shared feeling nodes - accessible by all agents
 *
 * Phase 0: Empty for now
 * These will be populated in future phases when feeling particles are defined.
 *
 * Feeling nodes represent affective seeds, not emotion labels.
 */

import { NodeOwners, NodeCategories } from '../types.js';

/**
 * @type {import('../types.js').FeelingNode[]}
 */
export const sharedFeelingNodes = [
  // Phase 0: Empty - to be populated later
  // Placeholder example (will be replaced by user):
  {
    id: 'shared-feeling-placeholder',
    owner: NodeOwners.SHARED,
    category: NodeCategories.FEELING,
    textSeed: 'provisional placeholder',
    tags: ['placeholder'],
    axis: [],
    triggers: [],
    weight: 0.0,
  },
];
