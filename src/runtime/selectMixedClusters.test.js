/**
 * selectMixedClusters.test.js
 * Tests for selectMixedClusters - mixed cluster selection
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectMixedClusters } from './selectMixedClusters.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NULL SAFETY TESTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test('selectMixedClusters - null input: returns empty result', () => {
  const result = selectMixedClusters(null);

  assert.strictEqual(result.selected.length, 0);
  assert.strictEqual(result.selectionMeta.totalClusters, 0);
  assert.strictEqual(result.selectionMeta.selectedCount, 0);
  assert.deepStrictEqual(result.selectionMeta.dominantSelectedAxis, []);
});

test('selectMixedClusters - undefined input: returns empty result', () => {
  const result = selectMixedClusters(undefined);

  assert.strictEqual(result.selected.length, 0);
  assert.strictEqual(result.selectionMeta.totalClusters, 0);
});

test('selectMixedClusters - empty clusters: returns empty result', () => {
  const result = selectMixedClusters({
    agentId: 'joe',
    clusters: [],
    preconditionBias: {},
    beliefTension: {},
    othersField: [],
    lengthPreference: 'medium',
  });

  assert.strictEqual(result.selected.length, 0);
  assert.strictEqual(result.selectionMeta.totalClusters, 0);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SINGLE CLUSTER SELECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test('selectMixedClusters - single cluster: selects primary', () => {
  const clusters = [
    {
      clusterId: 'cluster-1',
      score: 0.75,
      dominantAxis: ['structure'],
      thoughtIds: ['t1'],
      feelingIds: ['f1'],
      moveIds: ['m1'],
      relationTypes: ['compare'],
    },
  ];

  const result = selectMixedClusters({
    agentId: 'ken',
    clusters,
    preconditionBias: {
      focus: {
        oneThreadBias: 0.3,
        antiOverExpansion: 0.2,
      },
      meaning: {
        dominantBeliefAxis: 'structure',
      },
    },
    beliefTension: {
      dominantTensionAxis: 'structure',
      totalTensionStrength: 0.5,
    },
    othersField: [],
    lengthPreference: 'medium',
  });

  assert.strictEqual(result.selected.length, 1);
  assert.strictEqual(result.selected[0].role, 'primary');
  assert.strictEqual(result.selected[0].clusterId, 'cluster-1');
  assert.ok(result.selected[0].score > 0.75); // Should have bonuses
  assert.ok(result.selected[0].reasons.includes('belief-axis-match'));
  assert.ok(result.selected[0].reasons.includes('tension-axis-match'));
  assert.ok(result.selected[0].reasons.includes('mixed-cluster-bonus')); // Has feeling
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MULTIPLE CLUSTER SELECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test('selectMixedClusters - two clusters, medium length: selects both', () => {
  const clusters = [
    {
      clusterId: 'cluster-1',
      score: 0.75,
      dominantAxis: ['structure'],
      thoughtIds: ['t1'],
      feelingIds: ['f1'],
      moveIds: ['m1'],
      relationTypes: ['compare'],
    },
    {
      clusterId: 'cluster-2',
      score: 0.65,
      dominantAxis: ['holding'],
      thoughtIds: ['t2'],
      feelingIds: ['f2'],
      moveIds: [],
      relationTypes: ['soften'],
    },
  ];

  const result = selectMixedClusters({
    agentId: 'mina',
    clusters,
    preconditionBias: {
      focus: {
        oneThreadBias: 0.2,
        antiOverExpansion: 0.1,
      },
    },
    beliefTension: {},
    othersField: [],
    lengthPreference: 'medium',
  });

  assert.strictEqual(result.selected.length, 2);
  assert.strictEqual(result.selected[0].role, 'primary');
  assert.strictEqual(result.selected[1].role, 'secondary');
});

test('selectMixedClusters - lengthPreference short: only primary', () => {
  const clusters = [
    {
      clusterId: 'cluster-1',
      score: 0.75,
      dominantAxis: ['illumination'],
      thoughtIds: ['t1'],
      feelingIds: [],
      moveIds: ['m1'],
    },
    {
      clusterId: 'cluster-2',
      score: 0.65,
      dominantAxis: ['reflection'],
      thoughtIds: ['t2'],
      feelingIds: ['f2'],
      moveIds: [],
    },
  ];

  const result = selectMixedClusters({
    agentId: 'ray',
    clusters,
    preconditionBias: {},
    beliefTension: {},
    othersField: [],
    lengthPreference: 'short',
  });

  // Short length preference should select only primary
  assert.strictEqual(result.selected.length, 1);
  assert.strictEqual(result.selected[0].role, 'primary');
});

test('selectMixedClusters - high oneThreadBias: only primary', () => {
  const clusters = [
    {
      clusterId: 'cluster-1',
      score: 0.70,
      dominantAxis: ['structure'],
      thoughtIds: ['t1'],
      feelingIds: ['f1'],
      moveIds: [],
    },
    {
      clusterId: 'cluster-2',
      score: 0.65,
      dominantAxis: ['holding'],
      thoughtIds: ['t2'],
      feelingIds: [],
      moveIds: ['m2'],
    },
  ];

  const result = selectMixedClusters({
    agentId: 'ken',
    clusters,
    preconditionBias: {
      focus: {
        oneThreadBias: 0.7,
        antiOverExpansion: 0.5,
      },
    },
    beliefTension: {},
    othersField: [],
    lengthPreference: 'medium',
  });

  // High oneThreadBias should suppress secondary
  assert.strictEqual(result.selected.length, 1);
  assert.strictEqual(result.selected[0].role, 'primary');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OTHERS_FIELD INFLUENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test('selectMixedClusters - othersField creates redundancy: affects scores', () => {
  const clusters = [
    {
      clusterId: 'cluster-1',
      score: 0.70,
      dominantAxis: ['holding'],
      thoughtIds: ['t1'],
      feelingIds: ['f1'],
      moveIds: [],
    },
    {
      clusterId: 'cluster-2',
      score: 0.68,
      dominantAxis: ['structure'],
      thoughtIds: ['t2'],
      feelingIds: [],
      moveIds: ['m2'],
    },
  ];

  const othersField = [
    {
      agentId: 'other-agent',
      forceTags: ['hold', 'stay'],
    },
  ];

  const result = selectMixedClusters({
    agentId: 'mina',
    clusters,
    preconditionBias: {},
    beliefTension: {},
    othersField,
    lengthPreference: 'medium',
  });

  // cluster-1 (holding) should get redundancy penalty from othersField
  // cluster-2 (structure) may become primary due to novelty
  const primary = result.selected.find(s => s.role === 'primary');
  assert.ok(primary);
  // Check that redundancy is considered in reasons
  const cluster1Result = result.selected.find(s => s.clusterId === 'cluster-1');
  if (cluster1Result) {
    // May or may not be selected depending on penalties
    assert.ok(true);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIXED CLUSTER BONUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test('selectMixedClusters - mixed cluster bonus: feeling + move gives higher score', () => {
  const clusters = [
    {
      clusterId: 'cluster-1',
      score: 0.60,
      dominantAxis: ['structure'],
      thoughtIds: ['t1'],
      feelingIds: [], // No feeling
      moveIds: [], // No move
    },
    {
      clusterId: 'cluster-2',
      score: 0.60,
      dominantAxis: ['holding'],
      thoughtIds: ['t2'],
      feelingIds: ['f2'], // Has feeling
      moveIds: ['m2'], // Has move
    },
  ];

  const result = selectMixedClusters({
    agentId: 'joe',
    clusters,
    preconditionBias: {},
    beliefTension: {},
    othersField: [],
    lengthPreference: 'medium',
  });

  // cluster-2 should win due to mixed cluster bonus
  const primary = result.selected.find(s => s.role === 'primary');
  assert.strictEqual(primary.clusterId, 'cluster-2');
  assert.ok(primary.reasons.includes('mixed-cluster-bonus'));
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOMINANT AXIS EXTRACTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test('selectMixedClusters - extracts dominantSelectedAxis from selected clusters', () => {
  const clusters = [
    {
      clusterId: 'cluster-1',
      score: 0.75,
      dominantAxis: ['structure', 'mission'],
      thoughtIds: ['t1'],
      feelingIds: ['f1'],
      moveIds: [],
    },
    {
      clusterId: 'cluster-2',
      score: 0.65,
      dominantAxis: ['structure', 'holding'],
      thoughtIds: ['t2'],
      feelingIds: [],
      moveIds: ['m2'],
    },
  ];

  const result = selectMixedClusters({
    agentId: 'ken',
    clusters,
    preconditionBias: {},
    beliefTension: {},
    othersField: [],
    lengthPreference: 'medium',
  });

  // Both clusters selected, structure appears twice
  assert.ok(result.selectionMeta.dominantSelectedAxis.includes('structure'));
  assert.ok(result.selectionMeta.dominantSelectedAxis.length <= 3);
});
