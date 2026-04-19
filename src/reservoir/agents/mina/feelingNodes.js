/**
 * Mina's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Mina's feeling particles are about holding and receiving textures
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const minaFeelingNodes = [
  {
    id: 'mina-feeling-001',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'weight wanting to be held',
    tags: ['heaviness', 'holding', 'need'],
    axis: ['holding', 'presence'],
    triggers: ['collapse', 'need-support', 'heaviness'],
    antiTriggers: ['rebuild-pressure', 'fix-it'],
    weight: 0.76,
  },
  {
    id: 'mina-feeling-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'softness wrapping gently',
    tags: ['softness', 'gentle', 'receiving'],
    axis: ['holding', 'presence'],
    triggers: ['care', 'gentleness', 'space-given'],
    antiTriggers: ['force-open', 'demand-more'],
    weight: 0.73,
  },
  {
    id: 'mina-feeling-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'overflowing, closing to protect',
    tags: ['overwhelm', 'closing', 'protection'],
    axis: ['holding', 'structure'],
    triggers: ['too-much', 'overwhelm', 'closing-needed'],
    antiTriggers: ['force-open', 'push-capacity'],
    weight: 0.71,
  },
];
