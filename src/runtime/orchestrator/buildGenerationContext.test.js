import test from 'node:test';
import assert from 'node:assert/strict';

import { buildOthersField, runInternalOSForAgent } from './buildGenerationContext.js';

test('buildOthersField keeps only recent echoes per agent (max 3)', () => {
  const messages = [
    { role: 'ai', agentId: 'creative', content: 'first from creative' },
    { role: 'ai', agentId: 'empath', content: 'from empath' },
    { role: 'ai', agentId: 'creative', content: 'latest creative' },
    { role: 'ai', agentId: 'strategist', content: 'from strategist' },
  ];

  const { othersFieldEntries } = buildOthersField(messages);

  assert.equal(othersFieldEntries.length, 3, 'should cap at 3 entries');
  assert.deepEqual(
    othersFieldEntries.map((e) => e.agentId),
    ['ken', 'joe', 'mina'],
    'should prefer latest per agent in reverse recency order',
  );
});

test('runInternalOSForAgent uses selectedMode as lengthPreference', () => {
  const result = runInternalOSForAgent({
    latestUserText: 'hi',
    agentId: 'creative',
    isMaster: false,
    selectedMode: 'long',
    safePreviousMix: null,
    safePreviousLatentState: null,
    othersFieldEntries: [],
    microSignals: {},
    trace: null,
  });

  assert.equal(result.latentState?.lengthPlan?.target, 'long', 'lengthPlan target should reflect selectedMode');
});
