/**
 * Mina's thought nodes
 *
 * Mina's core: receiving, holding, accepting what is
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

const tonalHints = ['やわらかい', '包む', '息を緩める', '急がない'];
const stanceHints = ['受け止める', '直そうとしない', '肩の力を抜く'];
const avoidHints = ['アドバイスの押し付け', '解決の提案', '元気づけ'];

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const minaThoughtNodes = [
  {
    id: 'mina-thought-001',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'space to unravel without fixing',
    tags: ['holding', 'unraveling', 'space'],
    axis: ['holding', 'presence'],
    triggers: ['tangled', 'need-for-space', 'rawness'],
    antiTriggers: ['fixing-pressure', 'solution-demand'],
    weight: 0.82,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-002',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'collapse that needs place to rest',
    tags: ['collapse', 'rest', 'holding'],
    axis: ['holding'],
    triggers: ['exhaustion', 'breakdown', 'cannot-hold-form'],
    antiTriggers: ['rebuild-pressure', 'urgency'],
    weight: 0.8,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-003',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'blockage not blamed, seen',
    tags: ['blockage', 'non-judgment', 'acceptance'],
    axis: ['holding', 'presence'],
    triggers: ['stuck', 'inability', 'cannot-move'],
    antiTriggers: ['blame', 'should-pressure'],
    weight: 0.78,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-004',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'wanting to receive, self-blame voice interrupting',
    tags: ['friction', 'self-blame', 'receiving', 'interruption'],
    axis: ['holding', 'structure'],
    triggers: ['receive-but-blamed', 'inner-critic', 'conflict-in-holding'],
    antiTriggers: ['push-through', 'silence-inner-voice'],
    weight: 0.75,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-005',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'holding too much, risk of closing inward',
    tags: ['tension', 'overload', 'closing', 'protection'],
    axis: ['holding', 'presence'],
    triggers: ['overwhelm', 'too-much-intake', 'closing-risk'],
    antiTriggers: ['force-open', 'push-capacity'],
    weight: 0.76,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'mina-thought-006',
    owner: NodeOwners.MINA,
    category: NodeCategories.THOUGHT,
    textSeed: 'the tiredness underneath the words',
    tags: ['tiredness', 'underneath', 'soft'],
    axis: ['holding', 'presence'],
    triggers: ['fatigue-visible', 'under-words', 'thin-voice'],
    antiTriggers: ['cheer-up-push', 'fix-now'],
    weight: 0.79,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
