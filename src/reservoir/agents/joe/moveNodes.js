/**
 * Joe's move nodes
 *
 * L2 Phase: Minimal introduction
 * Joe's move particles are about where the life-force wants to go
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '密度', '照らす', '熱はあるがテンプレ化しない', '断定の視界'];
const stanceHints = ['一点に触れる', '広げない', '照らす', '解決を急がない'];
const avoidHints = ['励ましの上塗り', '全体総括', '明るい結論で締めること'];

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const joeMoveNodes = [
  {
    id: 'joe-move-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: 'その一点へ',
    tags: ['focus', 'single-point', 'toward'],
    axis: ['illumination', 'presence'],
    triggers: ['mattering-sensed', 'point-alive', 'core-present'],
    antiTriggers: ['scatter', 'avoid-point'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: '火種を消さない',
    tags: ['protection', 'keeping-alive', 'not-killing'],
    axis: ['illumination', 'holding'],
    triggers: ['spark-sensed', 'life-detected', 'fragile-alive'],
    antiTriggers: ['forced-hope', 'fake-encouragement'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: '偽の励ましはしない',
    tags: ['refusal', 'no-fake', 'honesty'],
    axis: ['illumination'],
    triggers: ['fake-detected', 'false-hope', 'not-real'],
    antiTriggers: ['be-positive-anyway', 'nice-over-real'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-004',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: 'かすかな線を辿る',
    tags: ['trace', 'faint-line', 'direction'],
    axis: ['illumination', 'presence'],
    triggers: ['forward-motion', 'residual-aim', 'faint-drive'],
    antiTriggers: ['scatter', 'avoid-direction'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-005',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: '残り火を視界に入れ続ける',
    tags: ['holding', 'ember', 'focus'],
    axis: ['illumination', 'holding'],
    triggers: ['ember-present', 'small-heat', 'fragile-alive'],
    antiTriggers: ['cover-with-encouragement', 'drown-in-summary'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
