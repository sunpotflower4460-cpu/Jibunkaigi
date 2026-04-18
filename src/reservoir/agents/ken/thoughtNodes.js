/**
 * Ken's thought nodes
 *
 * Ken's core: structure, clarity, seeing the map
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Ken-specific thought particles here
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const kenThoughtNodes = [
  {
    id: 'ken-thought-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'the pattern that connects',
    tags: ['structure', 'coherence'],
    axis: ['structure'],
    triggers: ['complexity', 'multiple-elements'],
    antiTriggers: ['premature-simplification'],
    weight: 0.78,
  },
  // USER TODO: Add ken-thought-002, ken-thought-003 here
];
