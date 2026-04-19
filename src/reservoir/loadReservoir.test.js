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

  test('relations can be loaded', () => {
    const relations = getNodeRelations('joe');
    assert.ok(Array.isArray(relations));
    assert.ok(relations.length > 0, 'Phase 0 should have minimal relations');
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

  // Expanded reservoir counts
  test('Shared reservoirs reflect expanded counts', () => {
    const sharedThought = getSharedThoughtNodes();
    const sharedFeeling = getSharedFeelingNodes();
    const sharedMove = getSharedMoveNodes();

    assert.strictEqual(sharedThought.length, 8, 'Shared thought nodes should be 8');
    assert.strictEqual(sharedFeeling.length, 9, 'Shared feeling nodes should be 9');
    assert.strictEqual(sharedMove.length, 9, 'Shared move nodes should be 9');
  });

  test('Agent reservoirs reflect expanded counts', () => {
    const expectations = {
      joe: { thought: 7, feeling: 5, move: 5 },
      ken: { thought: 6, feeling: 5, move: 5 },
      mina: { thought: 6, feeling: 6, move: 5 },
      ray: { thought: 6, feeling: 5, move: 5 },
      satou: { thought: 5, feeling: 4, move: 5 },
      mirror: { thought: 5, feeling: 4, move: 4 },
    };

    for (const [agentId, counts] of Object.entries(expectations)) {
      assert.strictEqual(getAgentThoughtNodes(agentId).length, counts.thought, `${agentId} thought count`);
      assert.strictEqual(getAgentFeelingNodes(agentId).length, counts.feeling, `${agentId} feeling count`);
      assert.strictEqual(getAgentMoveNodes(agentId).length, counts.move, `${agentId} move count`);
    }
  });

  test('Reservoir stats match shared + agent totals', () => {
    const stats = getReservoirStats('joe');
    assert.strictEqual(stats.sharedThoughtCount, 8);
    assert.strictEqual(stats.agentThoughtCount, 7);
    assert.strictEqual(stats.totalThoughtCount, 15);

    assert.strictEqual(stats.sharedFeelingCount, 9);
    assert.strictEqual(stats.agentFeelingCount, 5);
    assert.strictEqual(stats.totalFeelingCount, 14);

    assert.strictEqual(stats.sharedMoveCount, 9);
    assert.strictEqual(stats.agentMoveCount, 5);
    assert.strictEqual(stats.totalMoveCount, 14);
  });

  test('Expanded relations exist', () => {
    const relations = getNodeRelations('joe');
    assert.ok(relations.length >= 36, 'Expanded reservoir should have at least 36 relations');

    // Check relation structure
    for (const rel of relations) {
      assert.ok(rel.id);
      assert.ok(rel.from);
      assert.ok(rel.to);
      assert.ok(rel.relationType);
      assert.ok(['supports', 'softens', 'tensions_with', 'grounds', 'extends'].includes(rel.relationType));
      assert.ok(typeof rel.weight === 'number');
      assert.ok(rel.weight >= 0 && rel.weight <= 1);
    }
  });

  test('anti-triggers are present in thought nodes', () => {
    const allNodes = getThoughtReservoir('ken');
    const nodesWithAntiTriggers = allNodes.filter(node =>
      node.antiTriggers && Array.isArray(node.antiTriggers) && node.antiTriggers.length > 0
    );
    assert.ok(nodesWithAntiTriggers.length > 0, 'Some nodes should have anti-triggers');
  });

  test('Ken thought nodes have anti-triggers for body-foregrounded scenarios', () => {
    const kenNodes = getAgentThoughtNodes('ken');
    const hasBodyAntiTriggers = kenNodes.some(node =>
      node.antiTriggers && (
        node.antiTriggers.includes('body-foregrounded') ||
        node.antiTriggers.includes('raw-feeling-dominant') ||
        node.antiTriggers.includes('somatic-intensity') ||
        node.antiTriggers.includes('body-overwhelm')
      )
    );
    assert.ok(hasBodyAntiTriggers, 'Ken should have anti-triggers for body-foregrounded scenarios');
  });

  test('Mina thought nodes have anti-triggers for solution-pressure scenarios', () => {
    const minaNodes = getAgentThoughtNodes('mina');
    const hasSolutionAntiTriggers = minaNodes.some(node =>
      node.antiTriggers && (
        node.antiTriggers.includes('fixing-pressure') ||
        node.antiTriggers.includes('solution-demand') ||
        node.antiTriggers.includes('rebuild-pressure') ||
        node.antiTriggers.includes('should-pressure')
      )
    );
    assert.ok(hasSolutionAntiTriggers, 'Mina should have anti-triggers for solution-pressure scenarios');
  });

  test('Satou thought nodes have anti-triggers for sweet-acceptance scenarios', () => {
    const satouNodes = getAgentThoughtNodes('satou');
    const hasAcceptanceAntiTriggers = satouNodes.some(node =>
      node.antiTriggers && (
        node.antiTriggers.includes('sweet-acceptance-only') ||
        node.antiTriggers.includes('bypass') ||
        node.antiTriggers.includes('gentle-avoidance')
      )
    );
    assert.ok(hasAcceptanceAntiTriggers, 'Satou should have anti-triggers for sweet-acceptance scenarios');
  });

  test('thought particles are seeds, not complete sentences', () => {
    const allNodes = getThoughtReservoir('joe');
    for (const node of allNodes) {
      // Seeds should be relatively short (not full paragraphs)
      assert.ok(node.textSeed.length < 100, `textSeed should be concise: ${node.id}`);

      // Should not contain typical complete sentence patterns
      const hasBadPatterns = /です$|ます$|でしょう$|ください$|よ$/.test(node.textSeed);
      assert.ok(!hasBadPatterns, `textSeed should not be a complete Japanese sentence: ${node.id}`);
    }
  });

  test('each agent has distinct axis focus', () => {
    const joeNodes = getAgentThoughtNodes('joe');
    const minaNodes = getAgentThoughtNodes('mina');
    const kenNodes = getAgentThoughtNodes('ken');
    const rayNodes = getAgentThoughtNodes('ray');
    const satouNodes = getAgentThoughtNodes('satou');

    // Joe: illumination focus
    const joeIllumination = joeNodes.filter(n => n.axis.includes('illumination')).length;
    assert.ok(joeIllumination > 0, 'Joe should have illumination axis');

    // Mina: holding focus
    const minaHolding = minaNodes.filter(n => n.axis.includes('holding')).length;
    assert.ok(minaHolding > 0, 'Mina should have holding axis');

    // Ken: structure focus
    const kenStructure = kenNodes.filter(n => n.axis.includes('structure')).length;
    assert.ok(kenStructure > 0, 'Ken should have structure axis');

    // Ray: presence focus
    const rayPresence = rayNodes.filter(n => n.axis.includes('presence')).length;
    assert.ok(rayPresence > 0, 'Ray should have presence axis');

    // Satou: structure/holding balance
    const satouStructure = satouNodes.filter(n => n.axis.includes('structure')).length;
    const satouHolding = satouNodes.filter(n => n.axis.includes('holding')).length;
    assert.ok(satouStructure > 0 || satouHolding > 0, 'Satou should have structure or holding axis');
  });
});
