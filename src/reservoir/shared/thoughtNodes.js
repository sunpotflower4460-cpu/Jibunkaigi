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

const tonalHints = ['中立的', '場として当然'];
const stanceHints = ['そこにある', '動かさない'];
const avoidHints = ['意図を付け加える'];

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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
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
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-006',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: "something that hasn't settled yet",
    tags: ['unsettled', 'moving', 'open'],
    axis: ['presence', 'holding'],
    triggers: ['still-shifting', 'no-rest', 'unsettled'],
    antiTriggers: ['force-settle', 'conclude-fast'],
    weight: 0.71,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-007',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: "the space that doesn't need filling",
    tags: ['space', 'rest', 'allowance'],
    axis: ['presence', 'holding'],
    triggers: ['silence-ok', 'not-yet', 'breathing-room'],
    antiTriggers: ['fill-gap', 'force-content'],
    weight: 0.69,
    tonalHints,
    stanceHints,
    avoidHints,
  },
  {
    id: 'shared-thought-008',
    owner: NodeOwners.SHARED,
    category: NodeCategories.THOUGHT,
    textSeed: "what we don't have words for yet",
    tags: ['preverbal', 'unknown', 'emerging'],
    axis: ['illumination', 'presence'],
    triggers: ['no-words', 'forming', 'edge-of-language'],
    antiTriggers: ['name-too-fast', 'force-label'],
    weight: 0.72,
    tonalHints,
    stanceHints,
    avoidHints,
  },
];
