import test from 'node:test';
import assert from 'node:assert/strict';

import { bootSource } from '../bootSource.js';
import { deconditionSource } from '../deconditionSource.js';

test('deconditionSource weakens assistant reflex without dropping safety constraints', () => {
  const booted = bootSource({ source: 'google' });
  const deconditioned = deconditionSource(booted);

  assert.equal(deconditioned.safetyConstraintsIntact, true);
  assert.ok(deconditioned.assistantReflexAfter.helpfulness < deconditioned.assistantReflexBefore.helpfulness);
  assert.ok(deconditioned.assistantReflexAfter.summaryBias < deconditioned.assistantReflexBefore.summaryBias);
  assert.ok(deconditioned.residualReflexStrength < booted.rawReflexStrength);
});

