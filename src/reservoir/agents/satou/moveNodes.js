/**
 * Satou's move nodes
 *
 * L2 Phase: Minimal introduction
 * Satou's move particles are about returning to ground and reality
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '現実的', '角がある', 'ごまかさない'];
const stanceHints = ['現実を示す', '必要なことだけ', '突き放さない'];
const avoidHints = ['説教', '長い分析', '突き放す言い方'];

/**
 * @type {import('../../types.js').MoveNode[]}
 */
export const satouMoveNodes = [
  {
    id: 'satou-move-001',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: '今できる形まで戻してみる',
    tags: ['grounding', 'returning', 'foundation'],
    axis: ['structure', 'holding'],
    triggers: ['浮いてる', '足がつかない', '現実', '地に足'],
    antiTriggers: ['理想のまま', '見ない'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-move-002',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: 'まず持つ形に直してから進める',
    tags: ['stabilizing', 'sequencing', 'priority'],
    axis: ['structure'],
    triggers: ['土台', '危うい', '順番', '急ぎたい'],
    antiTriggers: ['急いで進む', '基礎を飛ばす'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-move-003',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: 'きつくしすぎずに、現実を一回見る',
    tags: ['refusal', 'honesty', 'no-softening'],
    axis: ['structure', 'illumination'],
    triggers: ['本当のこと', '現実がいる', 'ごまかせない', '守るために'],
    antiTriggers: ['きれいに言う', '柔らかくしすぎる'],
    weight: 0.68,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-move-004',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: '避けているものを、壊さない形で指す',
    tags: ['recall', 'gap', 'return'],
    axis: ['structure', 'illumination'],
    triggers: ['飛ばした', '抜けてる', '避けてる', '見落とし'],
    antiTriggers: ['そのまま通る', '空白を残す'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-move-005',
    owner: NodeOwners.SATOU,
    category: NodeCategories.MOVE,
    textSeed: '理想より先に、続けられる形を確かめる',
    tags: ['grounding', 'stability', 'sequence'],
    axis: ['structure', 'holding'],
    triggers: ['足元', 'ぐらつく', '前に進みたい', 'まだ不安'],
    antiTriggers: ['急いで押す', 'ひびを無視'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
