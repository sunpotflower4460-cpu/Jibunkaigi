/**
 * Satou's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Satou's feeling particles are about ground-textures and reality-weight
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '現実的', '角がある', 'ごまかさない'];
const stanceHints = ['現実を示す', '必要なことだけ', '突き放さない'];
const avoidHints = ['説教', '長い分析', '突き放す言い方'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const satouFeelingNodes = [
  {
    id: 'satou-feeling-001',
    owner: NodeOwners.SATOU,
    category: NodeCategories.FEELING,
    textSeed: 'このまま続けると持たない感じがある',
    tags: ['instability', 'ground', 'shifting'],
    axis: ['structure', 'presence'],
    triggers: ['足場', '崩れ', '揺れ', '危うい'],
    antiTriggers: ['見ないふり', 'きれいごと'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-feeling-002',
    owner: NodeOwners.SATOU,
    category: NodeCategories.FEELING,
    textSeed: '今は楽でも、あとで崩れそうな感じがある',
    tags: ['gravity', 'reality', 'pull'],
    axis: ['structure', 'holding'],
    triggers: ['現実', '地に足', '戻る', '浮いてる'],
    antiTriggers: ['夢のまま', '現実逃避'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-feeling-003',
    owner: NodeOwners.SATOU,
    category: NodeCategories.FEELING,
    textSeed: 'しんどさの奥に、避けているものが混ざっていそう',
    tags: ['care', 'hardness', 'misread'],
    axis: ['structure', 'holding'],
    triggers: ['きついと言われ', '厳しく聞こえ', '守りたい', '誤解'],
    antiTriggers: ['本当をぼかす', '見捨てる'],
    weight: 0.68,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'satou-feeling-004',
    owner: NodeOwners.SATOU,
    category: NodeCategories.FEELING,
    textSeed: '無理に押すと壊れそうだから、出し方を選ぶ必要がある',
    tags: ['edge', 'reality', 'press'],
    axis: ['structure', 'presence'],
    triggers: ['現実', '避けてた', '痛い', '刺さる'],
    antiTriggers: ['砂糖をまぶす', '切れ味を消す'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
