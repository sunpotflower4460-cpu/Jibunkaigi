import test from 'node:test';
import assert from 'node:assert/strict';

import { buildJoeDebugEntry, shouldBuildJoeDebugEntry } from './buildJoeDebugEntry.js';

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

test('shouldBuildJoeDebugEntry: only allows creative non-master path when dev panel is enabled', () => {
  assert.equal(shouldBuildJoeDebugEntry({
    isJoeDebugAvailable: true,
    isJoeDebugPanelVisible: true,
    agentId: 'creative',
    isMaster: false,
  }), true);
  assert.equal(shouldBuildJoeDebugEntry({
    isJoeDebugAvailable: false,
    isJoeDebugPanelVisible: true,
    agentId: 'creative',
    isMaster: false,
  }), false);
  assert.equal(shouldBuildJoeDebugEntry({
    isJoeDebugAvailable: true,
    isJoeDebugPanelVisible: true,
    agentId: 'mirror',
    isMaster: false,
  }), false);
  assert.equal(shouldBuildJoeDebugEntry({
    isJoeDebugAvailable: true,
    isJoeDebugPanelVisible: true,
    agentId: 'creative',
    isMaster: true,
  }), false);
});

test('buildJoeDebugEntry: returns null when guarded path is not allowed', () => {
  const result = buildJoeDebugEntry(
    {
      userText: 'x',
      systemInstruction: 'SYSTEM',
      promptText: 'PROMPT',
    },
    {
      isJoeDebugAvailable: false,
      isJoeDebugPanelVisible: true,
      agentId: 'creative',
      isMaster: false,
    },
  );

  assert.equal(result, null);
});

test('buildJoeDebugEntry: drops non-serializable nested values from debug payload', () => {
  const result = buildJoeDebugEntry({
    estimateState: {
      desire: 0.7,
      bad: () => 'nope',
    },
    activated: {
      activeBeliefs: [
        { id: 'b1', score: 0.9, debugOnly: undefined },
        Symbol('skip'),
      ],
    },
    microSignalBias: {
      summary: 'ok',
      skip: new Map(),
    },
  });

  assert.deepEqual(result.estimateState, { desire: 0.7 });
  assert.deepEqual(result.activated, {
    activeBeliefs: [{ id: 'b1', score: 0.9 }],
  });
  assert.deepEqual(result.microSignalBias, { summary: 'ok' });
});
