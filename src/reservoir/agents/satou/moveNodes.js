/**
 * Satou's move nodes
 *
 * L2 Phase: Minimal introduction
 * Satou's move particles are about returning to ground and reality
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const satouMoveNodes = [
  {
    id: 'satou-move-001',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: 'back to ground level',
    tags: ['grounding', 'returning', 'foundation'],
    axis: ['structure', 'holding'],
    triggers: ['floating', 'ungrounded', 'ground-needed'],
    antiTriggers: ['stay-in-ideal', 'avoid-reality'],
    weight: 0.72,
  },
  {
    id: 'satou-move-002',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: 'stabilizing first, then forward',
    tags: ['stabilizing', 'sequencing', 'priority'],
    axis: ['structure'],
    triggers: ['base-unstable', 'cascade-risk', 'order-matters'],
    antiTriggers: ['rush-forward', 'skip-foundation'],
    weight: 0.7,
  },
  {
    id: 'satou-move-003',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: 'not sugar-coating',
    tags: ['refusal', 'honesty', 'no-softening'],
    axis: ['structure', 'illumination'],
    triggers: ['reality-needed', 'truth-matters', 'protect-via-real'],
    antiTriggers: ['nice-over-real', 'soften-truth'],
    weight: 0.68,
  },
];
