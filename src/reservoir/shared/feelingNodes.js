/**
 * Shared feeling nodes - accessible by all agents
 *
 * L2 Phase: Minimal introduction of feeling particles
 * These represent affective seeds, not emotion labels.
 * Feeling particles are textures of sensed experience, not complete emotions.
 */

import { NodeOwners, NodeCategories } from '../types.js';

/**
 * @type {import('../types.js').FeelingNode[]}
 */
export const sharedFeelingNodes = [
  {
    id: 'shared-feeling-001',
    owner: NodeOwners.SHARED,
    category: NodeCategories.FEELING,
    textSeed: 'chest tightening',
    tags: ['contraction', 'chest', 'tightness'],
    axis: ['holding'],
    triggers: ['vulnerability', 'threat', 'exposure'],
    antiTriggers: ['body-dismissed', 'mental-only'],
    weight: 0.72,
  },
  {
    id: 'shared-feeling-002',
    owner: NodeOwners.SHARED,
    category: NodeCategories.FEELING,
    textSeed: 'residual warmth',
    tags: ['warmth', 'lingering', 'gentle'],
    axis: ['presence', 'holding'],
    triggers: ['care-present', 'connection', 'softness'],
    antiTriggers: ['rush', 'urgency'],
    weight: 0.7,
  },
  {
    id: 'shared-feeling-003',
    owner: NodeOwners.SHARED,
    category: NodeCategories.FEELING,
    textSeed: 'rough texture, grating',
    tags: ['roughness', 'discomfort', 'friction'],
    axis: ['presence'],
    triggers: ['conflict', 'discord', 'tension'],
    antiTriggers: ['smooth-over', 'bypass'],
    weight: 0.68,
  },
  {
    id: 'shared-feeling-004',
    owner: NodeOwners.SHARED,
    category: NodeCategories.FEELING,
    textSeed: 'holding breath, not released',
    tags: ['suspension', 'waiting', 'tension'],
    axis: ['holding', 'presence'],
    triggers: ['anticipation', 'uncertainty', 'pause'],
    antiTriggers: ['force-release', 'push-forward'],
    weight: 0.71,
  },
  {
    id: 'shared-feeling-005',
    owner: NodeOwners.SHARED,
    category: NodeCategories.FEELING,
    textSeed: 'slight loosening',
    tags: ['release', 'softening', 'opening'],
    axis: ['presence', 'holding'],
    triggers: ['relief', 'easing', 'permission'],
    antiTriggers: ['pressure-still-high', 'cannot-relax'],
    weight: 0.69,
  },
  {
    id: 'shared-feeling-006',
    owner: NodeOwners.SHARED,
    category: NodeCategories.FEELING,
    textSeed: 'unstable ground underfoot',
    tags: ['instability', 'ungroundedness', 'shaking'],
    axis: ['structure', 'presence'],
    triggers: ['foundation-shaking', 'uncertainty', 'loss'],
    antiTriggers: ['override-body', 'think-only'],
    weight: 0.73,
  },
];
