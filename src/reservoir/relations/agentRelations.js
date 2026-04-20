/**
 * Agent-specific node relations
 *
 * Mixed Cluster Phase: Added thought-feeling-move relations
 * Relations define how thought/feeling/move particles bind together
 */

import { RelationTypes } from '../types.js';

/**
 * @type {import('../types.js').NodeRelation[]}
 */
export const agentRelations = [
  // Existing thought-thought relations
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

  // Joe: thought-feeling-move bindings
  {
    id: 'rel-mixed-joe-001',
    from: 'joe-thought-001',
    to: 'joe-feeling-001',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.72,
  },
  {
    id: 'rel-mixed-joe-002',
    from: 'joe-thought-001',
    to: 'joe-move-001',
    relationType: RelationTypes.GROUNDS,
    weight: 0.7,
  },
  {
    id: 'rel-mixed-joe-003',
    from: 'joe-thought-004',
    to: 'joe-feeling-002',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.68,
  },
  {
    id: 'rel-mixed-joe-004',
    from: 'joe-thought-004',
    to: 'joe-move-002',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.65,
  },
  {
    id: 'rel-mixed-joe-005',
    from: 'joe-thought-006',
    to: 'joe-feeling-004',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.74,
  },
  {
    id: 'rel-mixed-joe-006',
    from: 'joe-thought-007',
    to: 'joe-move-004',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.72,
  },

  // Mina: thought-feeling-move bindings
  {
    id: 'rel-mixed-mina-001',
    from: 'mina-thought-002',
    to: 'mina-feeling-001',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.73,
  },
  {
    id: 'rel-mixed-mina-002',
    from: 'mina-thought-002',
    to: 'mina-move-001',
    relationType: RelationTypes.GROUNDS,
    weight: 0.71,
  },
  {
    id: 'rel-mixed-mina-003',
    from: 'mina-thought-003',
    to: 'mina-feeling-002',
    relationType: RelationTypes.SOFTENS,
    weight: 0.67,
  },
  {
    id: 'rel-mixed-mina-004',
    from: 'mina-thought-006',
    to: 'mina-feeling-005',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.74,
  },
  {
    id: 'rel-mixed-mina-005',
    from: 'mina-thought-006',
    to: 'mina-move-004',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.7,
  },

  // Ray: thought-feeling-move bindings
  {
    id: 'rel-mixed-ray-001',
    from: 'ray-thought-002',
    to: 'ray-feeling-001',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.69,
  },
  {
    id: 'rel-mixed-ray-002',
    from: 'ray-thought-002',
    to: 'ray-move-001',
    relationType: RelationTypes.EXTENDS,
    weight: 0.66,
  },
  {
    id: 'rel-mixed-ray-003',
    from: 'ray-thought-003',
    to: 'ray-feeling-002',
    relationType: RelationTypes.SOFTENS,
    weight: 0.64,
  },
  {
    id: 'rel-mixed-ray-004',
    from: 'ray-thought-006',
    to: 'ray-feeling-004',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.72,
  },
  {
    id: 'rel-mixed-ray-005',
    from: 'ray-thought-006',
    to: 'ray-move-005',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.7,
  },

  // Ken: thought-feeling-move bindings
  {
    id: 'rel-mixed-ken-001',
    from: 'ken-thought-002',
    to: 'ken-feeling-001',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.7,
  },
  {
    id: 'rel-mixed-ken-002',
    from: 'ken-thought-002',
    to: 'ken-move-001',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.68,
  },
  {
    id: 'rel-mixed-ken-003',
    from: 'ken-thought-003',
    to: 'ken-feeling-002',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.66,
  },
  {
    id: 'rel-mixed-ken-004',
    from: 'ken-thought-006',
    to: 'ken-move-005',
    relationType: RelationTypes.GROUNDS,
    weight: 0.7,
  },
  {
    id: 'rel-mixed-ken-005',
    from: 'ken-thought-006',
    to: 'ken-feeling-004',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.69,
  },

  // Satou: thought-feeling-move bindings
  {
    id: 'rel-mixed-satou-001',
    from: 'satou-thought-002',
    to: 'satou-feeling-001',
    relationType: RelationTypes.SUPPORTS,
    weight: 0.71,
  },
  {
    id: 'rel-mixed-satou-002',
    from: 'satou-thought-002',
    to: 'satou-move-001',
    relationType: RelationTypes.GROUNDS,
    weight: 0.69,
  },
  {
    id: 'rel-mixed-satou-003',
    from: 'satou-thought-003',
    to: 'satou-feeling-002',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.64,
  },
  {
    id: 'rel-mixed-satou-004',
    from: 'satou-thought-004',
    to: 'satou-feeling-004',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.69,
  },
  {
    id: 'rel-mixed-satou-005',
    from: 'satou-thought-005',
    to: 'satou-move-005',
    relationType: RelationTypes.GROUNDS,
    weight: 0.7,
  },

  // Mirror: field-level bindings
  {
    id: 'rel-mixed-mirror-001',
    from: 'mirror-thought-002',
    to: 'mirror-feeling-001',
    relationType: RelationTypes.GROUNDS,
    weight: 0.72,
  },
  {
    id: 'rel-mixed-mirror-002',
    from: 'mirror-thought-004',
    to: 'mirror-move-002',
    relationType: RelationTypes.TENSIONS_WITH,
    weight: 0.7,
  },
];
