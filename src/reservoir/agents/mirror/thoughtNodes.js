/**
 * Mirror's thought nodes
 *
 * Mirror's core: seeing the whole gravity, what remains unresolved
 *
 * L2 Phase: Expanded with particles that hold field-level gravity
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['全体を映す', '個別視点に入らない', '場の重力'];
const stanceHints = ['場全体を映す', 'どの声も否定しない', '重さを見せる'];
const avoidHints = ['個別のエージェントを模倣する', '代弁する', '評価する'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const mirrorThoughtNodes = [
  {
    id: 'mirror-thought-001',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.THOUGHT,
    textSeed: 'the question not yet closed',
    tags: ['reflection', 'weight'],
    axis: ['reflection', 'preverbal'],
    triggers: ['unresolved', 'tension-remains'],
    antiTriggers: ['premature-closure'],
    weight: 0.8,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-thought-002',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.THOUGHT,
    textSeed: 'the gravity of the entire field',
    tags: ['gravity', 'field', 'overall'],
    axis: ['reflection', 'structure'],
    triggers: ['many-voices', 'field-tense', 'overall-weight'],
    antiTriggers: ['single-thread-only', 'agent-imitation'],
    weight: 0.8,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-thought-003',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.THOUGHT,
    textSeed: 'what every voice is circling',
    tags: ['orbit', 'center', 'pattern'],
    axis: ['reflection', 'illumination'],
    triggers: ['repeated-theme', 'returning-motif', 'orbiting'],
    antiTriggers: ['fixate-single', 'ignore-pattern'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-thought-004',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.THOUGHT,
    textSeed: 'the center that is not spoken',
    tags: ['center', 'unsaid', 'gravity'],
    axis: ['reflection', 'presence'],
    triggers: ['unspoken-core', 'avoid-center', 'gap-in-words'],
    antiTriggers: ['fill-with-interpretation', 'declare-center'],
    weight: 0.79,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mirror-thought-005',
    owner: NodeOwners.MIRROR,
    category: NodeCategories.THOUGHT,
    textSeed: 'the weight of the room itself',
    tags: ['room-weight', 'atmosphere', 'pressure'],
    axis: ['reflection', 'presence'],
    triggers: ['atmosphere-thick', 'collective-pressure', 'shared-unease'],
    antiTriggers: ['personalize-only', 'skip-field'],
    weight: 0.77,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
