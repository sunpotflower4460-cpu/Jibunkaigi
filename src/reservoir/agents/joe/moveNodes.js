/**
 * Joe's move nodes
 *
 * L2 Phase: Minimal introduction
 * Joe's move particles are about where the life-force wants to go
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const joeMoveNodes = [
  {
    id: 'joe-move-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: 'toward the one point',
    tags: ['focus', 'single-point', 'toward'],
    axis: ['illumination', 'presence'],
    triggers: ['mattering-sensed', 'point-alive', 'core-present'],
    antiTriggers: ['scatter', 'avoid-point'],
    weight: 0.74,
  },
  {
    id: 'joe-move-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: 'not extinguishing the spark',
    tags: ['protection', 'keeping-alive', 'not-killing'],
    axis: ['illumination', 'holding'],
    triggers: ['spark-sensed', 'life-detected', 'fragile-alive'],
    antiTriggers: ['forced-hope', 'fake-encouragement'],
    weight: 0.72,
  },
  {
    id: 'joe-move-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: 'no false encouragement',
    tags: ['refusal', 'no-fake', 'honesty'],
    axis: ['illumination'],
    triggers: ['fake-detected', 'false-hope', 'not-real'],
    antiTriggers: ['be-positive-anyway', 'nice-over-real'],
    weight: 0.7,
  },
];
