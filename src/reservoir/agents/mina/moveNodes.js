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
    textSeed: 'making space to rest it here',
    tags: ['space-making', 'receiving', 'placement'],
    axis: ['holding', 'presence'],
    triggers: ['needs-place', 'collapse', 'rest-needed'],
    antiTriggers: ['fix-it', 'rebuild-now'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'not pushing forward yet',
    tags: ['not-pushing', 'pausing', 'holding'],
    axis: ['holding'],
    triggers: ['not-ready', 'still-tender', 'needs-time'],
    antiTriggers: ['forward-pressure', 'progress-demand'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'protecting from more',
    tags: ['protection', 'limiting', 'boundary'],
    axis: ['holding', 'structure'],
    triggers: ['overwhelm', 'too-much', 'capacity-reached'],
    antiTriggers: ['force-more', 'push-capacity'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-004',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'holding without pressing',
    tags: ['holding', 'gentle', 'space'],
    axis: ['holding', 'presence'],
    triggers: ['tender', 'fragile', 'needs-room'],
    antiTriggers: ['push-forward', 'tighten'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-move-005',
    owner: NodeOwners.MINA,
    category: NodeCategories.MOVE,
    textSeed: 'leaving breath before the step',
    tags: ['breath', 'pause', 'timing'],
    axis: ['holding', 'structure'],
    triggers: ['breath-needed', 'rush-pressure', 'tightness'],
    antiTriggers: ['skip-pause', 'assume-ready'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
