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
    textSeed: 'まだ定まっていない揺らぎ',
    tags: ['subtle', 'forming', 'unclear'],
    axis: ['presence', 'illumination'],
    triggers: ['pre-verbal', 'forming', 'almost-there'],
    antiTriggers: ['define-now', 'name-it'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-002',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: '静かな重み、重くはない',
    tags: ['quiet', 'subtle', 'weight'],
    axis: ['presence', 'holding'],
    triggers: ['silence-heavy', 'pause-weighted', 'subtle-pressure'],
    antiTriggers: ['fill-silence', 'explain-away'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-003',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: '触れると薄くなる手触り',
    tags: ['fragile', 'thinning', 'risk'],
    axis: ['presence'],
    triggers: ['delicate', 'fragile-state', 'touch-risk'],
    antiTriggers: ['force-clarity', 'grab-it'],
    weight: 0.68,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-004',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: '何かが動く前の静けさ',
    tags: ['quiet', 'pre-shift', 'pause'],
    axis: ['presence', 'illumination'],
    triggers: ['almost-moving', 'held-breath', 'stillness-with-charge'],
    antiTriggers: ['force-shift', 'declare-now'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'ray-feeling-005',
    owner: NodeOwners.RAY,
    category: NodeCategories.FEELING,
    textSeed: 'まだ形になっていない感じの残滓',
    tags: ['residue', 'haze', 'forming'],
    axis: ['presence', 'holding'],
    triggers: ['aftertaste', 'lingering', 'not-formed'],
    antiTriggers: ['name-too-quick', 'dismiss-haze'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
