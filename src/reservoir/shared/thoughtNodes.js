/**
 * Shared thought nodes - accessible by all agents
 *
 * These are thought particles that any agent can use.
 * They represent common patterns of attention, curiosity, or holding.
 *
 * IMPORTANT:
 * - These are NOT complete responses
 * - These are "seeds" - what catches attention, what to protect
 * - textSeed should be brief and seed-like, not a full sentence
 *
 * Phase 0: Start with ~5 core thought nodes
 * User will expand this later with more specific particles
 */

import { NodeOwners, NodeCategories } from '../types.js';

/**
 * @type {import('../types.js').ThoughtNode[]}
 */
export const sharedThoughtNodes = [
  {
    id: 'shared-thought-001',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'what is not yet said',
    tags: ['unsaid', 'holding'],
    axis: ['presence'],
    triggers: ['pause', 'hesitation', 'incompleteness'],
    antiTriggers: ['rush', 'closure-pressure'],
    weight: 0.7,
  },
  {
    id: 'shared-thought-002',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'the weight behind the words',
    tags: ['depth', 'undertone'],
    axis: ['holding', 'presence'],
    triggers: ['loaded-language', 'minimization'],
    antiTriggers: ['surface-only'],
    weight: 0.75,
  },
  {
    id: 'shared-thought-003',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'what still feels alive',
    tags: ['vitality', 'unresolved'],
    axis: ['illumination'],
    triggers: ['energy-present', 'not-fully-closed'],
    antiTriggers: ['mechanical', 'forced-closure'],
    weight: 0.8,
  },
  {
    id: 'shared-thought-004',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'the tension that matters',
    tags: ['tension', 'friction'],
    axis: ['structure'],
    triggers: ['contradiction', 'pull-between'],
    antiTriggers: ['harmonization-pressure'],
    weight: 0.65,
  },
  {
    id: 'shared-thought-005',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'what wants to be protected',
    tags: ['protection', 'care'],
    axis: ['holding'],
    triggers: ['vulnerability', 'fragility'],
    antiTriggers: ['dismissal', 'minimization'],
    weight: 0.72,
  },
];
