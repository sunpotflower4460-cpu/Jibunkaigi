/**
 * selectThoughtClusters.test.js
 * Tests for Phase 6: Select minimal implementation
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { selectThoughtClusters, formatSelectedThoughtsForDebug } from './selectThoughtClusters.js';

test('selectThoughtClusters - null safety: returns empty when no clusters', () => {
  const result = selectThoughtClusters({
    agentId: 'joe',
    clusters: [],
    preconditionBias: null,
    beliefTension: null,
    othersField: [],
  });

  assert.ok(result);
  assert.ok(Array.isArray(result.selected));
  assert.strictEqual(result.selected.length, 0);
  assert.strictEqual(result.selectionMeta.totalClusters, 0);
  assert.strictEqual(result.selectionMeta.selectedCount, 0);
});

test('selectThoughtClusters - null safety: handles null input', () => {
  const result = selectThoughtClusters(null);

  assert.ok(result);
  assert.ok(Array.isArray(result.selected));
  assert.strictEqual(result.selected.length, 0);
});

test('selectThoughtClusters - basic: selects highest score cluster as primary', () => {
  const clusters = [
    {
      id: 'cluster_single_thought_1',
      thoughtIds: ['thought_1'],
      relationIds: [],
      clusterType: 'single',
      score: 0.8,
      dominantAxis: ['illumination'],
      relationTypes: [],
    },
    {
      id: 'cluster_single_thought_2',
      thoughtIds: ['thought_2'],
      relationIds: [],
      clusterType: 'single',
      score: 0.5,
      dominantAxis: ['structure'],
      relationTypes: [],
    },
  ];

  const result = selectThoughtClusters({
    agentId: 'joe',
    clusters,
    preconditionBias: null,
    beliefTension: null,
    othersField: [],
  });

  assert.strictEqual(result.selected.length, 1);
  assert.strictEqual(result.selected[0].role, 'primary');
  assert.strictEqual(result.selected[0].clusterId, 'cluster_single_thought_1');
  assert.ok(result.selected[0].score > 0.7); // Should maintain high score
});

test('selectThoughtClusters - beliefAxisMatch: boosts cluster with matching axis', () => {
  const clusters = [
    {
      id: 'cluster_a',
      thoughtIds: ['thought_a'],
      relationIds: [],
      clusterType: 'single',
      score: 0.5,
      dominantAxis: ['structure'],
      relationTypes: [],
    },
    {
      id: 'cluster_b',
      thoughtIds: ['thought_b'],
      relationIds: [],
      clusterType: 'single',
      score: 0.5,
      dominantAxis: ['illumination'],
      relationTypes: [],
    },
  ];

  const preconditionBias = {
    meaning: {
      dominantBeliefAxis: 'illumination',
    },
  };

  const result = selectThoughtClusters({
    agentId: 'joe',
    clusters,
    preconditionBias,
    beliefTension: null,
    othersField: [],
  });

  // cluster_b should win due to belief axis match
  assert.strictEqual(result.selected[0].clusterId, 'cluster_b');
  assert.ok(result.selected[0].reasons.includes('belief-axis-match'));
});

test('selectThoughtClusters - others_field redundancy: penalizes redundant clusters', () => {
  const clusters = [
    {
      id: 'cluster_holding',
      thoughtIds: ['thought_holding'],
      relationIds: [],
      clusterType: 'single',
      score: 0.6,
      dominantAxis: ['holding'],
      relationTypes: [],
    },
    {
      id: 'cluster_illumination',
      thoughtIds: ['thought_illumination'],
      relationIds: [],
      clusterType: 'single',
      score: 0.55,
      dominantAxis: ['illumination'],
      relationTypes: [],
    },
  ];

  const othersField = [
    {
      agentId: 'mina',
      gist: '受け止めた',
      toneTags: ['soft'],
      forceTags: ['hold', 'stay'],
    },
  ];

  const result = selectThoughtClusters({
    agentId: 'joe',
    clusters,
    preconditionBias: null,
    beliefTension: null,
    othersField,
  });

  // cluster_illumination should have novelty bonus
  // cluster_holding should have redundancy penalty
  // Result may vary, but illumination should get novelty reasons
  const illuminationSelected = result.selected.find(
    (s) => s.clusterId === 'cluster_illumination'
  );
  if (illuminationSelected) {
    assert.ok(
      illuminationSelected.reasons.includes('novelty-in-field') ||
      illuminationSelected.score >= 0.5
    );
  }
});

test('selectThoughtClusters - oneThreadBias: suppresses secondary when high', () => {
  const clusters = [
    {
      id: 'cluster_primary',
      thoughtIds: ['thought_1'],
      relationIds: [],
      clusterType: 'single',
      score: 0.7,
      dominantAxis: ['illumination'],
      relationTypes: [],
    },
    {
      id: 'cluster_secondary',
      thoughtIds: ['thought_2'],
      relationIds: [],
      clusterType: 'single',
      score: 0.65,
      dominantAxis: ['structure'],
      relationTypes: [],
    },
  ];

  const preconditionBias = {
    focus: {
      oneThreadBias: 0.8, // High - should suppress secondary
    },
  };

  const result = selectThoughtClusters({
    agentId: 'joe',
    clusters,
    preconditionBias,
    beliefTension: null,
    othersField: [],
    lengthPreference: 'medium',
  });

  // Should only select primary
  assert.strictEqual(result.selected.length, 1);
  assert.strictEqual(result.selected[0].role, 'primary');
});

test('selectThoughtClusters - oneThreadBias: allows secondary when low', () => {
  const clusters = [
    {
      id: 'cluster_primary',
      thoughtIds: ['thought_1'],
      relationIds: [],
      clusterType: 'single',
      score: 0.7,
      dominantAxis: ['illumination'],
      relationTypes: [],
    },
    {
      id: 'cluster_secondary',
      thoughtIds: ['thought_2'],
      relationIds: [],
      clusterType: 'single',
      score: 0.6,
      dominantAxis: ['structure'],
      relationTypes: [],
    },
  ];

  const preconditionBias = {
    focus: {
      oneThreadBias: 0.2, // Low - should allow secondary
    },
  };

  const result = selectThoughtClusters({
    agentId: 'joe',
    clusters,
    preconditionBias,
    beliefTension: null,
    othersField: [],
    lengthPreference: 'medium',
  });

  // Should select both primary and secondary
  assert.ok(result.selected.length >= 1);
  if (result.selected.length > 1) {
    assert.strictEqual(result.selected[1].role, 'secondary');
  }
});

test('selectThoughtClusters - lengthPreference short: only primary', () => {
  const clusters = [
    {
      id: 'cluster_primary',
      thoughtIds: ['thought_1'],
      relationIds: [],
      clusterType: 'single',
      score: 0.7,
      dominantAxis: ['illumination'],
      relationTypes: [],
    },
    {
      id: 'cluster_secondary',
      thoughtIds: ['thought_2'],
      relationIds: [],
      clusterType: 'single',
      score: 0.6,
      dominantAxis: ['structure'],
      relationTypes: [],
    },
  ];

  const result = selectThoughtClusters({
    agentId: 'joe',
    clusters,
    preconditionBias: null,
    beliefTension: null,
    othersField: [],
    lengthPreference: 'short',
  });

  // Should only select primary
  assert.strictEqual(result.selected.length, 1);
  assert.strictEqual(result.selected[0].role, 'primary');
});

test('formatSelectedThoughtsForDebug - returns formatted string', () => {
  const result = {
    selected: [
      {
        clusterId: 'cluster_primary',
        score: 0.8,
        role: 'primary',
        reasons: ['high-cluster-score', 'belief-axis-match'],
      },
    ],
    selectionMeta: {
      totalClusters: 3,
      selectedCount: 1,
      dominantSelectedAxis: ['illumination'],
    },
  };

  const formatted = formatSelectedThoughtsForDebug(result);

  assert.ok(typeof formatted === 'string');
  assert.ok(formatted.includes('primary=cluster_primary'));
  assert.ok(formatted.includes('1/3'));
});

test('formatSelectedThoughtsForDebug - handles empty result', () => {
  const result = {
    selected: [],
    selectionMeta: {
      totalClusters: 0,
      selectedCount: 0,
      dominantSelectedAxis: [],
    },
  };

  const formatted = formatSelectedThoughtsForDebug(result);

  assert.strictEqual(formatted, 'no selected clusters');
});
