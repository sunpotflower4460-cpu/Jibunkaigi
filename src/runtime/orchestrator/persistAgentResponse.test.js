import test from 'node:test';
import assert from 'node:assert/strict';

import { updateAfterglow, extractResponseEcho } from './persistAgentResponse.js';

test('extractResponseEcho keeps only the first two opening sentences', () => {
  const echo = extractResponseEcho('  まず、少し立ち止まってみよう。  今見えているものを一緒に確かめたい。 その先はあとでいい。');

  assert.equal(echo, 'まず、少し立ち止まってみよう。今見えているものを一緒に確かめたい。');
});

test('updateAfterglow stores previousResponseEcho alongside existing afterglow continuity', async () => {
  let localWrite = null;
  let remoteWrite = null;

  const nextAfterglow = await updateAfterglow({
    sessionId: 'session-1',
    continuityInternalOS: {
      latentState: { field: { softness: 0.7 } },
      patternMix: {
        selected: [{ id: 'comfort_soft', group: 'soften', weight: 1 }],
        dominant: 'comfort_soft',
      },
    },
    agentId: 'creative',
    isMaster: false,
    cleanedResponse: '大丈夫、まだここから見ていける。急いで決めなくていい。その先は今決めなくていい。',
    readSessionAfterglow: () => null,
    writeSessionAfterglowLocal: (_sessionId, afterglow) => {
      localWrite = afterglow;
    },
    safeUpdateSession: async (_sessionId, payload) => {
      remoteWrite = payload.afterglow;
    },
  });

  assert.equal(nextAfterglow.previousResponseEcho, '大丈夫、まだここから見ていける。急いで決めなくていい。');
  assert.equal(localWrite.previousResponseEcho, nextAfterglow.previousResponseEcho);
  assert.equal(remoteWrite.previousResponseEcho, nextAfterglow.previousResponseEcho);
});
