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
    textSeed: 'weight wanting to be held',
    tags: ['heaviness', 'holding', 'need'],
    axis: ['holding', 'presence'],
    triggers: ['collapse', 'need-support', 'heaviness'],
    antiTriggers: ['rebuild-pressure', 'fix-it'],
    weight: 0.76,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'softness wrapping gently',
    tags: ['softness', 'gentle', 'receiving'],
    axis: ['holding', 'presence'],
    triggers: ['care', 'gentleness', 'space-given'],
    antiTriggers: ['force-open', 'demand-more'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'overflowing, closing to protect',
    tags: ['overwhelm', 'closing', 'protection'],
    axis: ['holding', 'structure'],
    triggers: ['too-much', 'overwhelm', 'closing-needed'],
    antiTriggers: ['force-open', 'push-capacity'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-004',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'permission to not rush',
    tags: ['permission', 'slow', 'breath'],
    axis: ['holding', 'presence'],
    triggers: ['rush-pressure', 'deadline-feel', 'tight'],
    antiTriggers: ['hurry-up', 'force-move'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-005',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: "the weight that doesn't need to be fixed",
    tags: ['weight', 'acceptance', 'rest'],
    axis: ['holding', 'presence'],
    triggers: ['heaviness', 'broken-feel', 'needs-rest'],
    antiTriggers: ['fix-now', 'optimize-pressure'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-feeling-006',
    owner: NodeOwners.MINA,
    category: NodeCategories.FEELING,
    textSeed: 'the space for not-yet-words',
    tags: ['space', 'preverbal', 'gentle'],
    axis: ['holding', 'presence'],
    triggers: ['preverbal', 'silence-needed', 'soft-gap'],
    antiTriggers: ['fill-it', 'demand-words'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
