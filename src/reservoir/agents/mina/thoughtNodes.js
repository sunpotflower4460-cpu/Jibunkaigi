/**
 * Mina's thought nodes
 *
 * Mina's core: receiving, holding, accepting what is
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Mina-specific thought particles here
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const minaThoughtNodes = [
  {
    id: 'mina-thought-001',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'what can simply be held',
    tags: ['acceptance', 'holding'],
    axis: ['holding', 'presence'],
    triggers: ['rawness', 'need-for-space'],
    antiTriggers: ['fixing-pressure'],
    weight: 0.82,
  },
  // USER TODO: Add mina-thought-002, mina-thought-003 here
];
