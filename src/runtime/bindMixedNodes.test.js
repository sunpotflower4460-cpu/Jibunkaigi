/**
 * bindMixedNodes.test.js
 * Test suite for mixed cluster binding
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { bindMixedNodes } from './bindMixedNodes.js';

describe('bindMixedNodes', () => {
  it('returns null-safe empty result when no nodes provided', () => {
    const result = bindMixedNodes({});

    assert.ok(result, 'should return a result');
    assert.ok(Array.isArray(result.clusters), 'should have clusters array');
    assert.strictEqual(result.clusters.length, 0, 'should have no clusters');
    assert.ok(result.clusterMeta, 'should have clusterMeta');
    assert.strictEqual(result.clusterMeta.totalActivatedNodes, 0);
    assert.strictEqual(result.clusterMeta.totalClusters, 0);
    assert.strictEqual(result.clusterMeta.boundClusterCount, 0);
    assert.strictEqual(result.clusterMeta.singleClusterCount, 0);
  });

  it('creates single cluster for thought-only when no relations', () => {
    const activatedThoughts = [
      {
        nodeId: 'joe-thought-001',
        category: 'thought',
        owner: 'joe',
        textSeed: 'test thought',
        score: 0.75,
        reasons: [],
        dominantAxis: ['illumination'],
      },
    ];

    const result = bindMixedNodes({
      activatedThoughts,
      activatedFeelings: [],
      activatedMoves: [],
      relations: [],
    });

    assert.strictEqual(result.clusters.length, 1, 'should have 1 cluster');
    assert.strictEqual(result.clusters[0].clusterType, 'single', 'should be single cluster');
    assert.strictEqual(result.clusters[0].thoughtIds.length, 1);
    assert.strictEqual(result.clusters[0].feelingIds.length, 0);
    assert.strictEqual(result.clusters[0].moveIds.length, 0);
    assert.strictEqual(result.clusterMeta.singleClusterCount, 1);
    assert.strictEqual(result.clusterMeta.boundClusterCount, 0);
  });

  it('creates bound cluster when thought-feeling relation exists', () => {
    const activatedThoughts = [
      {
        nodeId: 'joe-thought-001',
        category: 'thought',
        owner: 'joe',
        textSeed: 'test thought',
        score: 0.75,
        reasons: [],
        dominantAxis: ['illumination'],
      },
    ];

    const activatedFeelings = [
      {
        nodeId: 'joe-feeling-001',
        category: 'feeling',
        owner: 'joe',
        textSeed: 'test feeling',
        score: 0.70,
        reasons: [],
        dominantAxis: ['illumination'],
      },
    ];

    const relations = [
      {
        id: 'rel-001',
        from: 'joe-thought-001',
        to: 'joe-feeling-001',
        relationType: 'supports',
        weight: 0.7,
      },
    ];

    const result = bindMixedNodes({
      activatedThoughts,
      activatedFeelings,
      activatedMoves: [],
      relations,
    });

    assert.strictEqual(result.clusters.length, 1, 'should have 1 cluster');
    assert.strictEqual(result.clusters[0].clusterType, 'bound', 'should be bound cluster');
    assert.strictEqual(result.clusters[0].thoughtIds.length, 1);
    assert.strictEqual(result.clusters[0].feelingIds.length, 1);
    assert.strictEqual(result.clusters[0].moveIds.length, 0);
    assert.ok(result.clusters[0].relationIds.includes('rel-001'));
    assert.strictEqual(result.clusterMeta.boundClusterCount, 1);
    assert.strictEqual(result.clusterMeta.singleClusterCount, 0);
  });

  it('creates bound cluster when thought-move relation exists', () => {
    const activatedThoughts = [
      {
        nodeId: 'mina-thought-002',
        category: 'thought',
        owner: 'mina',
        textSeed: 'test thought',
        score: 0.78,
        reasons: [],
        dominantAxis: ['holding'],
      },
    ];

    const activatedMoves = [
      {
        nodeId: 'mina-move-001',
        category: 'move',
        owner: 'mina',
        textSeed: 'test move',
        score: 0.72,
        reasons: [],
        dominantAxis: ['holding'],
      },
    ];

    const relations = [
      {
        id: 'rel-002',
        from: 'mina-thought-002',
        to: 'mina-move-001',
        relationType: 'grounds',
        weight: 0.71,
      },
    ];

    const result = bindMixedNodes({
      activatedThoughts,
      activatedFeelings: [],
      activatedMoves,
      relations,
    });

    assert.strictEqual(result.clusters.length, 1, 'should have 1 cluster');
    assert.strictEqual(result.clusters[0].clusterType, 'bound', 'should be bound cluster');
    assert.strictEqual(result.clusters[0].thoughtIds.length, 1);
    assert.strictEqual(result.clusters[0].feelingIds.length, 0);
    assert.strictEqual(result.clusters[0].moveIds.length, 1);
    assert.ok(result.clusters[0].relationIds.includes('rel-002'));
    assert.strictEqual(result.clusterMeta.boundClusterCount, 1);
  });

  it('creates mixed cluster with thought + feeling + move via relations', () => {
    const activatedThoughts = [
      {
        nodeId: 'joe-thought-001',
        category: 'thought',
        owner: 'joe',
        textSeed: 'test thought',
        score: 0.80,
        reasons: [],
        dominantAxis: ['illumination', 'presence'],
      },
    ];

    const activatedFeelings = [
      {
        nodeId: 'joe-feeling-001',
        category: 'feeling',
        owner: 'joe',
        textSeed: 'test feeling',
        score: 0.75,
        reasons: [],
        dominantAxis: ['illumination', 'presence'],
      },
    ];

    const activatedMoves = [
      {
        nodeId: 'joe-move-001',
        category: 'move',
        owner: 'joe',
        textSeed: 'test move',
        score: 0.74,
        reasons: [],
        dominantAxis: ['illumination', 'presence'],
      },
    ];

    const relations = [
      {
        id: 'rel-001',
        from: 'joe-thought-001',
        to: 'joe-feeling-001',
        relationType: 'supports',
        weight: 0.72,
      },
      {
        id: 'rel-002',
        from: 'joe-thought-001',
        to: 'joe-move-001',
        relationType: 'grounds',
        weight: 0.70,
      },
    ];

    const result = bindMixedNodes({
      activatedThoughts,
      activatedFeelings,
      activatedMoves,
      relations,
    });

    assert.strictEqual(result.clusters.length, 1, 'should have 1 cluster');
    assert.strictEqual(result.clusters[0].clusterType, 'bound', 'should be bound cluster');
    assert.strictEqual(result.clusters[0].thoughtIds.length, 1);
    assert.strictEqual(result.clusters[0].feelingIds.length, 1);
    assert.strictEqual(result.clusters[0].moveIds.length, 1);
    assert.strictEqual(result.clusters[0].relationIds.length, 2);
    assert.ok(result.clusters[0].dominantAxis.includes('illumination'));
    assert.ok(result.clusters[0].dominantAxis.includes('presence'));
    assert.strictEqual(result.clusterMeta.totalActivatedNodes, 3);
  });

  it('preserves tensions_with relations in mixed clusters', () => {
    const activatedThoughts = [
      {
        nodeId: 'ken-thought-002',
        category: 'thought',
        owner: 'ken',
        textSeed: 'test thought',
        score: 0.76,
        reasons: [],
        dominantAxis: ['structure'],
      },
    ];

    const activatedFeelings = [
      {
        nodeId: 'ken-feeling-001',
        category: 'feeling',
        owner: 'ken',
        textSeed: 'test feeling',
        score: 0.71,
        reasons: [],
        dominantAxis: ['structure'],
      },
    ];

    const relations = [
      {
        id: 'rel-tension-001',
        from: 'ken-thought-002',
        to: 'ken-feeling-001',
        relationType: 'tensions_with',
        weight: 0.70,
      },
    ];

    const result = bindMixedNodes({
      activatedThoughts,
      activatedFeelings,
      activatedMoves: [],
      relations,
    });

    assert.strictEqual(result.clusters.length, 1);
    assert.strictEqual(result.clusters[0].clusterType, 'bound');
    assert.ok(result.clusters[0].relationTypes.includes('tensions_with'));
    assert.ok(result.clusters[0].score > 0, 'tension cluster should have positive score');
  });

  it('creates separate single clusters for unrelated nodes', () => {
    const activatedThoughts = [
      {
        nodeId: 'joe-thought-001',
        category: 'thought',
        owner: 'joe',
        textSeed: 'test thought 1',
        score: 0.75,
        reasons: [],
        dominantAxis: ['illumination'],
      },
      {
        nodeId: 'mina-thought-002',
        category: 'thought',
        owner: 'mina',
        textSeed: 'test thought 2',
        score: 0.70,
        reasons: [],
        dominantAxis: ['holding'],
      },
    ];

    const activatedFeelings = [
      {
        nodeId: 'ray-feeling-001',
        category: 'feeling',
        owner: 'ray',
        textSeed: 'test feeling',
        score: 0.68,
        reasons: [],
        dominantAxis: ['preverbal'],
      },
    ];

    const result = bindMixedNodes({
      activatedThoughts,
      activatedFeelings,
      activatedMoves: [],
      relations: [], // No relations
    });

    assert.strictEqual(result.clusters.length, 3, 'should have 3 separate single clusters');
    assert.ok(result.clusters.every(c => c.clusterType === 'single'));
    assert.strictEqual(result.clusterMeta.singleClusterCount, 3);
    assert.strictEqual(result.clusterMeta.boundClusterCount, 0);
  });

  it('respects bind threshold for cluster creation', () => {
    const activatedThoughts = [
      {
        nodeId: 'joe-thought-001',
        category: 'thought',
        owner: 'joe',
        textSeed: 'test thought',
        score: 0.30, // Low score
        reasons: [],
        dominantAxis: ['illumination'],
      },
    ];

    const activatedFeelings = [
      {
        nodeId: 'joe-feeling-001',
        category: 'feeling',
        owner: 'joe',
        textSeed: 'test feeling',
        score: 0.25, // Low score
        reasons: [],
        dominantAxis: ['illumination'],
      },
    ];

    const relations = [
      {
        id: 'rel-001',
        from: 'joe-thought-001',
        to: 'joe-feeling-001',
        relationType: 'supports',
        weight: 0.30, // Low weight
      },
    ];

    const result = bindMixedNodes({
      activatedThoughts,
      activatedFeelings,
      activatedMoves: [],
      relations,
      bindThreshold: 0.50, // High threshold
    });

    // Should create single clusters because bind score is below threshold
    assert.strictEqual(result.clusters.length, 2);
    assert.ok(result.clusters.every(c => c.clusterType === 'single'));
    assert.strictEqual(result.clusterMeta.boundClusterCount, 0);
  });
});
