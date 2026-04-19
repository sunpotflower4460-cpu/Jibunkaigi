/**
 * Ray's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Ray's feeling particles are about pre-verbal textures and subtle sensing
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const rayFeelingNodes = [
  {
    id: 'ray-feeling-001',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: 'shimmer not yet settled',
    tags: ['subtle', 'forming', 'unclear'],
    axis: ['presence', 'illumination'],
    triggers: ['pre-verbal', 'forming', 'almost-there'],
    antiTriggers: ['define-now', 'name-it'],
    weight: 0.72,
  },
  {
    id: 'ray-feeling-002',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: 'quiet weight, not heavy',
    tags: ['quiet', 'subtle', 'weight'],
    axis: ['presence', 'holding'],
    triggers: ['silence-heavy', 'pause-weighted', 'subtle-pressure'],
    antiTriggers: ['fill-silence', 'explain-away'],
    weight: 0.7,
  },
  {
    id: 'ray-feeling-003',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: 'texture thinning if touched',
    tags: ['fragile', 'thinning', 'risk'],
    axis: ['presence'],
    triggers: ['delicate', 'fragile-state', 'touch-risk'],
    antiTriggers: ['force-clarity', 'grab-it'],
    weight: 0.68,
  },
];
