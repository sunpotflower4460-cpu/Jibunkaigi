import test from 'node:test';
import assert from 'node:assert/strict';

import { handleAgentResponse } from './handleAgentResponse.js';

test('handleAgentResponse passes latentState and latent substrates into prompt builder', async () => {
  const latentState = {
    finalDecisionSubstrate: { foreground: { thoughtSeeds: ['from latent'] } },
    selectedThoughts: { selected: [{ clusterId: 'latent-cluster' }] },
  };

  const promptCalls = [];
  const promptMock = (agentId, params) => {
    promptCalls.push({ agentId, params });
    return 'system';
  };
  const activateMock = () => ({
    reentry: { text: 'legacy reentry' },
    selectedThoughts: { selected: [{ clusterId: 'legacy-cluster' }] },
  });

  const noop = () => {};

  await handleAgentResponse({
    agentId: 'creative',
    isMaster: false,
    sessionId: 's1',
    sourceMessageId: 'u1',
    messagesAtClick: [{ id: 'u1', role: 'user', content: 'こんにちは' }],
    traceId: 'trace-1',
    agent: { name: 'クリエイティブ' },
    AGENTS: [{ id: 'creative', name: 'クリエイティブ' }],
    userName: 'あなた',
    db: {},
    user: { uid: 'user' },
    appId: 'app',
    selectedMode: 'short',
    activeSessionIdRef: { current: 's1' },
    lastSubmittedUserMessageRef: { current: null },
    callGemini: async () => 'ok',
    makeId: () => 'id-1',
    pushAgentDebugEvent: noop,
    pushSurfaceDebugEntry: noop,
    setJoeDebugEntry: noop,
    devDebugRuntime: {},
    readSessionAfterglow: () => null,
    writeSessionAfterglowLocal: noop,
    safeUpdateSession: async () => true,
    measureFirestoreWrite: noop,
    beginTimedPhase: () => () => {},
    onOptimisticMessageAdd: noop,
    buildAgentSystemPromptFn: promptMock,
    buildFullGenerationContextFn: () => ({
      context: 'ctx',
      othersFieldEntries: [],
      othersFieldText: '',
      continuityInternalOS: { latentState },
      surfaceFrame: null,
      safePreviousMix: null,
      safePreviousLatentState: null,
    }),
    activateAgentFn: activateMock,
    buildAgentUserPromptFn: () => 'user-prompt',
    persistAgentResponseFn: async () => {},
  });

  assert.equal(promptCalls.length, 1, 'should build agent system prompt once');
  const { params } = promptCalls[0];

  assert.strictEqual(params.latentState, latentState, 'latentState should be forwarded');
  assert.deepEqual(
    params.activated.finalDecisionSubstrate,
    latentState.finalDecisionSubstrate,
    'finalDecisionSubstrate should come from latentState when present',
  );
  assert.equal(
    params.activated.selectedThoughts.selected[0].clusterId,
    'latent-cluster',
    'selectedThoughts should favor latentState content',
  );
  assert.equal(params.activated.reentry.text, 'legacy reentry', 'should retain activation reentry text');
});

test('handleAgentResponse passes previousResponseEcho from afterglow seed into prompt builder', async () => {
  const promptCalls = [];
  const promptMock = (agentId, params) => {
    promptCalls.push({ agentId, params });
    return 'system';
  };
  const noop = () => {};

  await handleAgentResponse({
    agentId: 'creative',
    isMaster: false,
    sessionId: 's1',
    sourceMessageId: 'u1',
    messagesAtClick: [{ id: 'u1', role: 'user', content: '続けてみたい' }],
    traceId: 'trace-2',
    agent: { name: 'クリエイティブ' },
    AGENTS: [{ id: 'creative', name: 'クリエイティブ' }],
    userName: 'あなた',
    db: {},
    user: { uid: 'user' },
    appId: 'app',
    selectedMode: 'short',
    activeSessionIdRef: { current: 's1' },
    lastSubmittedUserMessageRef: { current: null },
    callGemini: async () => 'ok',
    makeId: () => 'id-1',
    pushAgentDebugEvent: noop,
    pushSurfaceDebugEntry: noop,
    setJoeDebugEntry: noop,
    devDebugRuntime: {},
    readSessionAfterglow: () => ({ previousResponseEcho: 'さっきの入り。' }),
    writeSessionAfterglowLocal: noop,
    safeUpdateSession: async () => true,
    measureFirestoreWrite: noop,
    beginTimedPhase: () => () => {},
    onOptimisticMessageAdd: noop,
    buildAgentSystemPromptFn: promptMock,
    buildFullGenerationContextFn: () => ({
      context: 'ctx',
      othersFieldEntries: [],
      othersFieldText: '',
      continuityInternalOS: { latentState: {} },
      surfaceFrame: null,
      safePreviousMix: null,
      safePreviousLatentState: null,
    }),
    activateAgentFn: () => ({}),
    buildAgentUserPromptFn: () => 'user-prompt',
    persistAgentResponseFn: async () => {},
  });

  assert.equal(promptCalls.length, 1);
  assert.equal(promptCalls[0].params.previousResponseEcho, 'さっきの入り。');
});
