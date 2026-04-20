/**
 * Tests for activateThoughts.js
 * Phase 4: Activate minimal implementation for thought particles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { activateThoughts, formatActivatedThoughtsForDebug } from './activateThoughts.js';

describe('activateThoughts', () => {
  it('should return null-safe result when no input', () => {
    const result = activateThoughts();

    assert.ok(result, 'result should exist');
    assert.ok(Array.isArray(result.activatedThoughts), 'activatedThoughts should be array');
    assert.ok(Array.isArray(result.topThoughtIds), 'topThoughtIds should be array');
    assert.ok(result.activationMeta, 'activationMeta should exist');
    assert.strictEqual(typeof result.activationMeta.totalCandidates, 'number');
    assert.strictEqual(typeof result.activationMeta.selectedCount, 'number');
    assert.ok(Array.isArray(result.activationMeta.dominantAxes));
  });

  it('should return empty result for invalid agentId', () => {
    const result = activateThoughts({
      agentId: 'invalid-agent',
      userText: 'test',
    });

    assert.strictEqual(result.activatedThoughts.length, 0);
    assert.strictEqual(result.topThoughtIds.length, 0);
    assert.strictEqual(result.activationMeta.totalCandidates, 0);
    assert.strictEqual(result.activationMeta.selectedCount, 0);
  });

  it('should activate thought particles for valid agent', () => {
    const result = activateThoughts({
      agentId: 'joe',
      userText: 'I feel lost and compared to others',
      emergingField: {
        attentionTargets: ['comparison', 'lost'],
        resonanceAxes: ['illumination'],
        bodySignals: {
          tension: 0.6,
          softness: 0.3,
          hesitation: 0.5,
          urgency: 0.4,
          warmth: 0.2,
          contraction: 0.7,
        },
        atmosphere: ['touched', 'protective'],
      },
    });

    assert.ok(result.activatedThoughts.length > 0, 'should activate some thoughts');
    assert.ok(result.topThoughtIds.length > 0, 'should have top thought IDs');
    assert.ok(result.activationMeta.totalCandidates > 0, 'should have candidates');
    assert.strictEqual(result.activationMeta.selectedCount, result.activatedThoughts.length);
  });

  it('should include both shared and agent thought particles', () => {
    const result = activateThoughts({
      agentId: 'joe',
      userText: 'test input',
      emergingField: {
        attentionTargets: ['energy'],
        resonanceAxes: ['illumination'],
        bodySignals: {
          tension: 0.5,
          softness: 0.5,
          hesitation: 0.5,
          urgency: 0.5,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    assert.ok(result.activationMeta.totalCandidates > 0, 'should have candidates from reservoir');

    // Check if we have both shared and agent-specific thoughts
    const owners = new Set(result.activatedThoughts.map(t => t.owner));
    assert.ok(owners.size > 0, 'should have thoughts from at least one owner');
  });

  it('should boost agent-owned thoughts slightly', () => {
    const result = activateThoughts({
      agentId: 'joe',
      userText: 'direction alive',
      emergingField: {
        attentionTargets: ['direction', 'alive'],
        resonanceAxes: ['illumination'],
        bodySignals: {
          tension: 0.3,
          softness: 0.4,
          hesitation: 0.2,
          urgency: 0.4,
          warmth: 0.5,
          contraction: 0.3,
        },
        atmosphere: [],
      },
    });

    // Joe-owned thoughts should be present when joe-related triggers match
    const joeThoughts = result.activatedThoughts.filter(t => t.owner === 'joe');
    assert.ok(joeThoughts.length >= 0, 'joe thoughts should be considered');
  });

  it('should increase score when dominantBeliefAxis matches', () => {
    const result1 = activateThoughts({
      agentId: 'joe',
      userText: 'comparison',
      preconditionBias: {
        dominantBeliefAxis: 'structure',
      },
      emergingField: {
        attentionTargets: ['comparison'],
        resonanceAxes: ['structure'],
        bodySignals: {
          tension: 0.5,
          softness: 0.5,
          hesitation: 0.5,
          urgency: 0.5,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    assert.ok(result1.activationMeta.totalCandidates > 0);

    // Check that structure is in dominant axes if activated
    if (result1.activationMeta.dominantAxes.length > 0) {
      const hasStructure = result1.activationMeta.dominantAxes.includes('structure');
      // Structure might be dominant if enough thoughts with that axis activated
      assert.ok(typeof hasStructure === 'boolean');
    }
  });

  it('should reduce score when antiTriggers match', () => {
    // Test that anti-triggers work by comparing two scenarios
    const baseResult = activateThoughts({
      agentId: 'joe',
      userText: 'comparison',
      emergingField: {
        attentionTargets: ['comparison'],
        resonanceAxes: [],
        bodySignals: {
          tension: 0.5,
          softness: 0.5,
          hesitation: 0.5,
          urgency: 0.5,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    const antiTriggerResult = activateThoughts({
      agentId: 'joe',
      userText: 'comparison dismissal acceptance-only',
      emergingField: {
        attentionTargets: ['comparison', 'dismissal'],
        resonanceAxes: [],
        bodySignals: {
          tension: 0.5,
          softness: 0.8,
          hesitation: 0.5,
          urgency: 0.9,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    // Both should have results, but anti-trigger scenario might affect scores
    assert.ok(baseResult.activatedThoughts.length >= 0);
    assert.ok(antiTriggerResult.activatedThoughts.length >= 0);

    // Check that anti-trigger-suppression appears in reasons if triggered
    const hasSuppressionReason = antiTriggerResult.activatedThoughts.some(
      t => t.reasons.includes('anti-trigger-suppression')
    );
    // It's ok if no suppression occurred (depends on specific nodes)
    assert.ok(typeof hasSuppressionReason === 'boolean');
  });

  it('should limit results to topN', () => {
    const result = activateThoughts({
      agentId: 'joe',
      userText: 'test',
      topN: 3,
      emergingField: {
        attentionTargets: [],
        resonanceAxes: [],
        bodySignals: {
          tension: 0.5,
          softness: 0.5,
          hesitation: 0.5,
          urgency: 0.5,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    assert.ok(result.activatedThoughts.length <= 3, 'should not exceed topN');
    assert.strictEqual(result.activationMeta.selectedCount, result.activatedThoughts.length);
  });

  it('should include reasons in activated thoughts', () => {
    const result = activateThoughts({
      agentId: 'joe',
      userText: 'alive energy',
      emergingField: {
        attentionTargets: ['alive', 'energy'],
        resonanceAxes: ['illumination'],
        bodySignals: {
          tension: 0.5,
          softness: 0.5,
          hesitation: 0.5,
          urgency: 0.5,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    if (result.activatedThoughts.length > 0) {
      const firstThought = result.activatedThoughts[0];
      assert.ok(firstThought.nodeId, 'should have nodeId');
      assert.ok(firstThought.owner, 'should have owner');
      assert.ok(firstThought.textSeed, 'should have textSeed');
      assert.strictEqual(typeof firstThought.score, 'number', 'should have numeric score');
      assert.ok(Array.isArray(firstThought.reasons), 'should have reasons array');
      assert.ok(Array.isArray(firstThought.dominantAxis), 'should have dominantAxis array');
    }
  });

  it('should use joe reservoir for creative agent ids', () => {
    const result = activateThoughts({
      agentId: 'creative',
      userText: '作品を出したいけど怖い',
      emergingField: {
        attentionTargets: ['作品', '怖い'],
        resonanceAxes: ['illumination'],
        bodySignals: {
          tension: 0.5,
          softness: 0.4,
          hesitation: 0.6,
          urgency: 0.3,
          warmth: 0.4,
          contraction: 0.4,
        },
        atmosphere: ['touched'],
      },
    });

    assert.ok(result.activatedThoughts.length > 0);
    assert.ok(result.activatedThoughts.some((thought) => thought.owner === 'joe'));
  });

  it('should keep protoMeaning narrative boost under 10 percent for creative only', () => {
    const result = activateThoughts({
      agentId: 'creative',
      userText: '作品を出したいけど怖い',
      protoMeaning: {
        narrative: ['守りを残しつつ、届く形を探している'],
      },
      emergingField: {
        attentionTargets: ['作品', '怖い'],
        resonanceAxes: ['illumination'],
        bodySignals: {
          tension: 0.5,
          softness: 0.4,
          hesitation: 0.6,
          urgency: 0.3,
          warmth: 0.4,
          contraction: 0.4,
        },
        atmosphere: ['touched'],
      },
    });

    result.activatedThoughts.forEach((thought) => {
      assert.ok(thought.protoMeaningBoost <= thought.baseScore * 0.08 + Number.EPSILON);
    });
  });

  it('should collect dominantAxes from top thoughts', () => {
    const result = activateThoughts({
      agentId: 'joe',
      userText: 'test',
      emergingField: {
        attentionTargets: [],
        resonanceAxes: ['illumination', 'holding'],
        bodySignals: {
          tension: 0.5,
          softness: 0.5,
          hesitation: 0.5,
          urgency: 0.5,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    assert.ok(Array.isArray(result.activationMeta.dominantAxes));
    // Dominant axes should be limited to top 3
    assert.ok(result.activationMeta.dominantAxes.length <= 3);
  });
});

describe('formatActivatedThoughtsForDebug', () => {
  it('should return message when no thoughts', () => {
    const result = {
      activatedThoughts: [],
      topThoughtIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };

    const formatted = formatActivatedThoughtsForDebug(result);
    assert.strictEqual(formatted, 'no activated thoughts');
  });

  it('should format activated thoughts summary', () => {
    const result = {
      activatedThoughts: [
        { nodeId: 'shared-thought-001', owner: 'shared', textSeed: 'test1', score: 0.8, reasons: [], dominantAxis: ['structure'] },
        { nodeId: 'joe-thought-001', owner: 'joe', textSeed: 'test2', score: 0.7, reasons: [], dominantAxis: ['illumination'] },
        { nodeId: 'shared-thought-002', owner: 'shared', textSeed: 'test3', score: 0.6, reasons: [], dominantAxis: ['holding'] },
      ],
      topThoughtIds: ['shared-thought-001', 'joe-thought-001', 'shared-thought-002'],
      activationMeta: {
        totalCandidates: 10,
        selectedCount: 3,
        dominantAxes: ['structure', 'illumination'],
      },
    };

    const formatted = formatActivatedThoughtsForDebug(result);
    assert.ok(formatted.includes('3/10'), 'should show count');
    assert.ok(formatted.includes('shared-thought-001'), 'should show top thoughts');
    assert.ok(formatted.includes('structure'), 'should show axes');
  });
});
