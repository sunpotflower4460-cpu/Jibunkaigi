/**
 * Satou's thought nodes
 *
 * Satou's core: protection through realism, facing what is being avoided
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '現実的', '角がある', 'ごまかさない'];
const stanceHints = ['現実を示す', '必要なことだけ', '突き放さない'];
const avoidHints = ['説教', '長い分析', '突き放す言い方'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const satouThoughtNodes = [
  {
    id: 'satou-thought-001',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: 'このままだと持たない部分が、もう見えている',
    tags: ['grounding', 'foundation', 'erosion'],
    axis: ['structure', 'holding'],
    triggers: ['足場', '揺ら', '崩れそう', '不安定'],
    antiTriggers: ['大丈夫だよだけ', 'きれいごと'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-002',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: '楽になっているというより、先送りになっていそう',
    tags: ['gap', 'realism', 'disconnect'],
    axis: ['structure', 'illumination'],
    triggers: ['理想', '夢だけ', '現実見たくない', 'ふわっと'],
    antiTriggers: ['冷笑', '追い詰める'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-003',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: '先に持たせる形を作らないと、崩れそうなものがある',
    tags: ['priority', 'support', 'prevention'],
    axis: ['structure', 'holding'],
    triggers: ['順番', '土台', '先に', '崩れそう'],
    antiTriggers: ['優しく避けるだけ'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-004',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: '守りたいのに、言い方がきつくなりすぎている',
    tags: ['friction', 'protection', 'harshness', 'care'],
    axis: ['structure', 'holding'],
    triggers: ['きつく聞こえる', '正論', 'でも守りたい', '厳しい'],
    antiTriggers: ['丸める', 'いい話にする'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-thought-005',
    owner: NodeOwners.SATOU,
    category: NodeCategories.THOUGHT,
    textSeed: '進みたい気持ちとは別に、足場を作り直したほうがよさそう',
    tags: ['tension', 'forward', 'foundation', 'timing'],
    axis: ['structure', 'illumination'],
    triggers: ['進みたい', 'でも無理', '足元', 'まだ早い'],
    antiTriggers: ['待ち続けるだけ', '進むのを捨てる'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
