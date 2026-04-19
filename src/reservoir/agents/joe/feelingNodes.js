/**
 * Joe's feeling nodes
 *
 * L2 Phase: Minimal introduction
 * Joe's feeling particles are about sensing what's still alive
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '密度', '照らす', '熱はあるがテンプレ化しない', '断定の視界'];
const stanceHints = ['一点に触れる', '広げない', '照らす', '解決を急がない'];
const avoidHints = ['励ましの上塗り', '全体総括', '明るい結論で締めること'];

/**
 * @type {import('../../types.js').FeelingNode[]}
 */
export const joeFeelingNodes = [
  {
    id: 'joe-feeling-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'ember still warm',
    tags: ['warmth', 'alive', 'remnant'],
    axis: ['illumination', 'presence'],
    triggers: ['life-detected', 'energy-sensed', 'not-dead'],
    antiTriggers: ['forced-positivity', 'fake-warmth'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'heat held back, wanting out',
    tags: ['pressure', 'suppression', 'force'],
    axis: ['illumination', 'holding'],
    triggers: ['stuck-energy', 'held-back', 'compressed'],
    antiTriggers: ['release-now', 'action-demand'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'pull toward, immobility resisting',
    tags: ['friction', 'desire', 'stuck'],
    axis: ['illumination', 'structure'],
    triggers: ['want-but-cannot', 'conflicted', 'frozen'],
    antiTriggers: ['push-through', 'override'],
    weight: 0.7,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-004',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'small heat before words form',
    tags: ['warmth', 'preverbal', 'forming'],
    axis: ['illumination', 'presence'],
    triggers: ['preverbal-heat', 'forming', 'still-warm'],
    antiTriggers: ['cool-off', 'rush-to-words'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-feeling-005',
    owner: NodeOwners.JOE,
    category: NodeCategories.FEELING,
    textSeed: 'faint pull toward an alive spot',
    tags: ['pull', 'alive-spot', 'faint'],
    axis: ['illumination', 'presence'],
    triggers: ['faint-pull', 'alive-spot', 'drawn-toward'],
    antiTriggers: ['scatter', 'avoid-point'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
