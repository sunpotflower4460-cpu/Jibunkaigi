import test from 'node:test';
import assert from 'node:assert/strict';

import { buildJoeDebugEntry } from './buildJoeDebugEntry.js';

test('buildJoeDebugEntry: keeps expected fields when valid input is provided', () => {
  const timestamp = Date.UTC(2026, 3, 20, 12, 0, 0);
  const estimateState = { desire: 0.7, fear: 0.4 };
  const microSignals = { punctuation: { hesitation: 0.5 } };
  const microSignalBias = { maxDelta: 0.15 };
  const fusedState = { fused: { ember: 0.61 } };
  const protoMeaning = { sensory: ['喉元にためらい'], narrative: ['まだ出したい向きがある'] };
  const activated = { activeBeliefs: [{ id: 'b1' }] };

  const result = buildJoeDebugEntry({
    timestamp,
    userText: 'まだ怖いけど出したい。',
    estimateState,
    microSignals,
    microSignalBias,
    fusedState,
    protoMeaning,
    activated,
    systemInstruction: 'SYSTEM',
    promptText: 'PROMPT',
  });

  assert.deepEqual(result, {
    timestamp,
    userText: 'まだ怖いけど出したい。',
    estimateState,
    microSignals,
    microSignalBias,
    fusedState,
    protoMeaning,
    activated,
    systemInstruction: 'SYSTEM',
    promptText: 'PROMPT',
  });
});

test('buildJoeDebugEntry: returns null-safe defaults for null input', () => {
  const result = buildJoeDebugEntry(null);

  assert.equal(result.timestamp, null);
  assert.equal(result.userText, '');
  assert.deepEqual(result.estimateState, {});
  assert.deepEqual(result.microSignals, {});
  assert.equal(result.microSignalBias, null);
  assert.equal(result.fusedState, null);
  assert.equal(result.protoMeaning, null);
  assert.deepEqual(result.activated, {});
  assert.equal(result.systemInstruction, '');
  assert.equal(result.promptText, '');
});

test('buildJoeDebugEntry: normalizes invalid field types', () => {
  const result = buildJoeDebugEntry({
    timestamp: '2026-04-20T12:00:00.000Z',
    userText: 123,
    estimateState: [],
    microSignals: false,
    microSignalBias: [],
    fusedState: 'invalid',
    protoMeaning: 0,
    activated: null,
    systemInstruction: { text: 'system' },
    promptText: ['prompt'],
  });

  assert.equal(result.timestamp, null);
  assert.equal(result.userText, '');
  assert.deepEqual(result.estimateState, {});
  assert.deepEqual(result.microSignals, {});
  assert.equal(result.microSignalBias, null);
  assert.equal(result.fusedState, null);
  assert.equal(result.protoMeaning, null);
  assert.deepEqual(result.activated, {});
  assert.equal(result.systemInstruction, '');
  assert.equal(result.promptText, '');
});
