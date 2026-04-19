/**
 * Mina's thought nodes
 *
 * Mina's core: receiving, holding, accepting what is
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
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
  {
    id: 'mina-thought-004',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'wanting to receive, self-blame voice interrupting',
    tags: ['friction', 'self-blame', 'receiving', 'interruption'],
    axis: ['holding', 'structure'],
    triggers: ['receive-but-blamed', 'inner-critic', 'conflict-in-holding'],
    antiTriggers: ['push-through', 'silence-inner-voice'],
    weight: 0.75,
  },
  {
    id: 'mina-thought-005',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'holding too much, risk of closing inward',
    tags: ['tension', 'overload', 'closing', 'protection'],
    axis: ['holding', 'presence'],
    triggers: ['overwhelm', 'too-much-intake', 'closing-risk'],
    antiTriggers: ['force-open', 'push-capacity'],
    weight: 0.76,
  },
];
