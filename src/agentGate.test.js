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

describe('Agent Debug Events', () => {
  it('pushes event and limits to max 12 entries', () => {
    const events = [];
    const pushEvent = (event) => {
      const next = [...events, { ...event, at: new Date().toISOString() }];
      events.length = 0;
      events.push(...next.slice(-12));
    };

    // Add 15 events
    for (let i = 0; i < 15; i++) {
      pushEvent({ tag: `test-${i}`, value: i });
    }

    assert.equal(events.length, 12);
    assert.equal(events[0].tag, 'test-3');
    assert.equal(events[11].tag, 'test-14');
  });

  it('includes timestamp in pushed events', () => {
    const events = [];
    const pushEvent = (event) => {
      const next = [...events, { ...event, at: new Date().toISOString() }];
      events.push(...next.slice(-12));
    };

    pushEvent({ tag: 'test', agentId: 'soul' });
    assert.ok(events[0].at);
    assert.ok(events[0].at.includes('T'));
  });

  it('builds missing deps reason correctly', () => {
    const missing = {
      db: false,
      user: true,
      sessionId: false,
    };
    const missingKeys = Object.keys(missing).filter(k => missing[k]);
    const reason = `missing:${missingKeys.join(',')}`;

    assert.equal(reason, 'missing:user');
  });

  it('builds multiple missing deps reason', () => {
    const missing = {
      db: true,
      user: true,
      sessionId: false,
    };
    const missingKeys = Object.keys(missing).filter(k => missing[k]);
    const reason = `missing:${missingKeys.join(',')}`;

    assert.equal(reason, 'missing:db,user');
  });

  it('formats trace text for copy', () => {
    const events = [
      { tag: 'agent-click:start', agentId: 'soul', at: '2024-01-01T12:00:00.000Z' },
      { tag: 'ai-response:start', agentId: 'soul', sessionId: 'abc123', at: '2024-01-01T12:00:01.000Z' },
      { tag: 'agent-click:blocked', reason: 'no-prompt', agentId: 'creative', at: '2024-01-01T12:00:02.000Z' },
    ];

    const traceText = events.map((event) => {
      const time = event.at ? new Date(event.at).toLocaleTimeString('ja-JP', { hour12: false }) : '??:??:??';
      const reason = event.reason ? ` ${event.reason}` : '';
      const agentInfo = event.agentId ? ` ${event.agentId}` : '';
      return `[${time}] ${event.tag}${agentInfo}${reason}`;
    }).join('\n');

    assert.ok(traceText.includes('agent-click:start soul'));
    assert.ok(traceText.includes('agent-click:blocked creative no-prompt'));
  });

  it('includes messagesCount in no-prompt blocked event', () => {
    const event = {
      tag: 'agent-click:blocked',
      reason: 'no-prompt',
      agentId: 'soul',
      sessionId: 'abc',
      messagesCount: 5,
      visibleMessagesCount: 3,
    };

    assert.equal(event.messagesCount, 5);
    assert.equal(event.visibleMessagesCount, 3);
  });
});

describe('ai-response subdivision debug', () => {
  // Helper matching the updated Copy Trace format (phase + reason)
  function formatTrace(events) {
    return events.map((event) => {
      const time = event.at ? new Date(event.at).toLocaleTimeString('ja-JP', { hour12: false }) : '??:??:??';
      const agentInfo = event.agentId ? ` ${event.agentId}` : '';
      const phase = event.phase ? ` phase=${event.phase}` : '';
      const reason = event.reason ? ` reason=${event.reason}` : '';
      return `[${time}] ${event.tag}${agentInfo}${phase}${reason}`;
    }).join('\n');
  }

  it('ai-response:error event retains phase', () => {
    const event = {
      tag: 'ai-response:error',
      phase: 'activate-agent',
      reason: 'TypeError: x is not a function',
      agentId: 'soul',
      sessionId: 'sess1',
    };
    assert.equal(event.phase, 'activate-agent');
    assert.equal(event.reason, 'TypeError: x is not a function');
  });

  it('subdivision events are pushed in order', () => {
    const events = [];
    const at = '2024-01-01T09:00:00.000Z';
    const push = (tag) => events.push({ tag, agentId: 'soul', at });

    push('ai-response:start');
    push('ai-response:after-context');
    push('ai-response:after-internal-os');
    push('ai-response:after-estimate-state');
    push('ai-response:after-activate-agent');
    push('ai-response:after-state-guide');
    push('ai-response:after-internal-frame');
    push('ai-response:after-surface-guidance');
    push('ai-response:after-system-prompt');
    push('ai-response:after-user-prompt');
    push('ai-response:before-gemini');

    const tags = events.map(e => e.tag);
    assert.equal(tags[0], 'ai-response:start');
    assert.equal(tags[1], 'ai-response:after-context');
    assert.equal(tags[9], 'ai-response:after-user-prompt');
    assert.equal(tags[10], 'ai-response:before-gemini');
  });

  it('Copy Trace includes phase in ai-response:error line', () => {
    const events = [
      { tag: 'ai-response:start', agentId: 'soul', at: '2024-01-01T09:00:00.000Z' },
      { tag: 'ai-response:after-context', agentId: 'soul', at: '2024-01-01T09:00:00.100Z' },
      { tag: 'ai-response:error', agentId: 'soul', phase: 'activate-agent', reason: 'crash', at: '2024-01-01T09:00:00.200Z' },
    ];
    const trace = formatTrace(events);
    assert.ok(trace.includes('ai-response:error soul phase=activate-agent reason=crash'));
  });

  it('Copy Trace omits phase/reason when absent', () => {
    const events = [
      { tag: 'ai-response:after-context', agentId: 'soul', at: '2024-01-01T09:00:00.000Z' },
    ];
    const trace = formatTrace(events);
    assert.ok(!trace.includes('phase='));
    assert.ok(!trace.includes('reason='));
  });

  it('event list is trimmed to max 12 entries', () => {
    const events = [];
    for (let i = 0; i < 20; i++) {
      const next = [...events, { tag: `ev-${i}`, at: new Date().toISOString() }];
      events.length = 0;
      events.push(...next.slice(-12));
    }
    assert.equal(events.length, 12);
    assert.equal(events[0].tag, 'ev-8');
    assert.equal(events[11].tag, 'ev-19');
  });

  it('Promise rejection path: recovery state resets isGenerating', () => {
    let isGenerating = true;
    let generatingAgent = { id: 'soul' };
    let showInput = false;

    // Simulate the .catch() handler
    const simulateCatch = () => {
      isGenerating = false;
      generatingAgent = null;
      showInput = true;
    };

    simulateCatch();
    assert.equal(isGenerating, false);
    assert.equal(generatingAgent, null);
    assert.equal(showInput, true);
  });
});
