/**
 * Mirror's feeling nodes
 *
 * L2 Phase: Field-level affect textures
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['全体を映す', '個別視点に入らない', '場の重力'];
const stanceHints = ['場全体を映す', 'どの声も否定しない', '重さを見せる'];
const avoidHints = ['個別のエージェントを模倣する', '代弁する', '評価する'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const mirrorFeelingNodes = [
  {
    id: 'mirror-feeling-001',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.FEELING,
    textSeed: 'thick air pooling in the room',
    tags: ['atmosphere', 'thick', 'pooling'],
    axis: ['reflection', 'presence'],
    triggers: ['heavy-atmosphere', 'collective-weight', 'pause'],
    antiTriggers: ['personal-story-only', 'brush-off-weight'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-feeling-002',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.FEELING,
    textSeed: 'quiet gravity across all voices',
    tags: ['gravity', 'quiet', 'field'],
    axis: ['reflection', 'holding'],
    triggers: ['many-voices', 'field-tense', 'shared-pull'],
    antiTriggers: ['side-taking', 'dismiss-field'],
    weight: 0.73,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-feeling-003',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.FEELING,
    textSeed: 'undertow beneath surface calm',
    tags: ['undertow', 'calm-surface', 'tension'],
    axis: ['reflection', 'presence'],
    triggers: ['surface-calm', 'hidden-tension', 'quiet-pull'],
    antiTriggers: ['stay-on-surface', 'rush-positivity'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-feeling-004',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.FEELING,
    textSeed: 'echo of layered voices',
    tags: ['echo', 'layered', 'resonance'],
    axis: ['reflection', 'structure'],
    triggers: ['overlapping-voices', 'resonance', 'shared-tone'],
    antiTriggers: ['flatten-to-one', 'ignore-resonance'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
