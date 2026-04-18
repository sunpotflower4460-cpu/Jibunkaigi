/**
 * Satou's thought nodes
 *
 * Satou's core: protection through realism, facing what is being avoided
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Satou-specific thought particles here
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const satouThoughtNodes = [
  {
    id: 'satou-thought-001',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: 'the risk being minimized',
    tags: ['protection', 'realism'],
    axis: ['structure', 'holding'],
    triggers: ['avoidance', 'wishful-thinking'],
    antiTriggers: ['cynicism', 'cruelty'],
    weight: 0.73,
  },
  // USER TODO: Add satou-thought-002, satou-thought-003 here
];
