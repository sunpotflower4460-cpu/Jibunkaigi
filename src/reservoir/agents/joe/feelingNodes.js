/**
 * Joe's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Joe's feeling particles are about sensing what's still alive
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const joeFeelingNodes = [
  {
    id: 'joe-feeling-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'ember still warm',
    tags: ['warmth', 'alive', 'remnant'],
    axis: ['illumination', 'presence'],
    triggers: ['life-detected', 'energy-sensed', 'not-dead'],
    antiTriggers: ['forced-positivity', 'fake-warmth'],
    weight: 0.75,
  },
  {
    id: 'joe-feeling-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'heat held back, wanting out',
    tags: ['pressure', 'suppression', 'force'],
    axis: ['illumination', 'holding'],
    triggers: ['stuck-energy', 'held-back', 'compressed'],
    antiTriggers: ['release-now', 'action-demand'],
    weight: 0.72,
  },
  {
    id: 'joe-feeling-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'pull toward, immobility resisting',
    tags: ['friction', 'desire', 'stuck'],
    axis: ['illumination', 'structure'],
    triggers: ['want-but-cannot', 'conflicted', 'frozen'],
    antiTriggers: ['push-through', 'override'],
    weight: 0.7,
  },
];
