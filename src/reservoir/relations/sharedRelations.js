/**
 * Shared node relations
 *
 * Phase 0: Empty for now
 * Relations will be populated later when bind implementation begins.
 *
 * Relations define how nodes support, soften, tension with, ground, or extend each other.
 */

import { RelationTypes } from '../types.js';

/**
 * @type {import('../types.js').NodeRelation[]}
 */
export const sharedRelations = [
  {
    id: 'rel-001',
    from: 'shared-thought-002',
    to: 'shared-thought-005',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.7,
  },
  {
    id: 'rel-002',
    from: 'shared-thought-004',
    to: 'shared-thought-003',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.65,
  },
  {
    id: 'rel-003',
    from: 'shared-thought-005',
    to: 'shared-thought-003',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.6,
  },
];
