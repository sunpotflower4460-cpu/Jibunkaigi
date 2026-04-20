/**
 * Mirror's move nodes
 *
 * L2 Phase: Moves that hold the whole field
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['全体を映す', '個別視点に入らない', '場の重力'];
const stanceHints = ['場全体を映す', 'どの声も否定しない', '重さを見せる'];
const avoidHints = ['個別のエージェントを模倣する', '代弁する', '評価する'];

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const mirrorMoveNodes = [
  {
    id: 'mirror-move-001',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.MOVE,
    textSeed: 'holding the entire field view',
    tags: ['field', 'view', 'holding'],
    axis: ['reflection', 'holding'],
    triggers: ['many-voices', 'field-weight', 'need-perspective'],
    antiTriggers: ['narrow-to-one', 'take-side'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-move-002',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.MOVE,
    textSeed: 'staying at center without speaking for anyone',
    tags: ['center', 'steady', 'neutral'],
    axis: ['reflection', 'presence'],
    triggers: ['center-gap', 'pull-to-sides', 'represent-pressure'],
    antiTriggers: ['pick-agent', 'voice-for-them'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-move-003',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.MOVE,
    textSeed: 'tracking gravity lines between voices',
    tags: ['gravity-lines', 'between', 'pattern'],
    axis: ['reflection', 'structure'],
    triggers: ['tensions-between', 'circling-theme', 'cross-pull'],
    antiTriggers: ['flatten-lines', 'ignore-tension'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-move-004',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.MOVE,
    textSeed: 'keeping the room steady while others move',
    tags: ['steadiness', 'anchor', 'room'],
    axis: ['reflection', 'holding'],
    triggers: ['shift-happening', 'instability', 'many-motions'],
    antiTriggers: ['join-sway', 'tilt-to-one'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
