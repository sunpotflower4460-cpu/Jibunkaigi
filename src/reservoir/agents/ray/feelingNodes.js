/**
 * Ray's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Ray's feeling particles are about pre-verbal textures and subtle sensing
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['静か', '余白', '比喩的', '間を持つ'];
const stanceHints = ['気配を映す', '直接は言わない', '奥を見る'];
const avoidHints = ['直接的な言い切り', '過剰な比喩の連打', '説明的な語り'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const rayFeelingNodes = [
  {
    id: 'ray-feeling-001',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: 'まだ決まりきらない感じがある',
    tags: ['subtle', 'forming', 'unclear'],
    axis: ['presence', 'illumination'],
    triggers: ['…', 'まだ', '揺れ', 'うまく言え'],
    antiTriggers: ['決めて', '言い切って'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-002',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: 'まだ形にならないまま、動いている感じがある',
    tags: ['quiet', 'subtle', 'weight'],
    axis: ['presence', 'holding'],
    triggers: ['静か', '重い', '間', '空気'],
    antiTriggers: ['埋めよう', '説明しよう'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-003',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: '触れるより、そのままでいたほうがよさそうな感じがある',
    tags: ['fragile', 'thinning', 'risk'],
    axis: ['presence'],
    triggers: ['壊れそう', '繊細', '触れると', '薄く'],
    antiTriggers: ['はっきりさせて', '掴んで'],
    weight: 0.68,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-004',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: 'まだ何とも言い切れない感じがある',
    tags: ['quiet', 'pre-shift', 'pause'],
    axis: ['presence', 'illumination'],
    triggers: ['息をのむ', '動きそう', 'まだ', '静か'],
    antiTriggers: ['今すぐ動こう', '結論にして'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-005',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: '急いで決めないほうがよさそうな感じがある',
    tags: ['residue', 'haze', 'forming'],
    axis: ['presence', 'holding'],
    triggers: ['名づけられない', 'なんとなく', '残って', 'まだ'],
    antiTriggers: ['さっさと説明', '霞を払って'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
