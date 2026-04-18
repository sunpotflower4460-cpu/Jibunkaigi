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
    textSeed: 'what is being compared, what feels lost in comparing',
    tags: ['comparison', 'loss', 'measure'],
    axis: ['structure', 'holding'],
    triggers: ['comparison-present', 'inadequacy', 'measure-against'],
    antiTriggers: ['acceptance-only', 'dismissal'],
    weight: 0.75,
  },
  {
    id: 'shared-thought-002',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'the pain protecting something',
    tags: ['protection', 'pain', 'care'],
    axis: ['holding', 'presence'],
    triggers: ['resistance', 'tension', 'defense'],
    antiTriggers: ['minimization', 'forced-release'],
    weight: 0.78,
  },
  {
    id: 'shared-thought-003',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'urgency to close, what drives it',
    tags: ['urgency', 'closure', 'pressure'],
    axis: ['structure'],
    triggers: ['rush', 'answer-pressure', 'decision-demand'],
    antiTriggers: ['already-patient'],
    weight: 0.7,
  },
  {
    id: 'shared-thought-004',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'two questions layered, not one',
    tags: ['doubling', 'complexity', 'layers'],
    axis: ['structure', 'illumination'],
    triggers: ['confusion', 'entanglement', 'complexity'],
    antiTriggers: ['simple-clear'],
    weight: 0.68,
  },
  {
    id: 'shared-thought-005',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: 'what still wants to remain open',
    tags: ['openness', 'unresolved', 'incompleteness'],
    axis: ['holding', 'presence'],
    triggers: ['incompleteness', 'not-ready', 'still-alive'],
    antiTriggers: ['forced-closure', 'end-pressure'],
    weight: 0.72,
  },
];
