/**
 * buildConsciousIntent.test.js
 * Tests for Phase 7: Build conscious intent minimal implementation
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildConsciousIntent, formatConsciousIntentForDebug } from './buildConsciousIntent.js';

test('buildConsciousIntent - null safety: returns default when null input', () => {
  const result = buildConsciousIntent(null);

  assert.ok(result);
  assert.ok(Array.isArray(result.userSense));
  assert.ok(Array.isArray(result.selfFeeling));
  assert.ok(Array.isArray(result.selectedClusterIds));
  assert.strictEqual(result.speakIntent, 'return-to-ground');
  assert.ok(Array.isArray(result.holdBack));
});

test('buildConsciousIntent - null safety: returns default when empty input', () => {
  const result = buildConsciousIntent({});

  assert.ok(result);
  assert.ok(Array.isArray(result.userSense));
  assert.ok(Array.isArray(result.selfFeeling));
  assert.ok(Array.isArray(result.selectedClusterIds));
  assert.strictEqual(typeof result.speakIntent, 'string');
  assert.ok(Array.isArray(result.holdBack));
});

test('buildConsciousIntent - selectedClusterIds: extracts from selectedThoughts', () => {
  const input = {
    agentId: 'joe',
    selectedThoughts: {
      selected: [
        { clusterId: 'cluster_a', score: 0.8, role: 'primary', reasons: [] },
        { clusterId: 'cluster_b', score: 0.6, role: 'secondary', reasons: [] },
      ],
      selectionMeta: {
        totalClusters: 3,
        selectedCount: 2,
        dominantSelectedAxis: [],
      },
    },
  };

  const result = buildConsciousIntent(input);

  assert.strictEqual(result.selectedClusterIds.length, 2);
  assert.ok(result.selectedClusterIds.includes('cluster_a'));
  assert.ok(result.selectedClusterIds.includes('cluster_b'));
});

test('buildConsciousIntent - userSense: builds from attentionTargets', () => {
  const input = {
    agentId: 'joe',
    emergingField: {
      attentionTargets: ['比較', 'something'],
      resonanceAxes: [],
      bodySignals: {},
      atmosphere: [],
    },
    selectedThoughts: null,
  };

  const result = buildConsciousIntent(input);

  assert.ok(Array.isArray(result.userSense));
  assert.ok(result.userSense.length > 0);
  // Should detect comparison-pain from '比較'
  assert.ok(result.userSense.includes('comparison-pain'));
});

test('buildConsciousIntent - selfFeeling: builds from bodySignals', () => {
  const input = {
    agentId: 'joe',
    emergingField: {
      attentionTargets: [],
      resonanceAxes: [],
      bodySignals: {
        tension: 0.7,
        softness: 0.3,
        hesitation: 0.4,
        urgency: 0.2,
        warmth: 0.6,
        contraction: 0.3,
      },
      atmosphere: [],
    },
    selectedThoughts: {
      selected: [],
      selectionMeta: {
        totalClusters: 0,
        selectedCount: 0,
        dominantSelectedAxis: [],
      },
    },
  };

  const result = buildConsciousIntent(input);

  assert.ok(Array.isArray(result.selfFeeling));
  assert.ok(result.selfFeeling.length > 0);
  // High tension, low urgency → quiet-friction
  assert.ok(result.selfFeeling.includes('quiet-friction'));
});

test('buildConsciousIntent - speakIntent: from dominantSelectedAxis', () => {
  const input = {
    agentId: 'joe',
    selectedThoughts: {
      selected: [
        {
          clusterId: 'cluster_structure',
          score: 0.8,
          role: 'primary',
          reasons: [],
        },
      ],
      selectionMeta: {
        totalClusters: 1,
        selectedCount: 1,
        dominantSelectedAxis: ['structure'],
      },
    },
    emergingField: {
      attentionTargets: [],
      resonanceAxes: [],
      bodySignals: {},
      atmosphere: [],
    },
  };

  const result = buildConsciousIntent(input);

  assert.strictEqual(typeof result.speakIntent, 'string');
  // structure axis → clarify-the-knot
  assert.strictEqual(result.speakIntent, 'clarify-the-knot');
});

test('buildConsciousIntent - speakIntent: from holding/presence axis', () => {
  const input = {
    agentId: 'joe',
    selectedThoughts: {
      selected: [
        {
          clusterId: 'cluster_holding',
          score: 0.8,
          role: 'primary',
          reasons: [],
        },
      ],
      selectionMeta: {
        totalClusters: 1,
        selectedCount: 1,
        dominantSelectedAxis: ['holding'],
      },
    },
    emergingField: {
      attentionTargets: [],
      resonanceAxes: [],
      bodySignals: {},
      atmosphere: [],
    },
  };

  const result = buildConsciousIntent(input);

  assert.strictEqual(result.speakIntent, 'make-room-without-closing');
});

test('buildConsciousIntent - holdBack: from oneThreadBias', () => {
  const input = {
    agentId: 'joe',
    preconditionBias: {
      focus: {
        oneThreadBias: 0.7,
        antiOverExpansion: 0.3,
      },
    },
    selectedThoughts: null,
  };

  const result = buildConsciousIntent(input);

  assert.ok(Array.isArray(result.holdBack));
  assert.ok(result.holdBack.length > 0);
  // High oneThreadBias → no-over-expansion
  assert.ok(result.holdBack.includes('no-over-expansion'));
});

test('buildConsciousIntent - holdBack: from antiOverExpansion', () => {
  const input = {
    agentId: 'joe',
    preconditionBias: {
      focus: {
        oneThreadBias: 0.2,
        antiOverExpansion: 0.8,
      },
    },
    selectedThoughts: null,
  };

  const result = buildConsciousIntent(input);

  assert.ok(result.holdBack.includes('no-over-expansion'));
});

test('buildConsciousIntent - holdBack: from beliefTension', () => {
  const input = {
    agentId: 'joe',
    beliefTension: {
      dominantTensionAxis: 'structure',
      totalTensionStrength: 0.6,
    },
    preconditionBias: null,
    selectedThoughts: null,
  };

  const result = buildConsciousIntent(input);

  assert.ok(result.holdBack.length > 0);
  // High tension → no-early-summary, do-not-close
  assert.ok(result.holdBack.includes('no-early-summary'));
  assert.ok(result.holdBack.includes('do-not-close'));
});

test('buildConsciousIntent - holdBack: from othersField', () => {
  const input = {
    agentId: 'joe',
    othersField: [
      {
        agentId: 'mina',
        gist: 'something',
        toneTags: [],
        forceTags: ['hold'],
      },
    ],
    preconditionBias: null,
    selectedThoughts: null,
  };

  const result = buildConsciousIntent(input);

  assert.ok(result.holdBack.length > 0);
  // Others present → no-explicit-agent-reference
  assert.ok(result.holdBack.includes('no-explicit-agent-reference'));
});

test('buildConsciousIntent - integration: full input', () => {
  const input = {
    agentId: 'joe',
    selectedThoughts: {
      selected: [
        {
          clusterId: 'cluster_primary',
          score: 0.8,
          role: 'primary',
          reasons: ['high-cluster-score'],
        },
      ],
      selectionMeta: {
        totalClusters: 2,
        selectedCount: 1,
        dominantSelectedAxis: ['illumination'],
      },
    },
    boundThoughts: {
      clusters: [
        {
          id: 'cluster_primary',
          thoughtIds: ['thought_1'],
          relationIds: [],
          clusterType: 'single',
          score: 0.8,
          dominantAxis: ['illumination'],
          relationTypes: [],
        },
      ],
    },
    emergingField: {
      attentionTargets: ['question', 'concern'],
      resonanceAxes: ['illumination'],
      bodySignals: {
        tension: 0.4,
        softness: 0.6,
        hesitation: 0.3,
        urgency: 0.3,
        warmth: 0.7,
        contraction: 0.2,
      },
      atmosphere: ['receiving', 'touched'],
    },
    preconditionBias: {
      focus: {
        oneThreadBias: 0.5,
        antiOverExpansion: 0.4,
      },
      pacing: {
        slowDown: 0.3,
        returnBias: 0.4,
      },
    },
    beliefTension: {
      dominantTensionAxis: 'illumination',
      totalTensionStrength: 0.3,
    },
    othersField: [],
  };

  const result = buildConsciousIntent(input);

  assert.ok(result.userSense.length > 0);
  assert.ok(result.selfFeeling.length > 0);
  assert.strictEqual(result.selectedClusterIds.length, 1);
  assert.strictEqual(result.selectedClusterIds[0], 'cluster_primary');
  assert.strictEqual(typeof result.speakIntent, 'string');
  assert.ok(result.holdBack.length > 0);
});

test('formatConsciousIntentForDebug - returns formatted string', () => {
  const consciousIntent = {
    userSense: ['comparison-pain', 'mixed-questions'],
    selfFeeling: ['quiet-friction', 'pulled-to-touch'],
    selectedClusterIds: ['cluster_a', 'cluster_b'],
    speakIntent: 'clarify-the-knot',
    holdBack: ['no-early-summary', 'no-fix-yet'],
  };

  const formatted = formatConsciousIntentForDebug(consciousIntent);

  assert.ok(typeof formatted === 'string');
  assert.ok(formatted.includes('comparison-pain'));
  assert.ok(formatted.includes('quiet-friction'));
  assert.ok(formatted.includes('clarify-the-knot'));
  assert.ok(formatted.includes('no-early-summary'));
  assert.ok(formatted.includes('clusters: 2'));
});

test('formatConsciousIntentForDebug - handles null', () => {
  const formatted = formatConsciousIntentForDebug(null);

  assert.strictEqual(formatted, 'no conscious intent');
});
