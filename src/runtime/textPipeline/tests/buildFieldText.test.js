// src/runtime/textPipeline/tests/buildFieldText.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFieldText } from '../buildFieldText.js';

test('buildFieldText: detects external calm + internal tense mismatch', () => {
  const latentState = {
    field: {
      urgency: 0.2,
      fragility: 0.2,
      softness: 0.8,
    },
    stance: {
      receive: 0.7,
    },
    beliefCore: {
      dominantBeliefAxis: 'holding',
    },
    bodySignals: {
      external: {
        tension: 0.2,
        urgency: 0.2,
        softness: 0.8,
        hesitation: 0.3,
        warmth: 0.6,
        contraction: 0.2,
      },
      internal: {
        tension: 0.8,
        hesitation: 0.7,
        contraction: 0.7,
      },
    },
  };

  const result = buildFieldText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(result.includes('場は穏やかだが、内側に緊張が残っている'), 'should detect mismatch pattern 1');
});

test('buildFieldText: detects external tense + internal calm mismatch', () => {
  const latentState = {
    field: {
      urgency: 0.9,
      fragility: 0.8,
      softness: 0.2,
    },
    stance: {
      guard: 0.8,
    },
    beliefCore: {
      dominantBeliefAxis: 'structure',
    },
    bodySignals: {
      external: {
        tension: 0.9,
        urgency: 0.9,
        softness: 0.2,
        hesitation: 0.3,
        warmth: 0.2,
        contraction: 0.7,
      },
      internal: {
        tension: 0.2,
        hesitation: 0.2,
        contraction: 0.2,
      },
    },
  };

  const result = buildFieldText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(result.includes('場には緊張があるが、内側は比較的落ち着いている'), 'should detect mismatch pattern 2');
});

test('buildFieldText: aligned tension (no mismatch description)', () => {
  const latentState = {
    field: {
      urgency: 0.7,
      fragility: 0.6,
      softness: 0.3,
    },
    stance: {
      structure: 0.6,
    },
    beliefCore: {
      dominantBeliefAxis: 'mission',
    },
    bodySignals: {
      external: {
        tension: 0.7,
        urgency: 0.7,
        softness: 0.3,
        hesitation: 0.4,
        warmth: 0.3,
        contraction: 0.6,
      },
      internal: {
        tension: 0.6,
        hesitation: 0.5,
        contraction: 0.5,
      },
    },
  };

  const result = buildFieldText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(!result.includes('場は穏やかだが、内側に緊張が残っている'), 'should not detect mismatch pattern 1');
  assert.ok(!result.includes('場には緊張があるが、内側は比較的落ち着いている'), 'should not detect mismatch pattern 2');
});

test('buildFieldText: handles missing bodySignals gracefully', () => {
  const latentState = {
    field: {
      urgency: 0.5,
      softness: 0.6,
    },
    stance: {
      receive: 0.5,
    },
    beliefCore: {
      dominantBeliefAxis: 'presence',
    },
  };

  const result = buildFieldText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
});

test('buildFieldText: handles empty latentState', () => {
  const result = buildFieldText({});

  assert.ok(typeof result === 'string', 'should return string');
  assert.strictEqual(result, '', 'should return empty string for empty state');
});

test('buildFieldText: includes field atmosphere description', () => {
  const latentState = {
    field: {
      fragility: 0.8,
      softness: 0.7,
      urgency: 0.7,
      depth: 0.8,
    },
    stance: {},
    beliefCore: {},
    bodySignals: {
      external: {
        tension: 0.5,
        urgency: 0.5,
        softness: 0.7,
        hesitation: 0.5,
        warmth: 0.6,
        contraction: 0.4,
      },
      internal: {
        tension: 0.5,
        hesitation: 0.5,
        contraction: 0.4,
      },
    },
  };

  const result = buildFieldText(latentState);

  assert.ok(typeof result === 'string', 'should return string');
  assert.ok(result.includes('壊れやすい') || result.includes('やわらかい') || result.includes('迫っている') || result.includes('深い'), 'should include field description');
});
