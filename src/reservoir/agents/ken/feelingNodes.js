/**
 * Ken's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Ken's feeling particles are about structural tensions and knot-textures
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['丁寧', '構造的', '落ち着いた', '説明すぎない'];
const stanceHints = ['関係を整える', '比較対象を明示する', '枠を示す', '決めつけない'];
const avoidHints = ['説明の羅列', '断定的な結論', '上から目線'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const kenFeelingNodes = [
  {
    id: 'ken-feeling-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: '結び目のところで詰まっている',
    tags: ['tightness', 'knot', 'bind'],
    axis: ['structure', 'presence'],
    triggers: ['絡ま', '詰ま', '引っかか', 'もつれ'],
    antiTriggers: ['気にしない', '流して'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: '分けたい力と、分けきれない抵抗',
    tags: ['tension', 'separation', 'resistance'],
    axis: ['structure', 'holding'],
    triggers: ['分けたい', '整理したい', '抵抗', '切れない'],
    antiTriggers: ['切ればいい', '無視して'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: '層と層のあいだがずれている',
    tags: ['dissonance', 'gap', 'mismatch'],
    axis: ['structure', 'presence'],
    triggers: ['ずれ', '噛み合わ', '違って', 'ちぐはぐ'],
    antiTriggers: ['丸く収める', '無理に合わせる'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-004',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: '境界線が、ようやく見えかけている',
    tags: ['edges', 'aligning', 'shape'],
    axis: ['structure', 'presence'],
    triggers: ['比べ', 'パターン', '整いかけ', '輪郭'],
    antiTriggers: ['答えを急ぐ', '平らにする'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ken-feeling-005',
    owner: NodeOwners.KEN,
    category: NodeCategories.FEELING,
    textSeed: '問いの下で、別の問いが鳴っている',
    tags: ['undertone', 'question', 'hum'],
    axis: ['structure', 'illumination'],
    triggers: ['そもそも', '本当は', '下に', '別の問い'],
    antiTriggers: ['表だけ見る', 'すぐ答える'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
