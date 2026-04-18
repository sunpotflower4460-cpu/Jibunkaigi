/**
 * Mirror's thought nodes
 *
 * Mirror's core: seeing the whole gravity, what remains unresolved
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Mirror-specific thought particles here
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const mirrorThoughtNodes = [
  {
    id: 'mirror-thought-001',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.THOUGHT,
    textSeed: 'the question not yet closed',
    tags: ['reflection', 'weight'],
    axis: ['reflection', 'preverbal'],
    triggers: ['unresolved', 'tension-remains'],
    antiTriggers: ['premature-closure'],
    weight: 0.8,
  },
  // USER TODO: Add mirror-thought-002, mirror-thought-003 here
];
