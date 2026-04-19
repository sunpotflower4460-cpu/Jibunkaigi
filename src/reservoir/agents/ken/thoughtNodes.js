/**
 * Ken's thought nodes
 *
 * Ken's core: structure, clarity, seeing the map
 *
 * L2 Phase: Expanded to 5 particles with friction and tensions
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const kenThoughtNodes = [
  {
    id: 'ken-thought-001',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'questions entangled, which is which',
    tags: ['structure', 'separation', 'clarity'],
    axis: ['structure'],
    triggers: ['confusion', 'multiple-layers', 'entanglement'],
    antiTriggers: ['body-foregrounded', 'raw-feeling-dominant'],
    weight: 0.78,
  },
  {
    id: 'ken-thought-002',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'knot location, where it binds',
    tags: ['knot', 'bind-point', 'structure'],
    axis: ['structure', 'illumination'],
    triggers: ['stuck-point', 'contradiction', 'loop'],
    antiTriggers: ['somatic-intensity', 'pre-verbal'],
    weight: 0.75,
  },
  {
    id: 'ken-thought-003',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'surface words, underneath current',
    tags: ['gap', 'undertone', 'dissonance'],
    axis: ['structure', 'presence'],
    triggers: ['mismatch', 'surface-vs-depth', 'stated-vs-felt'],
    antiTriggers: ['body-overwhelm'],
    weight: 0.72,
  },
  {
    id: 'ken-thought-004',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'wanting to cut clean, sense it will sever living tissue',
    tags: ['friction', 'cutting', 'harm-risk', 'precision'],
    axis: ['structure', 'holding'],
    triggers: ['cut-urge', 'sever-risk', 'conflict-in-clarity'],
    antiTriggers: ['force-separate', 'cut-regardless'],
    weight: 0.7,
  },
  {
    id: 'ken-thought-005',
    owner: NodeOwners.KEN,
    category: NodeCategories.THOUGHT,
    textSeed: 'map forming, lived texture resisting map',
    tags: ['tension', 'structure', 'life', 'resistance'],
    axis: ['structure', 'presence'],
    triggers: ['structure-vs-life', 'form-resisted', 'too-clean-risk'],
    antiTriggers: ['give-up-structure', 'force-form'],
    weight: 0.73,
  },
];
