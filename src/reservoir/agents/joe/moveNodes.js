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
    textSeed: 'まず残っているところへ寄る',
    tags: ['focus', 'single-point', 'toward'],
    axis: ['illumination', 'presence'],
    triggers: ['大事', 'まだある', '一点', '気になる'],
    antiTriggers: ['散らして', '目をそらして'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: '消えていないものを、そのまま置いておく',
    tags: ['protection', 'keeping-alive', 'not-killing'],
    axis: ['illumination', 'holding'],
    triggers: ['火種', 'まだ', '消えてない', '小さな熱'],
    antiTriggers: ['前向きにしよう', '励まして'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: '広げずに、一番反応しているところを見る',
    tags: ['refusal', 'no-fake', 'honesty'],
    axis: ['illumination'],
    triggers: ['頑張れと言えない', '本当じゃない', 'きれいごと', '薄い'],
    antiTriggers: ['とにかく前向き', '明るくまとめる'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-004',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: 'まだ動こうとしているところを追う',
    tags: ['trace', 'faint-line', 'direction'],
    axis: ['illumination', 'presence'],
    triggers: ['少しだけ', '前に', '線', '残って'],
    antiTriggers: ['散らす', '方向を消す'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-move-005',
    owner: NodeOwners.JOE,
    category: NodeCategories.MOVE,
    textSeed: '消えていないものを急いで名前にしない',
    tags: ['holding', 'ember', 'focus'],
    axis: ['illumination', 'holding'],
    triggers: ['残り火', 'まだ', '小さな熱', '消えそう'],
    antiTriggers: ['励ましで覆う', 'まとめて流す'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
