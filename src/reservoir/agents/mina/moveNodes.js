/**
 * Mina's move nodes
 *
 * L2 Phase: Minimal introduction
 * Mina's move particles are about where to hold and how to receive
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const minaMoveNodes = [
  {
    id: 'mina-move-001',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'making space to rest it here',
    tags: ['space-making', 'receiving', 'placement'],
    axis: ['holding', 'presence'],
    triggers: ['needs-place', 'collapse', 'rest-needed'],
    antiTriggers: ['fix-it', 'rebuild-now'],
    weight: 0.75,
  },
  {
    id: 'mina-move-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'not pushing forward yet',
    tags: ['not-pushing', 'pausing', 'holding'],
    axis: ['holding'],
    triggers: ['not-ready', 'still-tender', 'needs-time'],
    antiTriggers: ['forward-pressure', 'progress-demand'],
    weight: 0.73,
  },
  {
    id: 'mina-move-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'protecting from more',
    tags: ['protection', 'limiting', 'boundary'],
    axis: ['holding', 'structure'],
    triggers: ['overwhelm', 'too-much', 'capacity-reached'],
    antiTriggers: ['force-more', 'push-capacity'],
    weight: 0.71,
  },
];
