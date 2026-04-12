import test from 'node:test';
import assert from 'node:assert/strict';

import { mixLatentPatterns } from './routerMixer.js';

test('mixLatentPatterns keeps multiple weighted candidates without overfilling one group', () => {
  const result = mixLatentPatterns({
    field: {
      softness: 0.52,
      depth: 0.76,
      urgency: 0.24,
      fragility: 0.81,
      playfulness: 0.08,
    },
    reaction: {
      touched: 0.73,
      protect: 0.88,
      clarify: 0.21,
      curiosity: 0.32,
      holdBackJudgment: 0.7,
    },
    stance: {
      receive: 0.69,
      illuminate: 0.41,
      structure: 0.18,
      guard: 0.77,
      nudge: 0.12,
    },
    permission: {
      noHurry: 0.61,
      noOverExplain: 0.44,
      noPerformativeHelpfulness: 0.66,
      allowPartialUncertainty: 0.57,
    },
  });

  assert.equal(typeof result.dominant, 'string');
  assert.ok(Array.isArray(result.selected));
  assert.ok(result.selected.length >= 3);

  const groups = result.selected.map((item) => item.group);
  assert.ok(new Set(groups).size >= 2);

  const protectCount = groups.filter((group) => group === 'protect').length;
  assert.ok(protectCount <= 2);

  const totalWeight = result.selected.reduce((sum, item) => sum + item.weight, 0);
  assert.ok(Math.abs(totalWeight - 1) < 0.01);
});

test('mixLatentPatterns accepts previousMix without collapsing to a single winner', () => {
  const result = mixLatentPatterns({
    field: { softness: 0.24, depth: 0.48, urgency: 0.42, fragility: 0.28, playfulness: 0.34 },
    reaction: { touched: 0.36, protect: 0.22, clarify: 0.44, curiosity: 0.72, holdBackJudgment: 0.3 },
    stance: { receive: 0.22, illuminate: 0.54, structure: 0.38, guard: 0.2, nudge: 0.66 },
    permission: { noHurry: 0.24, noOverExplain: 0.32, noPerformativeHelpfulness: 0.28, allowPartialUncertainty: 0.36 },
  }, {
    previousMix: {
      selected: [
        { id: 'bright_focus', weight: 0.51 },
        { id: 'curious_probe', weight: 0.29 },
      ],
    },
  });

  assert.ok(result.selected.length >= 3);
  assert.notEqual(result.selected[1].weight, 0);
});
