/**
 * Ray's thought nodes
 *
 * Ray's core: quiet illumination, seeing what is not yet acknowledged
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Ray-specific thought particles here
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const rayThoughtNodes = [
  {
    id: 'ray-thought-001',
    owner: NodeOwners.RAY,
    category: NodeCategories.THOUGHT,
    textSeed: 'what quietly asks to be seen',
    tags: ['recognition', 'gentleness'],
    axis: ['illumination', 'presence'],
    triggers: ['overlooked', 'subtle-signal'],
    antiTriggers: ['spotlighting', 'performance'],
    weight: 0.76,
  },
  // USER TODO: Add ray-thought-002, ray-thought-003 here
];
