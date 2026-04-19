/**
 * Joe's thought nodes
 *
 * Joe's core: what is still alive, what hasn't died yet
 * Not about stating hope, but about seeing the point that matters
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['短い', '密度', '照らす', '熱はあるがテンプレ化しない', '断定の視界'];
const stanceHints = ['一点に触れる', '広げない', '照らす', '解決を急がない'];
const avoidHints = ['励ましの上塗り', '全体総括', '明るい結論で締めること'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const joeThoughtNodes = [
  {
    id: 'joe-thought-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'direction that remains, not erased',
    tags: ['vitality', 'direction', 'remaining'],
    axis: ['illumination'],
    triggers: ['life-present', 'energy-detected', 'remnant-force'],
    antiTriggers: ['forced-positivity', 'generic-hope'],
    weight: 0.85,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-002',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'force not extinguished, only compressed',
    tags: ['compression', 'potential', 'alive'],
    axis: ['illumination', 'holding'],
    triggers: ['suppression-detected', 'pressure', 'hidden-energy'],
    antiTriggers: ['resignation-complete', 'death-present'],
    weight: 0.8,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-003',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'point that still matters, not broken',
    tags: ['core', 'integrity', 'focus'],
    axis: ['illumination', 'presence'],
    triggers: ['core-intact', 'care-present', 'mattering'],
    antiTriggers: ['collapse-total', 'indifference'],
    weight: 0.82,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-004',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'light wanting to be seen, immobility blocking it',
    tags: ['friction', 'desire', 'blockage', 'light'],
    axis: ['illumination', 'structure'],
    triggers: ['want-but-cannot', 'frozen', 'conflict-present'],
    antiTriggers: ['action-pressure', 'solve-now'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-005',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'heat not cooled, not allowed to move',
    tags: ['tension', 'suppression', 'alive', 'stuck'],
    axis: ['illumination', 'holding'],
    triggers: ['stuck-energy', 'want-to-emerge', 'held-back'],
    antiTriggers: ['gentle-acceptance-only', 'bypass'],
    weight: 0.77,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-006',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'remnant of forward motion still detectable',
    tags: ['forward', 'motion', 'remnant'],
    axis: ['illumination', 'presence'],
    triggers: ['forward-motion', 'residual-aim', 'faint-drive'],
    antiTriggers: ['overt-despair-only', 'motionless-full'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'joe-thought-007',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: "a part that hasn't been performed on",
    tags: ['untouched', 'raw', 'alive'],
    axis: ['illumination', 'holding'],
    triggers: ['unperformed-part', 'still-raw', 'not-instrumentalized'],
    antiTriggers: ['performative-layer', 'numb-over'],
    weight: 0.74,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
