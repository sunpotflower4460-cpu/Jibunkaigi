import test from 'node:test';
import assert from 'node:assert/strict';

import { buildContextualAgentWeights, pickContextualAgent } from './switchAgent.js';

const AGENTS = [
  { id: 'soul' },
  { id: 'creative' },
  { id: 'strategist' },
  { id: 'empath' },
  { id: 'critic' },
];

test('buildContextualAgentWeights shifts priorities with the current pattern mix', () => {
  const brightWeights = buildContextualAgentWeights(AGENTS, {
    selected: [
      { id: 'bright_focus', group: 'illuminate', weight: 0.42 },
      { id: 'truth_gentle', group: 'truth', weight: 0.33 },
      { id: 'curious_probe', group: 'probe', weight: 0.25 },
    ],
    dominant: 'bright_focus',
  });
  const structuralWeights = buildContextualAgentWeights(AGENTS, {
    selected: [
      { id: 'structural_map', group: 'structure', weight: 0.48 },
      { id: 'steady_guard', group: 'protect', weight: 0.31 },
      { id: 'truth_gentle', group: 'truth', weight: 0.21 },
    ],
    dominant: 'structural_map',
  }, 'strategist');

  const brightLeader = brightWeights[0];
  const structuralLeader = structuralWeights[0];
  const brightTotal = brightWeights.reduce((sum, item) => sum + item.weight, 0);
  const structuralTotal = structuralWeights.reduce((sum, item) => sum + item.weight, 0);

  assert.equal(brightLeader.id, 'creative');
  assert.equal(structuralLeader.id, 'critic');
  assert.ok(Math.abs(brightTotal - 1) < 0.01);
  assert.ok(Math.abs(structuralTotal - 1) < 0.01);
  assert.ok(new Set(brightWeights.map((item) => item.weight)).size > 1);
  assert.ok(new Set(structuralWeights.map((item) => item.weight)).size > 1);
});

test('pickContextualAgent keeps variability instead of collapsing to one fixed agent', () => {
  const patternMix = {
    selected: [
      { id: 'comfort_soft', group: 'soften', weight: 0.41 },
      { id: 'protective_hold', group: 'protect', weight: 0.36 },
      { id: 'quiet_reframe', group: 'reframe', weight: 0.23 },
    ],
    dominant: 'comfort_soft',
  };

  const picks = [0.02, 0.31, 0.58, 0.84].map((randomValue) => pickContextualAgent(AGENTS, {
    patternMix,
    lastAgentId: 'empath',
    randomValue,
  }));

  assert.ok(picks.includes('empath'));
  assert.ok(new Set(picks).size >= 2);
  assert.notEqual(new Set(picks).size, 1);
});
