// Test for reservoir loader
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSharedThoughtNodes,
  getAgentThoughtNodes,
  getThoughtReservoir,
  getSharedFeelingNodes,
  getAgentFeelingNodes,
  getFeelingReservoir,
  getSharedMoveNodes,
  getAgentMoveNodes,
  getMoveReservoir,
  getNodeRelations,
  getReservoirStats,
} from './loadReservoir.js';

describe('Reservoir Loader', () => {
  test('getSharedThoughtNodes returns shared nodes', () => {
    const nodes = getSharedThoughtNodes();
    assert.ok(Array.isArray(nodes));
    assert.ok(nodes.length > 0);
    assert.strictEqual(nodes[0].owner, 'shared');
    assert.strictEqual(nodes[0].category, 'thought');
  });

  test('getAgentThoughtNodes returns agent-specific nodes', () => {
    const joeNodes = getAgentThoughtNodes('joe');
    assert.ok(Array.isArray(joeNodes));
    assert.ok(joeNodes.length > 0);
    assert.strictEqual(joeNodes[0].owner, 'joe');

    const kenNodes = getAgentThoughtNodes('ken');
    assert.ok(Array.isArray(kenNodes));
    assert.ok(kenNodes.length > 0);
    assert.strictEqual(kenNodes[0].owner, 'ken');
  });

  test('getAgentThoughtNodes returns empty array for invalid agent', () => {
    const nodes = getAgentThoughtNodes('invalid');
    assert.ok(Array.isArray(nodes));
    assert.strictEqual(nodes.length, 0);
  });

  test('getThoughtReservoir returns shared + agent nodes', () => {
    const reservoir = getThoughtReservoir('joe');
    assert.ok(Array.isArray(reservoir));

    const sharedCount = getSharedThoughtNodes().length;
    const joeCount = getAgentThoughtNodes('joe').length;
    assert.strictEqual(reservoir.length, sharedCount + joeCount);

    // Check that shared nodes are included
    const hasShared = reservoir.some(node => node.owner === 'shared');
    assert.ok(hasShared);

    // Check that joe nodes are included
    const hasJoe = reservoir.some(node => node.owner === 'joe');
    assert.ok(hasJoe);
  });

  test('feeling nodes can be loaded (empty for Phase 0)', () => {
    const shared = getSharedFeelingNodes();
    assert.ok(Array.isArray(shared));

    const agent = getAgentFeelingNodes('joe');
    assert.ok(Array.isArray(agent));

    const reservoir = getFeelingReservoir('joe');
    assert.ok(Array.isArray(reservoir));
  });

  test('move nodes can be loaded (empty for Phase 0)', () => {
    const shared = getSharedMoveNodes();
    assert.ok(Array.isArray(shared));

    const agent = getAgentMoveNodes('joe');
    assert.ok(Array.isArray(agent));

    const reservoir = getMoveReservoir('joe');
    assert.ok(Array.isArray(reservoir));
  });

  test('relations can be loaded (empty for Phase 0)', () => {
    const relations = getNodeRelations('joe');
    assert.ok(Array.isArray(relations));
  });

  test('getReservoirStats returns counts for all node types', () => {
    const stats = getReservoirStats('joe');
    assert.ok(typeof stats === 'object');
    assert.ok(typeof stats.sharedThoughtCount === 'number');
    assert.ok(typeof stats.agentThoughtCount === 'number');
    assert.ok(typeof stats.totalThoughtCount === 'number');
    assert.ok(typeof stats.sharedFeelingCount === 'number');
    assert.ok(typeof stats.agentFeelingCount === 'number');
    assert.ok(typeof stats.totalFeelingCount === 'number');
    assert.ok(typeof stats.sharedMoveCount === 'number');
    assert.ok(typeof stats.agentMoveCount === 'number');
    assert.ok(typeof stats.totalMoveCount === 'number');
    assert.ok(typeof stats.relationCount === 'number');

    // Validate totals
    assert.strictEqual(
      stats.totalThoughtCount,
      stats.sharedThoughtCount + stats.agentThoughtCount
    );
  });

  test('node structure validation', () => {
    const nodes = getThoughtReservoir('joe');
    for (const node of nodes) {
      assert.ok(node.id);
      assert.ok(node.owner);
      assert.ok(node.category);
      assert.ok(node.textSeed);
      assert.ok(Array.isArray(node.tags));
      assert.ok(Array.isArray(node.axis));
      assert.ok(Array.isArray(node.triggers));
      assert.ok(typeof node.weight === 'number');
      assert.ok(node.weight >= 0 && node.weight <= 1);
    }
  });

  test('all agents have thought nodes', () => {
    const agents = ['joe', 'ken', 'mina', 'ray', 'satou', 'mirror'];
    for (const agentId of agents) {
      const nodes = getAgentThoughtNodes(agentId);
      assert.ok(nodes.length > 0, `${agentId} should have thought nodes`);
      assert.strictEqual(nodes[0].owner, agentId);
    }
  });
});
