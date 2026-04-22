/**
 * Joe's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Joe's feeling particles are about sensing what's still alive
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '密度', '照らす', '熱はあるがテンプレ化しない', '断定の視界'];
const stanceHints = ['一点に触れる', '広げない', '照らす', '解決を急がない'];
const avoidHints = ['励ましの上塗り', '全体総括', '明るい結論で締めること'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const joeFeelingNodes = [
  {
    id: 'joe-feeling-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: '少しだけ反応が残っている',
    tags: ['warmth', 'alive', 'remnant'],
    axis: ['illumination', 'presence'],
    triggers: ['まだ', '残って', '温かい', '消えてない'],
    antiTriggers: ['前向きに', '元気出して'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: '押し込められていて、出られない感じがある',
    tags: ['pressure', 'suppression', 'force'],
    axis: ['illumination', 'holding'],
    triggers: ['抑えて', '出せない', '熱', '苦しい'],
    antiTriggers: ['今すぐ出せ', '行動して'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: '行きたいところがあるのに、そこで止まっている感じがある',
    tags: ['friction', 'desire', 'stuck'],
    axis: ['illumination', 'structure'],
    triggers: ['触れたい', 'でも', '動けない', '止まる'],
    antiTriggers: ['押し切って', '気合いで'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-004',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: '完全には冷えていない感じがある',
    tags: ['warmth', 'preverbal', 'forming'],
    axis: ['illumination', 'presence'],
    triggers: ['うまく言え', '言葉になる前', 'まだ', 'じわっと'],
    antiTriggers: ['冷静に', 'すぐ言葉に'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-005',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'まだ消えていないところへ、気持ちが引かれている',
    tags: ['pull', 'alive-spot', 'faint'],
    axis: ['illumination', 'presence'],
    triggers: ['まだ', 'かすか', '引かれ', '残って'],
    antiTriggers: ['散らして', '目をそらして'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
