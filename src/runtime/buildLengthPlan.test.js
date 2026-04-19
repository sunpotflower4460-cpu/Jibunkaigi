/**
 * buildLengthPlan.test.js
 * Tests for Phase 7: Build length plan minimal implementation
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildLengthPlan, formatLengthPlanForDebug } from './buildLengthPlan.js';

test('buildLengthPlan - null safety: returns default when null input', () => {
  const result = buildLengthPlan(null);

  assert.ok(result);
  assert.strictEqual(result.target, 'medium');
  assert.strictEqual(typeof result.lineCountHint, 'number');
  assert.strictEqual(typeof result.expansionBudget, 'number');
  assert.strictEqual(typeof result.compressionPressure, 'number');
});

test('buildLengthPlan - null safety: returns default when empty input', () => {
  const result = buildLengthPlan({});

  assert.ok(result);
  assert.strictEqual(result.target, 'medium');
  assert.ok(result.lineCountHint > 0);
  assert.ok(result.expansionBudget >= 0 && result.expansionBudget <= 1);
  assert.ok(result.compressionPressure >= 0 && result.compressionPressure <= 1);
});

test('buildLengthPlan - userSelectedLength short: base parameters', () => {
  const input = {
    userSelectedLength: 'short',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: null,
  };

  const result = buildLengthPlan(input);

  assert.strictEqual(result.target, 'short');
  assert.ok(result.lineCountHint <= 3);
  assert.ok(result.expansionBudget < 0.4);
  assert.ok(result.compressionPressure > 0.6);
});

test('buildLengthPlan - userSelectedLength medium: base parameters', () => {
  const input = {
    userSelectedLength: 'medium',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: null,
  };

  const result = buildLengthPlan(input);

  assert.strictEqual(result.target, 'medium');
  assert.ok(result.lineCountHint >= 3 && result.lineCountHint <= 6);
  assert.ok(result.expansionBudget >= 0.3 && result.expansionBudget <= 0.6);
  assert.ok(result.compressionPressure >= 0.3 && result.compressionPressure <= 0.6);
});

test('buildLengthPlan - userSelectedLength long: base parameters', () => {
  const input = {
    userSelectedLength: 'long',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: null,
  };

  const result = buildLengthPlan(input);

  assert.strictEqual(result.target, 'long');
  assert.ok(result.lineCountHint >= 5);
  assert.ok(result.expansionBudget > 0.5);
  assert.ok(result.compressionPressure < 0.4);
});

test('buildLengthPlan - oneThreadBias high: reduces lineCountHint', () => {
  const baseInput = {
    userSelectedLength: 'medium',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: null,
  };

  const biasedInput = {
    userSelectedLength: 'medium',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: {
      focus: {
        oneThreadBias: 0.8,
        antiOverExpansion: 0.2,
      },
    },
  };

  const baseResult = buildLengthPlan(baseInput);
  const biasedResult = buildLengthPlan(biasedInput);

  assert.ok(biasedResult.lineCountHint < baseResult.lineCountHint);
});

test('buildLengthPlan - selectedClusterCount 2: increases lineCountHint', () => {
  const singleClusterInput = {
    userSelectedLength: 'medium',
    consciousIntent: null,
    selectedThoughts: {
      selected: [
        { clusterId: 'cluster_a', score: 0.8, role: 'primary', reasons: [] },
      ],
    },
    preconditionBias: null,
  };

  const dualClusterInput = {
    userSelectedLength: 'medium',
    consciousIntent: null,
    selectedThoughts: {
      selected: [
        { clusterId: 'cluster_a', score: 0.8, role: 'primary', reasons: [] },
        { clusterId: 'cluster_b', score: 0.6, role: 'secondary', reasons: [] },
      ],
    },
    preconditionBias: null,
  };

  const singleResult = buildLengthPlan(singleClusterInput);
  const dualResult = buildLengthPlan(dualClusterInput);

  assert.ok(dualResult.lineCountHint > singleResult.lineCountHint);
});

test('buildLengthPlan - holdBack no-over-expansion: reduces expansionBudget', () => {
  const baseInput = {
    userSelectedLength: 'medium',
    consciousIntent: {
      userSense: [],
      selfFeeling: [],
      selectedClusterIds: [],
      speakIntent: 'return-to-ground',
      holdBack: [],
    },
    selectedThoughts: null,
    preconditionBias: null,
  };

  const holdBackInput = {
    userSelectedLength: 'medium',
    consciousIntent: {
      userSense: [],
      selfFeeling: [],
      selectedClusterIds: [],
      speakIntent: 'return-to-ground',
      holdBack: ['no-over-expansion'],
    },
    selectedThoughts: null,
    preconditionBias: null,
  };

  const baseResult = buildLengthPlan(baseInput);
  const holdBackResult = buildLengthPlan(holdBackInput);

  assert.ok(holdBackResult.expansionBudget < baseResult.expansionBudget);
});

test('buildLengthPlan - holdBack do-not-close: reduces compressionPressure', () => {
  const baseInput = {
    userSelectedLength: 'medium',
    consciousIntent: {
      userSense: [],
      selfFeeling: [],
      selectedClusterIds: [],
      speakIntent: 'return-to-ground',
      holdBack: [],
    },
    selectedThoughts: null,
    preconditionBias: null,
  };

  const holdBackInput = {
    userSelectedLength: 'medium',
    consciousIntent: {
      userSense: [],
      selfFeeling: [],
      selectedClusterIds: [],
      speakIntent: 'return-to-ground',
      holdBack: ['do-not-close'],
    },
    selectedThoughts: null,
    preconditionBias: null,
  };

  const baseResult = buildLengthPlan(baseInput);
  const holdBackResult = buildLengthPlan(holdBackInput);

  assert.ok(holdBackResult.compressionPressure < baseResult.compressionPressure);
});

test('buildLengthPlan - antiOverExpansion high: reduces expansionBudget', () => {
  const baseInput = {
    userSelectedLength: 'medium',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: {
      focus: {
        oneThreadBias: 0.2,
        antiOverExpansion: 0.1,
      },
    },
  };

  const highInput = {
    userSelectedLength: 'medium',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: {
      focus: {
        oneThreadBias: 0.2,
        antiOverExpansion: 0.8,
      },
    },
  };

  const baseResult = buildLengthPlan(baseInput);
  const highResult = buildLengthPlan(highInput);

  assert.ok(highResult.expansionBudget < baseResult.expansionBudget);
});

test('buildLengthPlan - integration: full adjustment context', () => {
  const input = {
    userSelectedLength: 'medium',
    consciousIntent: {
      userSense: ['comparison-pain'],
      selfFeeling: ['quiet-friction'],
      selectedClusterIds: ['cluster_a', 'cluster_b'],
      speakIntent: 'clarify-the-knot',
      holdBack: ['no-over-expansion', 'do-not-close'],
    },
    selectedThoughts: {
      selected: [
        { clusterId: 'cluster_a', score: 0.8, role: 'primary', reasons: [] },
        { clusterId: 'cluster_b', score: 0.6, role: 'secondary', reasons: [] },
      ],
    },
    preconditionBias: {
      focus: {
        oneThreadBias: 0.3,
        antiOverExpansion: 0.6,
      },
      pacing: {
        slowDown: 0.4,
        returnBias: 0.4,
      },
    },
  };

  const result = buildLengthPlan(input);

  assert.strictEqual(result.target, 'medium');
  // Should be adjusted from base
  assert.ok(typeof result.lineCountHint === 'number');
  assert.ok(result.lineCountHint >= 1 && result.lineCountHint <= 9);
  assert.ok(result.expansionBudget >= 0 && result.expansionBudget <= 1);
  assert.ok(result.compressionPressure >= 0 && result.compressionPressure <= 1);
  // Adjustments: +1.15x from 2 clusters, -0.80x expansion from holdBack/antiOverExpansion, -0.85x compression from holdBack
});

test('buildLengthPlan - invalid userSelectedLength: defaults to medium', () => {
  const input = {
    userSelectedLength: 'invalid',
    consciousIntent: null,
    selectedThoughts: null,
    preconditionBias: null,
  };

  const result = buildLengthPlan(input);

  assert.strictEqual(result.target, 'medium');
});

test('formatLengthPlanForDebug - returns formatted string', () => {
  const lengthPlan = {
    target: 'medium',
    lineCountHint: 5,
    expansionBudget: 0.45,
    compressionPressure: 0.55,
  };

  const formatted = formatLengthPlanForDebug(lengthPlan);

  assert.ok(typeof formatted === 'string');
  assert.ok(formatted.includes('medium'));
  assert.ok(formatted.includes('lines=5'));
  assert.ok(formatted.includes('expand=0.45'));
  assert.ok(formatted.includes('compress=0.55'));
});

test('formatLengthPlanForDebug - handles null', () => {
  const formatted = formatLengthPlanForDebug(null);

  assert.strictEqual(formatted, 'no length plan');
});
