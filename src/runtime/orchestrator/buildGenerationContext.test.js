import test from 'node:test';
import assert from 'node:assert/strict';

import { buildContext, buildOthersField, runInternalOSForAgent } from './buildGenerationContext.js';

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

test('buildContext can scope agent prompts to recent user-only messages', () => {
  const context = buildContext({
    messages: [
      { role: 'user', content: '最初の相談' },
      { role: 'ai', agentId: 'creative', content: 'AIの返答' },
      { role: 'user', content: '追加の相談' },
    ],
    userName: 'あなた',
    agents: [{ id: 'creative', name: 'ジョー' }],
    maxMessages: 3,
    userOnly: true,
  });

  assert.equal(context, 'あなた: 最初の相談\nあなた: 追加の相談');
});

test('buildContext can include previous AI utterances as raw conversation', () => {
  const context = buildContext({
    messages: [
      { role: 'user', content: '最初の相談' },
      { role: 'ai', agentId: 'creative', content: 'AIの返答' },
      { role: 'user', content: '追加の相談' },
    ],
    userName: 'あなた',
    agents: [{ id: 'creative', name: 'ジョー' }],
    maxMessages: 3,
    userOnly: false,
  });

  assert.equal(context, 'あなた: 最初の相談\nジョー: AIの返答\nあなた: 追加の相談');
});

test('buildOthersField can weaken to thin prompt context or turn off entirely', () => {
  const messages = [
    { role: 'ai', agentId: 'creative', content: 'まだ残っているものがある' },
    { role: 'ai', agentId: 'strategist', content: '構造を整理してみる' },
  ];

  const thin = buildOthersField(messages, { mode: 'thin' });
  assert.equal(thin.othersFieldEntries.length, 2);
  assert.deepEqual(thin.othersFieldEntries[0].forceTags, []);
  assert.match(thin.othersFieldText, /ほかの声の残り/);

  const off = buildOthersField(messages, { mode: 'off' });
  assert.deepEqual(off.othersFieldEntries, []);
  assert.equal(off.othersFieldText, '');
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
