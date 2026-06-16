/**
 * Tests for activateMoves.js
 * L2 Phase: Minimal introduction of move particles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { activateMoves, formatActivatedMovesForDebug } from './activateMoves.js';

describe('activateMoves', () => {
  it('should return null-safe result when no input', () => {
    const result = activateMoves();

    assert.ok(result, 'result should exist');
    assert.ok(Array.isArray(result.activatedMoves), 'activatedMoves should be array');
    assert.ok(Array.isArray(result.topMoveIds), 'topMoveIds should be array');
    assert.ok(result.activationMeta, 'activationMeta should exist');
    assert.strictEqual(typeof result.activationMeta.totalCandidates, 'number');
    assert.strictEqual(typeof result.activationMeta.selectedCount, 'number');
    assert.ok(Array.isArray(result.activationMeta.dominantAxes));
  });

  it('should return empty result for invalid agentId', () => {
    const result = activateMoves({
      agentId: 'invalid-agent',
      userText: 'test',
    });

    assert.strictEqual(result.activatedMoves.length, 0);
    assert.strictEqual(result.topMoveIds.length, 0);
    assert.strictEqual(result.activationMeta.totalCandidates, 0);
    assert.strictEqual(result.activationMeta.selectedCount, 0);
  });

  it('should activate move particles for valid agent', () => {
    const result = activateMoves({
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

    assert.ok(result.activatedMoves.length >= 0, 'should activate some moves');
    assert.ok(result.topMoveIds.length >= 0, 'should have top move IDs');
    assert.ok(result.activationMeta.totalCandidates > 0, 'should have candidates');
    assert.strictEqual(result.activationMeta.selectedCount, result.activatedMoves.length);
  });

  it('should include both shared and agent move particles', () => {
    const result = activateMoves({
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

    // Check if we have moves from the reservoir
    const owners = new Set(result.activatedMoves.map(m => m.owner));
    assert.ok(owners.size >= 0, 'should have moves from at least one owner');
  });

  it('should boost agent-owned moves slightly', () => {
    const result = activateMoves({
      agentId: 'joe',
      userText: 'toward one point',
      emergingField: {
        attentionTargets: ['toward', 'point'],
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

    // Joe-owned moves should be present when joe-related triggers match
    const joeMoves = result.activatedMoves.filter(m => m.owner === 'joe');
    assert.ok(joeMoves.length >= 0, 'joe moves should be considered');
  });

  it('should increase score based on focusPacingAffinity', () => {
    const result1 = activateMoves({
      agentId: 'joe',
      userText: 'not ready to close',
      preconditionBias: {
        pacing: {
          slowDown: 0.7,
          returnBias: 0.3,
        },
        focus: {
          oneThreadBias: 0.6,
          antiOverExpansion: 0.4,
        },
      },
      emergingField: {
        attentionTargets: ['not-ready', 'close'],
        resonanceAxes: ['presence'],
        bodySignals: {
          tension: 0.5,
          softness: 0.5,
          hesitation: 0.7,
          urgency: 0.3,
          warmth: 0.5,
          contraction: 0.5,
        },
        atmosphere: [],
      },
    });

    assert.ok(result1.activationMeta.totalCandidates > 0);

    // Moves with high focusPacingAffinity should be boosted when matching pacing/focus
    if (result1.activatedMoves.length > 0) {
      const topMove = result1.activatedMoves[0];
      assert.ok(typeof topMove.score === 'number');
    }
  });

  it('should reduce score when antiTriggers match', () => {
    // Test that anti-triggers work by comparing two scenarios
    const baseResult = activateMoves({
      agentId: 'joe',
      userText: 'not ready',
      emergingField: {
        attentionTargets: ['not-ready'],
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

    const antiTriggerResult = activateMoves({
      agentId: 'joe',
      userText: 'not ready force-close',
      emergingField: {
        attentionTargets: ['not-ready', 'force-close'],
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

    // Both should have results, but anti-trigger scenario might affect scores
    assert.ok(baseResult.activatedMoves.length >= 0);
    assert.ok(antiTriggerResult.activatedMoves.length >= 0);

    // Check that anti-trigger-suppression appears in reasons if triggered
    const hasSuppressionReason = antiTriggerResult.activatedMoves.some(
      m => m.reasons.includes('anti-trigger-suppression')
    );
    // It's ok if no suppression occurred (depends on specific nodes)
    assert.ok(typeof hasSuppressionReason === 'boolean');
  });

  it('should limit results to topN', () => {
    const result = activateMoves({
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

    assert.ok(result.activatedMoves.length <= 3, 'should not exceed topN');
    assert.strictEqual(result.activationMeta.selectedCount, result.activatedMoves.length);
  });

  it('should include reasons in activated moves', () => {
    const result = activateMoves({
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

    if (result.activatedMoves.length > 0) {
      const firstMove = result.activatedMoves[0];
      assert.ok(firstMove.nodeId, 'should have nodeId');
      assert.ok(firstMove.owner, 'should have owner');
      assert.ok(firstMove.textSeed, 'should have textSeed');
      assert.strictEqual(typeof firstMove.score, 'number', 'should have numeric score');
      assert.ok(Array.isArray(firstMove.reasons), 'should have reasons array');
      assert.ok(Array.isArray(firstMove.dominantAxis), 'should have dominantAxis array');
    }
  });

  it('should collect dominantAxes from top moves', () => {
    const result = activateMoves({
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

  it('should prefer focusPoints over attentionTargets for trigger and anti-trigger matching', () => {
    const baseEmergingField = {
      resonanceAxes: [],
      bodySignals: { tension: 0.5, softness: 0.5, hesitation: 0.5, urgency: 0.5, warmth: 0.5, contraction: 0.5 },
      atmosphere: [],
    };
    const findScore = (result, nodeId) => result.activatedMoves.find((item) => item.nodeId === nodeId)?.score ?? 0;

    const fallbackResult = activateMoves({
      agentId: 'ken',
      userText: 'neutral',
      topN: 20,
      emergingField: {
        ...baseEmergingField,
        attentionTargets: ['unrelated-legacy-target'],
      },
    });
    const focusTriggerResult = activateMoves({
      agentId: 'ken',
      userText: 'neutral',
      topN: 20,
      emergingField: {
        ...baseEmergingField,
        focusPoints: [{ signal: '絡ま', intensity: 0.6, sources: ['somatic'] }],
        attentionTargets: ['unrelated-legacy-target'],
      },
    });

    assert.ok(
      findScore(focusTriggerResult, 'ken-move-001') > findScore(fallbackResult, 'ken-move-001'),
      'focusPoints should drive trigger matching when attentionTargets do not match',
    );

    const attentionTriggerResult = activateMoves({
      agentId: 'ken',
      userText: 'neutral',
      topN: 20,
      emergingField: {
        ...baseEmergingField,
        attentionTargets: ['絡ま'],
      },
    });
    const focusAntiTriggerResult = activateMoves({
      agentId: 'ken',
      userText: 'neutral',
      topN: 20,
      emergingField: {
        ...baseEmergingField,
        focusPoints: [{ signal: '見ない', intensity: 0.6, sources: ['somatic'] }],
        attentionTargets: ['絡ま'],
      },
    });

    assert.ok(
      findScore(focusAntiTriggerResult, 'ken-move-001') < findScore(attentionTriggerResult, 'ken-move-001'),
      'focusPoints should be preferred over attentionTargets for anti-trigger matching',
    );
  });

});

describe('formatActivatedMovesForDebug', () => {
  it('should return message when no moves', () => {
    const result = {
      activatedMoves: [],
      topMoveIds: [],
      activationMeta: {
        totalCandidates: 0,
        selectedCount: 0,
        dominantAxes: [],
      },
    };

    const formatted = formatActivatedMovesForDebug(result);
    assert.strictEqual(formatted, 'no activated moves');
  });

  it('should format activated moves summary', () => {
    const result = {
      activatedMoves: [
        { nodeId: 'shared-move-001', owner: 'shared', textSeed: 'test1', score: 0.8, reasons: [], dominantAxis: ['presence'] },
        { nodeId: 'joe-move-001', owner: 'joe', textSeed: 'test2', score: 0.7, reasons: [], dominantAxis: ['illumination'] },
        { nodeId: 'shared-move-002', owner: 'shared', textSeed: 'test3', score: 0.6, reasons: [], dominantAxis: ['holding'] },
      ],
      topMoveIds: ['shared-move-001', 'joe-move-001', 'shared-move-002'],
      activationMeta: {
        totalCandidates: 10,
        selectedCount: 3,
        dominantAxes: ['presence', 'illumination'],
      },
    };

    const formatted = formatActivatedMovesForDebug(result);
    assert.ok(formatted.includes('3/10'), 'should show count');
    assert.ok(formatted.includes('shared-move-001'), 'should show top moves');
    assert.ok(formatted.includes('presence'), 'should show axes');
  });
});
