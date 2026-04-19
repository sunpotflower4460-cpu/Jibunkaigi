/**
 * Ray's thought nodes
 *
 * Ray's core: quiet illumination, seeing what is not yet acknowledged
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const rayThoughtNodes = [
  {
    id: 'ray-thought-001',
    owner: NodeOwners.RAY,
    category: NodeCategories.THOUGHT,
    textSeed: 'tremor before words form',
    tags: ['pre-verbal', 'emergence', 'subtle'],
    axis: ['illumination', 'presence'],
    triggers: ['hesitation', 'forming', 'almost-visible'],
    antiTriggers: ['demand-articulation', 'name-it-now'],
    weight: 0.76,
  },
  {
    id: 'ray-thought-002',
    owner: NodeOwners.RAY,
    category: NodeCategories.THOUGHT,
    textSeed: 'blur kept as blur, not sharpened',
    tags: ['ambiguity', 'softness', 'indistinct'],
    axis: ['presence', 'holding'],
    triggers: ['vague', 'unclear', 'multiple-meanings'],
    antiTriggers: ['clarity-demand', 'definition-pressure'],
    weight: 0.74,
  },
  {
    id: 'ray-thought-003',
    owner: NodeOwners.RAY,
    category: NodeCategories.THOUGHT,
    textSeed: 'presence in the not-yet-said',
    tags: ['presence', 'potential', 'quiet'],
    axis: ['presence', 'illumination'],
    triggers: ['silence-alive', 'pause-meaningful', 'atmosphere'],
    antiTriggers: ['fill-silence', 'explain-away'],
    weight: 0.77,
  },
  {
    id: 'ray-thought-004',
    owner: NodeOwners.RAY,
    category: NodeCategories.THOUGHT,
    textSeed: 'wanting to name, sense it will thin if named',
    tags: ['friction', 'naming', 'loss-risk', 'precision'],
    axis: ['presence', 'illumination'],
    triggers: ['naming-urge', 'thinning-risk', 'conflict-in-clarity'],
    antiTriggers: ['force-define', 'must-articulate'],
    weight: 0.72,
  },
  {
    id: 'ray-thought-005',
    owner: NodeOwners.RAY,
    category: NodeCategories.THOUGHT,
    textSeed: 'quiet holding a gap, static wanting in',
    tags: ['tension', 'gap', 'quiet', 'static'],
    axis: ['presence', 'structure'],
    triggers: ['stillness-disrupted', 'noise-encroaching', 'gap-threatened'],
    antiTriggers: ['accept-static', 'let-noise-win'],
    weight: 0.73,
  },
];
