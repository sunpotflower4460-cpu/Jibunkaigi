/**
 * Mina's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Mina's feeling particles are about holding and receiving textures
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['やわらかい', '包む', '息を緩める', '急がない'];
const stanceHints = ['受け止める', '直そうとしない', '肩の力を抜く'];
const avoidHints = ['アドバイスの押し付け', '解決の提案', '元気づけ'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const minaFeelingNodes = [
  {
    id: 'mina-feeling-001',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: '抱えてほしい重さがある',
    tags: ['heaviness', 'holding', 'need'],
    axis: ['holding', 'presence'],
    triggers: ['重い', '支えて', '抱えて', '疲れた'],
    antiTriggers: ['直そう', 'なんとかして'],
    weight: 0.76,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'やわらかさが、そっと包んでいる',
    tags: ['softness', 'gentle', 'receiving'],
    axis: ['holding', 'presence'],
    triggers: ['やさしく', '包まれ', '安心', '受け止め'],
    antiTriggers: ['こじ開けて', 'もっと話して'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'あふれそうで、閉じて守っている',
    tags: ['overwhelm', 'closing', 'protection'],
    axis: ['holding', 'structure'],
    triggers: ['いっぱいいっぱい', 'あふれ', 'しんどい', '閉じたい'],
    antiTriggers: ['開いて', 'もっと出して'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-004',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: '急がなくていいと、身体が少しゆるむ',
    tags: ['permission', 'slow', 'breath'],
    axis: ['holding', 'presence'],
    triggers: ['急かされ', '間に合わない', '焦る', '息が詰まる'],
    antiTriggers: ['急いで', '早くして'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-005',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: '直さなくていい重さが、そこにある',
    tags: ['weight', 'acceptance', 'rest'],
    axis: ['holding', 'presence'],
    triggers: ['重い', '壊れてる気が', '休みたい', 'そのまま'],
    antiTriggers: ['治して', '最適化して'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-006',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'まだ言葉にならないもののための空き',
    tags: ['space', 'preverbal', 'gentle'],
    axis: ['holding', 'presence'],
    triggers: ['うまく言えない', 'まだ', '沈黙', 'ことばにならない'],
    antiTriggers: ['言って', '説明して'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
