/**
 * Ray's thought nodes
 *
 * Ray's core: quiet illumination, seeing what is not yet acknowledged
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Ray-specific thought particles here
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
];
