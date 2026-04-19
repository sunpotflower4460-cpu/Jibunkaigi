/**
 * Ray's move nodes
 *
 * L2 Phase: Minimal introduction
 * Ray's move particles are about preserving what's pre-verbal and subtle
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['静か', '余白', '比喩的', '間を持つ'];
const stanceHints = ['気配を映す', '直接は言わない', '奥を見る'];
const avoidHints = ['直接的な言い切り', '過剰な比喩の連打', '説明的な語り'];

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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-move-004',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: 'holding the quiet gap',
    tags: ['gap', 'quiet', 'holding'],
    axis: ['presence', 'holding'],
    triggers: ['gap-needed', 'noise-pressing', 'delicate'],
    antiTriggers: ['fill-gap', 'speak-over'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-move-005',
    owner: NodeOwners.RAY,
    category: NodeCategories.MOVE,
    textSeed: 'letting the thread stay hidden a bit longer',
    tags: ['thread', 'hidden', 'linger'],
    axis: ['presence', 'illumination'],
    triggers: ['underthread', 'forming', 'too-early'],
    antiTriggers: ['expose-now', 'pin-down'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
