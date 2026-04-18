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
    textSeed: 'ground eroding, footing uncertain',
    tags: ['grounding', 'foundation', 'erosion'],
    axis: ['structure', 'holding'],
    triggers: ['foundation-shaking', 'support-loss', 'instability'],
    antiTriggers: ['sweet-acceptance-only', 'bypass'],
    weight: 0.73,
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
  },
];
