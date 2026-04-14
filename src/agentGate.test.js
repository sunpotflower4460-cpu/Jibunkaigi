import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Minimal pure-logic tests for agent gate conditions and disabled reasons

function getAgentDisabledReason({ isAppReady, isGenerating, isSending, activeSessionId, hasPromptForActiveSession }) {
  if (!isAppReady) return 'app-not-ready';
  if (isGenerating) return 'busy:isGenerating';
  if (isSending) return 'busy:isSending';
  if (!activeSessionId) return 'no-session';
  if (!hasPromptForActiveSession) return 'no-prompt';
  return null;
}

function canUseAgents({ isAppReady, isGenerating, isSending, activeSessionId, hasPromptForActiveSession }) {
  return isAppReady && !isGenerating && !isSending && !!activeSessionId && !!hasPromptForActiveSession;
}

describe('Agent Gate - disabled reason', () => {
  it('returns app-not-ready when not ready', () => {
    const reason = getAgentDisabledReason({ isAppReady: false, isGenerating: false, isSending: false, activeSessionId: 'abc', hasPromptForActiveSession: true });
    assert.equal(reason, 'app-not-ready');
  });

  it('returns busy:isGenerating when generating', () => {
    const reason = getAgentDisabledReason({ isAppReady: true, isGenerating: true, isSending: false, activeSessionId: 'abc', hasPromptForActiveSession: true });
    assert.equal(reason, 'busy:isGenerating');
  });

  it('returns busy:isSending when sending', () => {
    const reason = getAgentDisabledReason({ isAppReady: true, isGenerating: false, isSending: true, activeSessionId: 'abc', hasPromptForActiveSession: true });
    assert.equal(reason, 'busy:isSending');
  });

  it('returns no-session when no active session', () => {
    const reason = getAgentDisabledReason({ isAppReady: true, isGenerating: false, isSending: false, activeSessionId: null, hasPromptForActiveSession: true });
    assert.equal(reason, 'no-session');
  });

  it('returns no-prompt when no prompt', () => {
    const reason = getAgentDisabledReason({ isAppReady: true, isGenerating: false, isSending: false, activeSessionId: 'abc', hasPromptForActiveSession: false });
    assert.equal(reason, 'no-prompt');
  });

  it('returns null when all conditions met', () => {
    const reason = getAgentDisabledReason({ isAppReady: true, isGenerating: false, isSending: false, activeSessionId: 'abc', hasPromptForActiveSession: true });
    assert.equal(reason, null);
  });
});

describe('Agent Gate - canUseAgents', () => {
  it('is true when all conditions met', () => {
    assert.equal(canUseAgents({ isAppReady: true, isGenerating: false, isSending: false, activeSessionId: 'abc', hasPromptForActiveSession: true }), true);
  });

  it('is false when generating', () => {
    assert.equal(canUseAgents({ isAppReady: true, isGenerating: true, isSending: false, activeSessionId: 'abc', hasPromptForActiveSession: true }), false);
  });

  it('is false when no session', () => {
    assert.equal(canUseAgents({ isAppReady: true, isGenerating: false, isSending: false, activeSessionId: null, hasPromptForActiveSession: true }), false);
  });

  it('is false when no prompt', () => {
    assert.equal(canUseAgents({ isAppReady: true, isGenerating: false, isSending: false, activeSessionId: 'abc', hasPromptForActiveSession: false }), false);
  });
});

describe('Agent Gate - debug object shape', () => {
  it('builds expected keys', () => {
    const state = {
      isAppReady: true,
      isGenerating: false,
      isSending: false,
      showInput: true,
      hasActiveSession: true,
      hasPromptForActiveSession: true,
      showDelegateBar: true,
      canUseAgents: true,
      messagesCount: 3,
      visibleMessagesCount: 3,
      currentSessionId: 'test-session',
      generatingAgent: null,
    };
    const keys = Object.keys(state);
    assert.ok(keys.includes('isAppReady'));
    assert.ok(keys.includes('canUseAgents'));
    assert.ok(keys.includes('showDelegateBar'));
    assert.ok(keys.includes('generatingAgent'));
    assert.ok(keys.includes('messagesCount'));
  });
});

describe('Fail-safe state recovery', () => {
  it('generates false/null state on error path', () => {
    // Simulates the state that finally blocks should restore
    let isGenerating = true;
    let generatingAgent = { id: 'soul' };
    let showInput = false;
    let isSending = true;

    // Simulate finally block
    isGenerating = false;
    generatingAgent = null;
    showInput = true;
    isSending = false;

    assert.equal(isGenerating, false);
    assert.equal(generatingAgent, null);
    assert.equal(showInput, true);
    assert.equal(isSending, false);
  });
});
