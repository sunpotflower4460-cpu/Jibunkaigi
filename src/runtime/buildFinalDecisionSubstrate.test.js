/**
 * buildFinalDecisionSubstrate.test.js
 * Tests for Final Decision Substrate builder
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFinalDecisionSubstrate, formatFinalDecisionSubstrateForDebug } from './buildFinalDecisionSubstrate.js';

describe('buildFinalDecisionSubstrate', () => {
  it('should return default substrate when input is null', () => {
    const result = buildFinalDecisionSubstrate(null);

    assert.ok(result);
    assert.strictEqual(result.identityAnchor.agentId, 'joe');
    assert.strictEqual(result.identityAnchor.mode, 'medium');
    assert.ok(Array.isArray(result.foreground.thoughtSeeds));
    assert.ok(Array.isArray(result.foreground.feelingSeeds));
    assert.ok(Array.isArray(result.foreground.moveSeeds));
    assert.ok(Array.isArray(result.foreground.tensionSeeds));
    assert.strictEqual(result.boundary.doNotLeakInternalLabels, true);
  });

  it('should extract thought seeds from primary cluster', () => {
    const input = {
      agentId: 'joe',
      selectedMixedClusters: {
        selected: [
          { clusterId: 'c1', role: 'primary' },
        ],
      },
      boundMixedNodes: {
        clusters: [
          {
            clusterId: 'c1',
            thoughtIds: ['t1', 't2', 't3'],
            feelingIds: [],
            moveIds: [],
          },
        ],
      },
      activatedThoughts: {
        items: [
          { nodeId: 't1', textSeed: 'thought seed 1' },
          { nodeId: 't2', textSeed: 'thought seed 2' },
          { nodeId: 't3', textSeed: 'thought seed 3' },
        ],
      },
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.strictEqual(result.foreground.thoughtSeeds.length, 2);
    assert.strictEqual(result.foreground.thoughtSeeds[0], 'thought seed 1');
    assert.strictEqual(result.foreground.thoughtSeeds[1], 'thought seed 2');
  });

  it('should extract thought seeds from both primary and secondary clusters', () => {
    const input = {
      agentId: 'mina',
      selectedMixedClusters: {
        selected: [
          { clusterId: 'c1', role: 'primary' },
          { clusterId: 'c2', role: 'secondary' },
        ],
      },
      boundMixedNodes: {
        clusters: [
          {
            clusterId: 'c1',
            thoughtIds: ['t1', 't2'],
            feelingIds: [],
            moveIds: [],
          },
          {
            clusterId: 'c2',
            thoughtIds: ['t3', 't4'],
            feelingIds: [],
            moveIds: [],
          },
        ],
      },
      activatedThoughts: {
        items: [
          { nodeId: 't1', textSeed: 'primary thought 1' },
          { nodeId: 't2', textSeed: 'primary thought 2' },
          { nodeId: 't3', textSeed: 'secondary thought 1' },
          { nodeId: 't4', textSeed: 'secondary thought 2' },
        ],
      },
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.strictEqual(result.foreground.thoughtSeeds.length, 3);
    assert.strictEqual(result.foreground.thoughtSeeds[0], 'primary thought 1');
    assert.strictEqual(result.foreground.thoughtSeeds[1], 'primary thought 2');
    assert.strictEqual(result.foreground.thoughtSeeds[2], 'secondary thought 1');
  });

  it('should extract feeling seeds from primary cluster', () => {
    const input = {
      agentId: 'ken',
      selectedMixedClusters: {
        selected: [
          { clusterId: 'c1', role: 'primary' },
        ],
      },
      boundMixedNodes: {
        clusters: [
          {
            clusterId: 'c1',
            thoughtIds: ['t1'],
            feelingIds: ['f1', 'f2'],
            moveIds: [],
          },
        ],
      },
      activatedThoughts: {
        items: [
          { nodeId: 't1', textSeed: 'thought' },
        ],
      },
      activatedFeelings: {
        items: [
          { nodeId: 'f1', textSeed: 'feeling seed 1' },
          { nodeId: 'f2', textSeed: 'feeling seed 2' },
        ],
      },
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.strictEqual(result.foreground.feelingSeeds.length, 1);
    assert.strictEqual(result.foreground.feelingSeeds[0], 'feeling seed 1');
  });

  it('should extract move seeds from primary cluster', () => {
    const input = {
      agentId: 'ray',
      selectedMixedClusters: {
        selected: [
          { clusterId: 'c1', role: 'primary' },
        ],
      },
      boundMixedNodes: {
        clusters: [
          {
            clusterId: 'c1',
            thoughtIds: ['t1'],
            feelingIds: [],
            moveIds: ['m1', 'm2'],
          },
        ],
      },
      activatedThoughts: {
        items: [
          { nodeId: 't1', textSeed: 'thought' },
        ],
      },
      activatedMoves: {
        items: [
          { nodeId: 'm1', textSeed: 'move seed 1' },
          { nodeId: 'm2', textSeed: 'move seed 2' },
        ],
      },
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.strictEqual(result.foreground.moveSeeds.length, 1);
    assert.strictEqual(result.foreground.moveSeeds[0], 'move seed 1');
  });

  it('should extract tension seeds when tension strength is high', () => {
    const input = {
      agentId: 'satou',
      beliefTension: {
        totalTensionStrength: 0.6,
        dominantTensionAxis: 'structure-vs-holding',
        activeTensions: [
          { axis1: 'structure', axis2: 'holding', strength: 0.6 },
        ],
      },
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.strictEqual(result.foreground.tensionSeeds.length, 1);
    assert.ok(result.foreground.tensionSeeds[0].includes('structure'));
  });

  it('should not extract tension seeds when tension strength is low', () => {
    const input = {
      agentId: 'joe',
      beliefTension: {
        totalTensionStrength: 0.2,
        dominantTensionAxis: 'structure-vs-holding',
      },
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.strictEqual(result.foreground.tensionSeeds.length, 0);
  });

  it('should build resonance from othersField', () => {
    const input = {
      agentId: 'mina',
      othersField: [
        {
          agentId: 'joe',
          forceTags: ['touch', 'hold'],
          toneTags: ['soft', 'hesitant'],
        },
        {
          agentId: 'ken',
          forceTags: ['clarify', 'ground'],
          toneTags: ['sharp'],
        },
      ],
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.ok(result.resonance.dominantAxes.length > 0);
    assert.ok(result.resonance.othersGist.length > 0);
  });

  it('should build restraint from consciousIntent and lengthPlan', () => {
    const input = {
      agentId: 'ken',
      consciousIntent: {
        holdBack: ['no-over-expansion', 'no-early-summary'],
      },
      lengthPlan: {
        expansionBudget: 0.3,
        compressionPressure: 0.7,
      },
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.ok(result.restraint.holdBack.length > 0);
    assert.strictEqual(result.restraint.closurePressure, 'high');
    assert.strictEqual(result.restraint.expansionBudget, 0.3);
  });

  it('should set identity anchor with agentId and mode', () => {
    const input = {
      agentId: 'ray',
      lengthPreference: 'long',
    };

    const result = buildFinalDecisionSubstrate(input);

    assert.strictEqual(result.identityAnchor.agentId, 'ray');
    assert.strictEqual(result.identityAnchor.mode, 'long');
  });

  it('should combine all components into complete substrate', () => {
    const input = {
      agentId: 'joe',
      lengthPreference: 'medium',
      selectedMixedClusters: {
        selected: [
          { clusterId: 'c1', role: 'primary' },
        ],
      },
      boundMixedNodes: {
        clusters: [
          {
            clusterId: 'c1',
            thoughtIds: ['t1', 't2'],
            feelingIds: ['f1'],
            moveIds: ['m1'],
          },
        ],
      },
      activatedThoughts: {
        items: [
          { nodeId: 't1', textSeed: 'thought 1' },
          { nodeId: 't2', textSeed: 'thought 2' },
        ],
      },
      activatedFeelings: {
        items: [
          { nodeId: 'f1', textSeed: 'feeling 1' },
        ],
      },
      activatedMoves: {
        items: [
          { nodeId: 'm1', textSeed: 'move 1' },
        ],
      },
      consciousIntent: {
        holdBack: ['no-fix-yet'],
      },
      lengthPlan: {
        expansionBudget: 0.45,
        compressionPressure: 0.50,
      },
      beliefTension: {
        totalTensionStrength: 0.5,
        dominantTensionAxis: 'reach-vs-freeze',
      },
      othersField: [],
    };

    const result = buildFinalDecisionSubstrate(input);

    // Verify all components are present
    assert.strictEqual(result.identityAnchor.agentId, 'joe');
    assert.strictEqual(result.identityAnchor.mode, 'medium');
    assert.strictEqual(result.foreground.thoughtSeeds.length, 2);
    assert.strictEqual(result.foreground.feelingSeeds.length, 1);
    assert.strictEqual(result.foreground.moveSeeds.length, 1);
    assert.strictEqual(result.foreground.tensionSeeds.length, 1);
    assert.ok(result.restraint.holdBack.includes('no-fix-yet'));
    assert.strictEqual(result.restraint.closurePressure, 'medium');
  });
});

describe('formatFinalDecisionSubstrateForDebug', () => {
  it('should format substrate for debug display', () => {
    const substrate = {
      identityAnchor: {
        agentId: 'joe',
        mode: 'medium',
      },
      foreground: {
        thoughtSeeds: ['t1', 't2'],
        feelingSeeds: ['f1'],
        moveSeeds: ['m1'],
        tensionSeeds: [],
      },
      resonance: {
        othersGist: [],
        dominantAxes: ['touch', 'hold'],
      },
      restraint: {
        holdBack: ['no-fix-yet'],
        closurePressure: 'medium',
        expansionBudget: 0.45,
      },
    };

    const result = formatFinalDecisionSubstrateForDebug(substrate);

    assert.ok(result.includes('joe'));
    assert.ok(result.includes('medium'));
    assert.ok(result.includes('t=2'));
    assert.ok(result.includes('f=1'));
    assert.ok(result.includes('m=1'));
  });

  it('should handle null substrate', () => {
    const result = formatFinalDecisionSubstrateForDebug(null);
    assert.strictEqual(result, 'no substrate');
  });
});
