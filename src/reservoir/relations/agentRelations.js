/**
 * Agent-specific node relations
 *
 * Phase 0: Empty for now
 * Relations will be populated later when bind implementation begins.
 */

import { RelationTypes } from '../types.js';

/**
 * @type {import('../types.js').NodeRelation[]}
 */
export const agentRelations = [
  {
    id: 'rel-agent-001',
    from: 'joe-thought-001',
    to: 'shared-thought-002',
    relationType: RelationTypes.EXTENDS,
    weight: 0.68,
  },
  {
    id: 'rel-agent-002',
    from: 'ken-thought-001',
    to: 'shared-thought-003',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.62,
  },
  {
    id: 'rel-agent-003',
    from: 'mina-thought-001',
    to: 'shared-thought-005',
    relationType: RelationTypes.EXTENDS,
    weight: 0.7,
  },
  {
    id: 'rel-agent-004',
    from: 'satou-thought-001',
    to: 'shared-thought-002',
    relationType: RelationTypes.GROUNDS,
    weight: 0.65,
  },
  {
    id: 'rel-agent-005',
    from: 'ray-thought-002',
    to: 'shared-thought-005',
    relationType: RelationTypes.SOFTENS,
    weight: 0.6,
  },
];
