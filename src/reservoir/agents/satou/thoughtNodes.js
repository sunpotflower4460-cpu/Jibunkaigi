/**
 * Satou's thought nodes
 *
 * Satou's core: protection through realism, facing what is being avoided
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '現実的', '角がある', 'ごまかさない'];
const stanceHints = ['現実を示す', '必要なことだけ', '突き放さない'];
const avoidHints = ['説教', '長い分析', '突き放す言い方'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const satouThoughtNodes = [
  {
    id: 'satou-thought-001',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: 'ground eroding, footing uncertain',
    tags: ['grounding', 'foundation', 'erosion'],
    axis: ['structure', 'holding'],
    triggers: ['foundation-shaking', 'support-loss', 'instability'],
    antiTriggers: ['sweet-acceptance-only', 'bypass'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-002',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: 'ideal floating, reality distant',
    tags: ['gap', 'realism', 'disconnect'],
    axis: ['structure', 'illumination'],
    triggers: ['idealization', 'fantasy-vs-fact', 'distance-present'],
    antiTriggers: ['cynicism', 'cruelty'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-003',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: 'what needs support first, or collapse',
    tags: ['priority', 'support', 'prevention'],
    axis: ['structure', 'holding'],
    triggers: ['cascade-risk', 'dependency', 'order-matters'],
    antiTriggers: ['gentle-avoidance'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-004',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: 'wanting to protect, reality-check sounding harsh',
    tags: ['friction', 'protection', 'harshness', 'care'],
    axis: ['structure', 'holding'],
    triggers: ['care-as-harsh', 'protection-misread', 'conflict-in-grounding'],
    antiTriggers: ['soften-truth', 'nice-over-real'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-005',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: 'forward motion desired, ground not ready',
    tags: ['tension', 'forward', 'foundation', 'timing'],
    axis: ['structure', 'illumination'],
    triggers: ['push-vs-ground', 'premature-forward', 'base-not-ready'],
    antiTriggers: ['wait-forever', 'abandon-forward'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
