/**
 * bindThoughts.test.js
 * Tests for bind minimal implementation (Phase 5)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bindThoughts } from './bindThoughts.js';

describe('bindThoughts', () => {
  it('returns empty result when no activated thoughts', () => {
    const result = bindThoughts({
      activatedThoughts: [],
      relations: [],
    });

    assert.deepEqual(result, {
      clusters: [],
      clusterMeta: {
        totalActivatedThoughts: 0,
        totalClusters: 0,
        boundClusterCount: 0,
        singleClusterCount: 0,
      },
    });
  });

  it('creates single clusters when no relations', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'first thought',
        score: 0.8,
        dominantAxis: ['illumination'],
        reasons: ['trigger-match'],
      },
      {
        nodeId: 'thought-002',
        owner: 'joe',
        textSeed: 'second thought',
        score: 0.6,
        dominantAxis: ['structure'],
        reasons: ['owner-match'],
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations: [],
    });

    assert.equal(result.clusterMeta.totalActivatedThoughts, 2);
    assert.equal(result.clusterMeta.totalClusters, 2);
    assert.equal(result.clusterMeta.boundClusterCount, 0);
    assert.equal(result.clusterMeta.singleClusterCount, 2);
    assert.equal(result.clusters.length, 2);

    // All should be single clusters
    result.clusters.forEach((cluster) => {
      assert.equal(cluster.clusterType, 'single');
      assert.equal(cluster.thoughtIds.length, 1);
      assert.equal(cluster.relationIds.length, 0);
    });
  });

  it('binds thoughts when relation exists and score is above threshold', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'first thought',
        score: 0.7,
        dominantAxis: ['illumination'],
        reasons: ['trigger-match'],
      },
      {
        nodeId: 'thought-002',
        owner: 'joe',
        textSeed: 'second thought',
        score: 0.6,
        dominantAxis: ['structure'],
        reasons: ['owner-match'],
      },
    ];

    const relations = [
      {
        id: 'rel-001',
        from: 'thought-001',
        to: 'thought-002',
        relationType: 'supports',
        weight: 0.8,
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations,
      bindThreshold: 0.35,
    });

    assert.equal(result.clusterMeta.totalActivatedThoughts, 2);
    assert.equal(result.clusterMeta.totalClusters, 1);
    assert.equal(result.clusterMeta.boundClusterCount, 1);
    assert.equal(result.clusterMeta.singleClusterCount, 0);

    const boundCluster = result.clusters[0];
    assert.equal(boundCluster.clusterType, 'bound');
    assert.equal(boundCluster.thoughtIds.length, 2);
    assert.deepEqual(boundCluster.thoughtIds, ['thought-001', 'thought-002']);
    assert.deepEqual(boundCluster.relationIds, ['rel-001']);
    assert.deepEqual(boundCluster.relationTypes, ['supports']);
    assert.ok(boundCluster.score > 0);
  });

  it('keeps thoughts as single when bind score is below threshold', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'first thought',
        score: 0.2,
        dominantAxis: ['illumination'],
        reasons: [],
      },
      {
        nodeId: 'thought-002',
        owner: 'joe',
        textSeed: 'second thought',
        score: 0.1,
        dominantAxis: ['structure'],
        reasons: [],
      },
    ];

    const relations = [
      {
        id: 'rel-001',
        from: 'thought-001',
        to: 'thought-002',
        relationType: 'softens',
        weight: 0.3,
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations,
      bindThreshold: 0.5, // High threshold
    });

    // Should not bind because score is too low
    assert.equal(result.clusterMeta.boundClusterCount, 0);
    assert.equal(result.clusterMeta.singleClusterCount, 2);
  });

  it('preserves tensions_with relation type in bound cluster', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'first thought',
        score: 0.7,
        dominantAxis: ['structure'],
        reasons: ['trigger-match'],
      },
      {
        nodeId: 'thought-002',
        owner: 'joe',
        textSeed: 'second thought',
        score: 0.6,
        dominantAxis: ['holding'],
        reasons: ['owner-match'],
      },
    ];

    const relations = [
      {
        id: 'rel-002',
        from: 'thought-001',
        to: 'thought-002',
        relationType: 'tensions_with',
        weight: 0.65,
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations,
      bindThreshold: 0.35,
    });

    // Should bind despite tensions_with (we preserve friction clusters)
    assert.equal(result.clusterMeta.boundClusterCount, 1);
    const boundCluster = result.clusters[0];
    assert.deepEqual(boundCluster.relationTypes, ['tensions_with']);
  });

  it('handles all relationType values', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'first thought',
        score: 0.7,
        dominantAxis: ['illumination'],
        reasons: [],
      },
      {
        nodeId: 'thought-002',
        owner: 'joe',
        textSeed: 'second thought',
        score: 0.7,
        dominantAxis: ['structure'],
        reasons: [],
      },
      {
        nodeId: 'thought-003',
        owner: 'shared',
        textSeed: 'third thought',
        score: 0.7,
        dominantAxis: ['grounding'],
        reasons: [],
      },
      {
        nodeId: 'thought-004',
        owner: 'shared',
        textSeed: 'fourth thought',
        score: 0.7,
        dominantAxis: ['holding'],
        reasons: [],
      },
      {
        nodeId: 'thought-005',
        owner: 'shared',
        textSeed: 'fifth thought',
        score: 0.7,
        dominantAxis: ['reflection'],
        reasons: [],
      },
    ];

    const relations = [
      {
        id: 'rel-supports',
        from: 'thought-001',
        to: 'thought-002',
        relationType: 'supports',
        weight: 0.7,
      },
      {
        id: 'rel-extends',
        from: 'thought-003',
        to: 'thought-004',
        relationType: 'extends',
        weight: 0.7,
      },
      {
        id: 'rel-grounds',
        from: 'thought-005',
        to: 'thought-001',
        relationType: 'grounds',
        weight: 0.7,
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations,
      bindThreshold: 0.35,
    });

    // thought-001 is already bound with thought-002, so grounds relation won't bind
    // We should have 2 bound clusters (supports, extends) and 1 single (thought-005)
    assert.ok(result.clusterMeta.boundClusterCount >= 2);

    const relationTypes = result.clusters.flatMap((c) => c.relationTypes);
    assert.ok(relationTypes.includes('supports'));
    assert.ok(relationTypes.includes('extends'));
  });

  it('does not bind if only one thought is activated', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'first thought',
        score: 0.7,
        dominantAxis: ['illumination'],
        reasons: ['trigger-match'],
      },
    ];

    const relations = [
      {
        id: 'rel-001',
        from: 'thought-001',
        to: 'thought-999', // Not activated
        relationType: 'supports',
        weight: 0.8,
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations,
    });

    assert.equal(result.clusterMeta.boundClusterCount, 0);
    assert.equal(result.clusterMeta.singleClusterCount, 1);
    assert.equal(result.clusters[0].clusterType, 'single');
  });

  it('extracts dominant axes from bound cluster', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'first thought',
        score: 0.7,
        dominantAxis: ['illumination', 'structure'],
        reasons: [],
      },
      {
        nodeId: 'thought-002',
        owner: 'joe',
        textSeed: 'second thought',
        score: 0.6,
        dominantAxis: ['illumination', 'holding'],
        reasons: [],
      },
    ];

    const relations = [
      {
        id: 'rel-001',
        from: 'thought-001',
        to: 'thought-002',
        relationType: 'supports',
        weight: 0.8,
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations,
    });

    const boundCluster = result.clusters[0];
    assert.ok(boundCluster.dominantAxis.includes('illumination'));
  });

  it('sorts clusters by score descending', () => {
    const activatedThoughts = [
      {
        nodeId: 'thought-001',
        owner: 'shared',
        textSeed: 'low score',
        score: 0.3,
        dominantAxis: ['illumination'],
        reasons: [],
      },
      {
        nodeId: 'thought-002',
        owner: 'joe',
        textSeed: 'high score',
        score: 0.9,
        dominantAxis: ['structure'],
        reasons: [],
      },
    ];

    const result = bindThoughts({
      activatedThoughts,
      relations: [],
    });

    assert.ok(result.clusters[0].score >= result.clusters[1].score);
  });
});
