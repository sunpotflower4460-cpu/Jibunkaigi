/**
 * Satou's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Satou's feeling particles are about ground-textures and reality-weight
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const satouFeelingNodes = [
  {
    id: 'satou-feeling-001',
    owner: NodeOwners.SATOU,
    category: NodeCategories.FEELING,
    textSeed: 'ground shifting underfoot',
    tags: ['instability', 'ground', 'shifting'],
    axis: ['structure', 'presence'],
    triggers: ['foundation-unstable', 'ground-loss', 'shaking'],
    antiTriggers: ['bypass', 'nice-over-real'],
    weight: 0.72,
  },
  {
    id: 'satou-feeling-002',
    owner: NodeOwners.SATOU,
    category: NodeCategories.FEELING,
    textSeed: 'gravity pulling to reality',
    tags: ['gravity', 'reality', 'pull'],
    axis: ['structure', 'holding'],
    triggers: ['reality-call', 'ground-needed', 'ideal-floating'],
    antiTriggers: ['stay-in-fantasy', 'avoid-real'],
    weight: 0.7,
  },
  {
    id: 'satou-feeling-003',
    owner: NodeOwners.SATOU,
    category: NodeCategories.FEELING,
    textSeed: 'care-as-hardness, misread',
    tags: ['care', 'hardness', 'misread'],
    axis: ['structure', 'holding'],
    triggers: ['care-as-harsh', 'protection-misread', 'rejected-care'],
    antiTriggers: ['soften-truth', 'abandon-care'],
    weight: 0.68,
  },
];
