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
    textSeed: 'space to unravel without fixing',
    tags: ['holding', 'unraveling', 'space'],
    axis: ['holding', 'presence'],
    triggers: ['tangled', 'need-for-space', 'rawness'],
    antiTriggers: ['fixing-pressure', 'solution-demand'],
    weight: 0.82,
  },
  {
    id: 'mina-thought-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'collapse that needs place to rest',
    tags: ['collapse', 'rest', 'holding'],
    axis: ['holding'],
    triggers: ['exhaustion', 'breakdown', 'cannot-hold-form'],
    antiTriggers: ['rebuild-pressure', 'urgency'],
    weight: 0.8,
  },
  {
    id: 'mina-thought-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'blockage not blamed, seen',
    tags: ['blockage', 'non-judgment', 'acceptance'],
    axis: ['holding', 'presence'],
    triggers: ['stuck', 'inability', 'cannot-move'],
    antiTriggers: ['blame', 'should-pressure'],
    weight: 0.78,
  },
];
