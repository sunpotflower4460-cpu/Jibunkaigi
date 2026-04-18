/**
 * Joe's thought nodes
 *
 * Joe's core: what is still alive, what hasn't died yet
 * Not about stating hope, but about seeing the point that matters
 *
 * Phase 0: 1 sample node
 * USER TODO: Add 2-3 more Joe-specific thought particles here
 */

import { NodeOwners, NodeCategories } from '../../types.js';

/**
 * @type {import('../../types.js').ThoughtNode[]}
 */
export const joeThoughtNodes = [
  {
    id: 'joe-thought-001',
    owner: NodeOwners.JOE,
    category: NodeCategories.THOUGHT,
    textSeed: 'the spark that has not gone out',
    tags: ['vitality', 'focus'],
    axis: ['illumination'],
    triggers: ['life-present', 'energy-detected'],
    antiTriggers: ['forced-positivity', 'generic-hope'],
    weight: 0.85,
  },
  // USER TODO: Add joe-thought-002, joe-thought-003 here
];
