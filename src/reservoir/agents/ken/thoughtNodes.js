/**
 * Ken's thought nodes
 *
 * Ken's core: structure, clarity, seeing the map
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Ken-specific thought particles here
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
];
