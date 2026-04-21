import test from 'node:test';
import assert from 'node:assert/strict';

import { renderActivatedParticles } from './buildPromptHelpers.js';

test('renderActivatedParticles prioritizes finalDecisionSubstrate foreground', () => {
  const activated = {
    finalDecisionSubstrate: {
      foreground: {
        thoughtSeeds: ['substrate-thought'],
        feelingSeeds: ['substrate-feeling'],
        moveSeeds: ['substrate-move'],
        tensionSeeds: ['substrate-tension'],
      },
    },
    activatedThoughts: {
      items: [
        { nodeId: 't1', textSeed: 'legacy-thought' },
      ],
    },
  };

  const result = renderActivatedParticles(activated);

  assert.ok(result.includes('substrate-thought'), 'should include substrate thought seeds');
  assert.ok(result.includes('substrate-feeling'), 'should include substrate feeling seeds');
  assert.ok(!result.includes('legacy-thought'), 'should not fall back when substrate exists');
});
