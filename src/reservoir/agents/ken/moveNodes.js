/**
 * Ken's move nodes
 *
 * L2 Phase: Minimal introduction
 * Ken's move particles are about where to look for structure
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const kenMoveNodes = [
  {
    id: 'ken-move-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'finding the knot location',
    tags: ['searching', 'locating', 'structure'],
    axis: ['structure', 'illumination'],
    triggers: ['entanglement', 'bind-point', 'knot-sensed'],
    antiTriggers: ['avoid-knot', 'smooth-over'],
    weight: 0.73,
  },
  {
    id: 'ken-move-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'not cutting too fast',
    tags: ['restraint', 'caution', 'not-cutting'],
    axis: ['structure', 'holding'],
    triggers: ['sever-risk', 'harm-possible', 'living-tissue'],
    antiTriggers: ['cut-anyway', 'clarity-over-care'],
    weight: 0.71,
  },
  {
    id: 'ken-move-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.MOVE,
    textSeed: 'checking where it binds',
    tags: ['checking', 'verifying', 'examining'],
    axis: ['structure'],
    triggers: ['need-see', 'locate-bind', 'understand-knot'],
    antiTriggers: ['assume-known', 'skip-check'],
    weight: 0.69,
  },
];
