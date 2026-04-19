/**
 * Shared move nodes - accessible by all agents
 *
 * L2 Phase: Minimal introduction of move particles
 * Move nodes represent directional seeds - where attention wants to go.
 * They are not commands, but orientations and inclinations.
 */

import { NodeOwners, NodeCategories } from '../types.js';

/**
 * @type {import('../types.js').MoveNode[]}
 */
export const sharedMoveNodes = [
  {
    id: 'shared-move-001',
    owner: NodeOwners.SHARED,
    category: NodeCategories.MOVE,
    textSeed: 'not ready to close',
    tags: ['openness', 'not-closing', 'remaining-open'],
    axis: ['presence', 'holding'],
    triggers: ['incompleteness', 'still-alive', 'not-done'],
    antiTriggers: ['force-close', 'end-now'],
    weight: 0.73,
  },
  {
    id: 'shared-move-002',
    owner: NodeOwners.SHARED,
    category: NodeCategories.MOVE,
    textSeed: 'wanting to check, confirm',
    tags: ['checking', 'confirming', 'verifying'],
    axis: ['structure', 'presence'],
    triggers: ['uncertainty', 'need-confirm', 'check-urge'],
    antiTriggers: ['assume-known', 'skip-check'],
    weight: 0.7,
  },
  {
    id: 'shared-move-003',
    owner: NodeOwners.SHARED,
    category: NodeCategories.MOVE,
    textSeed: 'drawing distance',
    tags: ['distance', 'stepping-back', 'space'],
    axis: ['structure', 'holding'],
    triggers: ['too-close', 'overwhelm', 'need-distance'],
    antiTriggers: ['stay-merged', 'closer-pressure'],
    weight: 0.68,
  },
  {
    id: 'shared-move-004',
    owner: NodeOwners.SHARED,
    category: NodeCategories.MOVE,
    textSeed: 'leaning closer',
    tags: ['closeness', 'approaching', 'toward'],
    axis: ['presence', 'holding'],
    triggers: ['care', 'connection', 'draw-near'],
    antiTriggers: ['distance-required', 'space-needed'],
    weight: 0.71,
  },
  {
    id: 'shared-move-005',
    owner: NodeOwners.SHARED,
    category: NodeCategories.MOVE,
    textSeed: 'setting aside for now',
    tags: ['postponing', 'setting-aside', 'pausing'],
    axis: ['holding', 'structure'],
    triggers: ['not-now', 'pause-needed', 'timing-off'],
    antiTriggers: ['solve-now', 'force-complete'],
    weight: 0.69,
  },
  {
    id: 'shared-move-006',
    owner: NodeOwners.SHARED,
    category: NodeCategories.MOVE,
    textSeed: 'touching lightly, not grasping',
    tags: ['lightness', 'gentle-touch', 'not-grasping'],
    axis: ['presence', 'holding'],
    triggers: ['delicate', 'gentle-approach', 'careful'],
    antiTriggers: ['grab', 'force-hold'],
    weight: 0.72,
  },
];
