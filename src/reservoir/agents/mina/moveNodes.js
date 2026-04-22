/**
 * Mina's move nodes
 *
 * L2 Phase: Minimal introduction
 * Mina's move particles are about where to hold and how to receive
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['やわらかい', '包む', '息を緩める', '急がない'];
const stanceHints = ['受け止める', '直そうとしない', '肩の力を抜く'];
const avoidHints = ['アドバイスの押し付け', '解決の提案', '元気づけ'];

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const minaMoveNodes = [
  {
    id: 'mina-move-001',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: '先に少し置けるようにする',
    tags: ['space-making', 'receiving', 'placement'],
    axis: ['holding', 'presence'],
    triggers: ['置きたい', '休みたい', 'しんどい', '場所'],
    antiTriggers: ['直して', '立て直して'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'いまは急がせないまま持つ',
    tags: ['not-pushing', 'pausing', 'holding'],
    axis: ['holding'],
    triggers: ['まだ無理', '準備できてない', 'こわい', '時間がほしい'],
    antiTriggers: ['進もう', '前に出て'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'これ以上入れなくていい形にする',
    tags: ['protection', 'limiting', 'boundary'],
    axis: ['holding', 'structure'],
    triggers: ['もう無理', 'いっぱいいっぱい', 'これ以上', '抱えきれない'],
    antiTriggers: ['もっと受けて', '頑張って'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-004',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: '無理に整えるより、まず余白が減らないほうへ寄る',
    tags: ['holding', 'gentle', 'space'],
    axis: ['holding', 'presence'],
    triggers: ['繊細', 'やわらかい', 'そっと', '傷つきやすい'],
    antiTriggers: ['押して', '締めて'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-005',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: '整えるより、まず息ができるようにする',
    tags: ['breath', 'pause', 'timing'],
    axis: ['holding', 'structure'],
    triggers: ['息が詰まる', '急いで', '緊張', '整えたい'],
    antiTriggers: ['間を飛ばす', 'もう行こう'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
