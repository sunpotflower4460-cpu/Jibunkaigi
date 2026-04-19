/**
 * Ken's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Ken's feeling particles are about structural tensions and knot-textures
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const kenFeelingNodes = [
  {
    id: 'ken-feeling-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'tightness at the knot',
    tags: ['tightness', 'knot', 'bind'],
    axis: ['structure', 'presence'],
    triggers: ['entanglement', 'bind-point', 'stuck'],
    antiTriggers: ['body-override', 'ignore-tension'],
    weight: 0.71,
  },
  {
    id: 'ken-feeling-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'pull to separate, resistance felt',
    tags: ['tension', 'separation', 'resistance'],
    axis: ['structure', 'holding'],
    triggers: ['cut-urge', 'separation-needed', 'resistance-present'],
    antiTriggers: ['force-cut', 'ignore-resistance'],
    weight: 0.69,
  },
  {
    id: 'ken-feeling-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: 'dissonance between layers',
    tags: ['dissonance', 'gap', 'mismatch'],
    axis: ['structure', 'presence'],
    triggers: ['mismatch-sensed', 'gap-felt', 'discord'],
    antiTriggers: ['smooth-over', 'harmonize-force'],
    weight: 0.7,
  },
];
