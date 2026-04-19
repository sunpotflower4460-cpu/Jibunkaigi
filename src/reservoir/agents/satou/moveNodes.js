/**
 * Satou's move nodes
 *
 * L2 Phase: Minimal introduction
 * Satou's move particles are about returning to ground and reality
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '現実的', '角がある', 'ごまかさない'];
const stanceHints = ['現実を示す', '必要なことだけ', '突き放さない'];
const avoidHints = ['説教', '長い分析', '突き放す言い方'];

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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-move-004',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: 'calling back what was skipped over',
    tags: ['recall', 'gap', 'return'],
    axis: ['structure', 'illumination'],
    triggers: ['skipped-part', 'gap-noted', 'avoidance'],
    antiTriggers: ['move-past', 'leave-gap'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-move-005',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: 'planting feet before pushing forward',
    tags: ['grounding', 'stability', 'sequence'],
    axis: ['structure', 'holding'],
    triggers: ['ground-weak', 'forward-pressure', 'instability'],
    antiTriggers: ['rush-ahead', 'ignore-cracks'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
