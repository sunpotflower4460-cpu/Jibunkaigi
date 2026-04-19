/**
 * buildSurfacePlan.test.js
 * Tests for buildSurfacePlan - Surface v0.2 implementation
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildSurfacePlan, formatSurfacePlanForDebug } from './buildSurfacePlan.js';

test('buildSurfacePlan: returns safe default when input is null', () => {
  const result = buildSurfacePlan(null);

  assert.ok(result);
  assert.ok(Array.isArray(result.focalClusterIds));
  assert.ok(Array.isArray(result.focalAxes));
  assert.ok(Array.isArray(result.emotionalColor));
  assert.ok(Array.isArray(result.motionBias));
  assert.ok(Array.isArray(result.holdBack));
  assert.strictEqual(typeof result.lineCountHint, 'number');
  assert.strictEqual(typeof result.expansionBudget, 'number');
  assert.strictEqual(typeof result.compressionPressure, 'number');
  assert.ok(result.othersPresence);
  assert.strictEqual(typeof result.othersPresence.hasOthers, 'boolean');
});

test('buildSurfacePlan: returns safe default when input is empty object', () => {
  const result = buildSurfacePlan({});

  assert.ok(result);
  assert.strictEqual(result.focalClusterIds.length, 0);
  assert.strictEqual(result.focalAxes.length, 0);
  assert.strictEqual(result.lineCountHint, 4);
  assert.strictEqual(result.expansionBudget, 0.45);
  assert.strictEqual(result.compressionPressure, 0.50);
  assert.strictEqual(result.othersPresence.hasOthers, false);
});

test('buildSurfacePlan: extracts focalClusterIds from selectedMixedClusters (priority)', () => {
  const input = {
    selectedMixedClusters: {
      selected: [
        { role: 'primary', clusterId: 'mixed_cluster_01' },
        { role: 'secondary', clusterId: 'mixed_cluster_02' },
      ],
    },
    selectedThoughts: {
      selected: [
        { role: 'primary', clusterId: 'thought_cluster_01' },
      ],
    },
  };

  const result = buildSurfacePlan(input);

  assert.ok(result.focalClusterIds.includes('mixed_cluster_01'));
  assert.ok(result.focalClusterIds.includes('mixed_cluster_02'));
  // Should not include thought clusters when mixed clusters exist
  assert.ok(!result.focalClusterIds.includes('thought_cluster_01'));
});

test('buildSurfacePlan: falls back to selectedThoughts when no mixed clusters', () => {
  const input = {
    selectedThoughts: {
      selected: [
        { role: 'primary', clusterId: 'thought_cluster_01' },
      ],
    },
  };

  const result = buildSurfacePlan(input);

  assert.ok(result.focalClusterIds.includes('thought_cluster_01'));
  assert.strictEqual(result.focalClusterIds.length, 1);
});

test('buildSurfacePlan: extracts emotionalColor from feeling components', () => {
  const input = {
    selectedMixedClusters: {
      selected: [
        { role: 'primary', clusterId: 'mixed_cluster_01' },
      ],
    },
    boundMixedNodes: {
      clusters: [
        {
          clusterId: 'mixed_cluster_01',
          feelingIds: ['feeling_01'],
          dominantAxis: ['holding'],
        },
      ],
    },
    activatedFeelings: {
      items: [
        {
          nodeId: 'feeling_01',
          textSeed: '温かく受け止める',
          score: 0.7,
        },
      ],
    },
  };

  const result = buildSurfacePlan(input);

  assert.ok(result.emotionalColor.includes('warm'));
});

test('buildSurfacePlan: extracts motionBias from move components', () => {
  const input = {
    selectedMixedClusters: {
      selected: [
        { role: 'primary', clusterId: 'mixed_cluster_01' },
      ],
    },
    boundMixedNodes: {
      clusters: [
        {
          clusterId: 'mixed_cluster_01',
          moveIds: ['move_01'],
          dominantAxis: ['presence'],
        },
      ],
    },
    activatedMoves: {
      items: [
        {
          nodeId: 'move_01',
          textSeed: '触れて確かめる',
          score: 0.6,
        },
      ],
    },
  };

  const result = buildSurfacePlan(input);

  assert.ok(result.motionBias.includes('touch'));
});

test('buildSurfacePlan: reflects holdBack from consciousIntent', () => {
  const input = {
    consciousIntent: {
      speakIntent: 'touch-the-living-point',
      holdBack: ['no-over-expansion', 'do-not-close'],
    },
  };

  const result = buildSurfacePlan(input);

  assert.ok(result.holdBack.includes('no-over-expansion'));
  assert.ok(result.holdBack.includes('do-not-close'));
});

test('buildSurfacePlan: reflects lengthPlan lineCountHint', () => {
  const input = {
    lengthPlan: {
      target: 'short',
      lineCountHint: 2,
      expansionBudget: 0.25,
      compressionPressure: 0.75,
    },
  };

  const result = buildSurfacePlan(input);

  assert.strictEqual(result.lineCountHint, 2);
  assert.strictEqual(result.expansionBudget, 0.25);
  assert.strictEqual(result.compressionPressure, 0.75);
});

test('buildSurfacePlan: adjusts expansion/compression based on holdBack', () => {
  const input = {
    lengthPlan: {
      target: 'medium',
      lineCountHint: 4,
      expansionBudget: 0.45,
      compressionPressure: 0.50,
    },
    consciousIntent: {
      speakIntent: 'clarify-the-knot',
      holdBack: ['no-over-expansion', 'do-not-close'],
    },
  };

  const result = buildSurfacePlan(input);

  // expansionBudget should be reduced (0.45 * 0.75 = 0.3375)
  assert.ok(result.expansionBudget < 0.45);
  // compressionPressure should be reduced (0.50 * 0.85 = 0.425)
  assert.ok(result.compressionPressure < 0.50);
});

test('buildSurfacePlan: builds othersPresence from others_field', () => {
  const input = {
    othersField: [
      {
        agentId: 'joe',
        gist: '前へ進む力に触れた',
        toneTags: ['soft'],
        forceTags: ['hold', 'stay'],
      },
      {
        agentId: 'mina',
        gist: '感情を受け止めた',
        toneTags: ['warm'],
        forceTags: ['hold', 'clarify'],
      },
    ],
  };

  const result = buildSurfacePlan(input);

  assert.strictEqual(result.othersPresence.hasOthers, true);
  assert.ok(result.othersPresence.dominantForces.includes('hold'));
});

test('buildSurfacePlan: mirror mode always has othersPresence', () => {
  const input = {
    isMirror: true,
    othersField: [],
  };

  const result = buildSurfacePlan(input);

  assert.strictEqual(result.othersPresence.hasOthers, true);
  assert.ok(result.othersPresence.dominantForces.length > 0);
});

test('buildSurfacePlan: prevents thought/feeling/move label leakage', () => {
  const input = {
    selectedMixedClusters: {
      selected: [
        { role: 'primary', clusterId: 'mixed_cluster_01' },
      ],
    },
    boundMixedNodes: {
      clusters: [
        {
          clusterId: 'mixed_cluster_01',
          feelingIds: ['feeling_01'],
          moveIds: ['move_01'],
          dominantAxis: ['holding'],
        },
      ],
    },
    activatedFeelings: {
      items: [
        {
          nodeId: 'feeling_01',
          textSeed: '温かく受け止める',
          score: 0.7,
        },
      ],
    },
    activatedMoves: {
      items: [
        {
          nodeId: 'move_01',
          textSeed: '触れて確かめる',
          score: 0.6,
        },
      ],
    },
  };

  const result = buildSurfacePlan(input);

  // emotionalColor should NOT contain raw textSeed
  result.emotionalColor.forEach(color => {
    assert.ok(!color.includes('温かく'));
    assert.ok(!color.includes('受け止める'));
  });

  // motionBias should NOT contain raw textSeed
  result.motionBias.forEach(motion => {
    assert.ok(!motion.includes('触れて'));
    assert.ok(!motion.includes('確かめる'));
  });
});

test('formatSurfacePlanForDebug: returns safe string when input is null', () => {
  const result = formatSurfacePlanForDebug(null);
  assert.strictEqual(result, 'no surface plan');
});

test('formatSurfacePlanForDebug: formats surfacePlan correctly', () => {
  const surfacePlan = {
    focalClusterIds: ['mixed_cluster_01'],
    focalAxes: ['holding', 'presence'],
    emotionalColor: ['warm', 'quiet'],
    motionBias: ['touch', 'stay'],
    speakIntent: 'touch-the-living-point',
    holdBack: ['no-over-expansion'],
    lineCountHint: 4,
    expansionBudget: 0.45,
    compressionPressure: 0.50,
    othersPresence: {
      hasOthers: true,
      dominantForces: ['hold', 'clarify'],
    },
  };

  const result = formatSurfacePlanForDebug(surfacePlan);

  assert.ok(result.includes('mixed_cluster_01'));
  assert.ok(result.includes('warm'));
  assert.ok(result.includes('touch'));
  assert.ok(result.includes('touch-the-living-point'));
  assert.ok(result.includes('lines=4'));
  assert.ok(result.includes('others=yes'));
});
