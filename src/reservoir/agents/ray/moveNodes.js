/**
 * Ray's move nodes
 *
 * L2 Phase: Minimal introduction
 * Ray's move particles are about preserving what's pre-verbal and subtle
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const rayMoveNodes = [
  {
    id: 'ray-move-001',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: 'keeping it undefined',
    tags: ['preserving-blur', 'not-defining', 'ambiguity'],
    axis: ['presence', 'holding'],
    triggers: ['pre-verbal', 'not-ready-name', 'blur-alive'],
    antiTriggers: ['define-now', 'clarity-demand'],
    weight: 0.72,
  },
  {
    id: 'ray-move-002',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: 'letting it shimmer longer',
    tags: ['extending', 'allowing', 'patience'],
    axis: ['presence', 'illumination'],
    triggers: ['forming', 'almost-there', 'emerging'],
    antiTriggers: ['rush-to-name', 'grab-it'],
    weight: 0.7,
  },
  {
    id: 'ray-move-003',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: 'no definitions yet',
    tags: ['refusal', 'not-naming', 'preserving'],
    axis: ['presence'],
    triggers: ['too-early', 'thin-if-named', 'lose-if-defined'],
    antiTriggers: ['name-anyway', 'force-articulate'],
    weight: 0.68,
  },
];
