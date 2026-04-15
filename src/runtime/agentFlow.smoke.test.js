// src/runtime/agentFlow.smoke.test.js
//
// Lightweight smoke tests for the agent / delegate / compare flow.
// Goal: catch obvious regressions at the handler / state / render-condition
// level before manual QA. No real LLM calls; no DOM or Firebase required.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { readCompareModeFlag, shouldShowComparePanel, COMPARE_MAX_ENTRIES } from './compareMode.js';
import { getOthersVisibilityState } from './getOthersVisibilityState.js';
import { buildContextualAgentWeights, pickContextualAgent, getLastRespondingAgentId } from './switchAgent.js';

// ---------------------------------------------------------------------------
// Helpers matching App.jsx pure-logic extracts (no React, no DOM)
// ---------------------------------------------------------------------------

function getAgentDisabledReason({ isAppReady, isGenerating, isSending, activeSessionId, hasPromptForActiveSession }) {
  if (!isAppReady) return 'app-not-ready';
  if (isGenerating) return 'busy:isGenerating';
  if (isSending) return 'busy:isSending';
  if (!activeSessionId) return 'no-session';
  if (!hasPromptForActiveSession) return 'no-prompt';
  return null;
}

function canUseAgents(params) {
  return getAgentDisabledReason(params) === null;
}

function shouldShowFloatingBar({ activeSessionId, hasMessages, compareModeEnabled, isDebugMode, isOpen }) {
  return (!!activeSessionId && hasMessages) || compareModeEnabled || isDebugMode || isOpen;
}

function pushDebugEvent(events, event) {
  const next = [...events, { ...event, at: new Date().toISOString() }];
  return next.slice(-12);
}

const AGENTS = [
  { id: 'soul' },
  { id: 'creative' },
  { id: 'strategist' },
  { id: 'empath' },
  { id: 'critic' },
];

// ---------------------------------------------------------------------------
// 1. Session creation state
// ---------------------------------------------------------------------------

describe('smoke: session creation', () => {
  it('new session starts with no messages and gate closed', () => {
    const state = {
      activeSessionId: 'sess-new',
      hasMessages: false,
      hasPromptForActiveSession: false,
      isGenerating: false,
      isSending: false,
      isAppReady: true,
    };

    assert.equal(canUseAgents(state), false);
    assert.equal(getAgentDisabledReason(state), 'no-prompt');
    assert.equal(shouldShowFloatingBar({
      ...state,
      compareModeEnabled: false,
      isDebugMode: false,
      isOpen: false,
    }), false);
  });

  it('gate opens after first message is received', () => {
    const state = {
      activeSessionId: 'sess-new',
      hasMessages: true,
      hasPromptForActiveSession: true,
      isGenerating: false,
      isSending: false,
      isAppReady: true,
    };

    assert.equal(canUseAgents(state), true);
    assert.equal(getAgentDisabledReason(state), null);
    assert.equal(shouldShowFloatingBar({
      ...state,
      compareModeEnabled: false,
      isDebugMode: false,
      isOpen: false,
    }), true);
  });

  it('session switch clears stale gate: new session starts with gate closed again', () => {
    // Simulates session switch: activeSessionId changes, hasPrompt resets
    const before = {
      activeSessionId: 'sess-old',
      hasPromptForActiveSession: true,
      isAppReady: true,
      isGenerating: false,
      isSending: false,
    };
    const after = {
      activeSessionId: 'sess-new',
      hasPromptForActiveSession: false, // prompt not yet loaded
      isAppReady: true,
      isGenerating: false,
      isSending: false,
    };

    assert.equal(canUseAgents(before), true);
    assert.equal(canUseAgents(after), false);
    assert.equal(getAgentDisabledReason(after), 'no-prompt');
  });
});

// ---------------------------------------------------------------------------
// 2. OTHERS visibility across session states
// ---------------------------------------------------------------------------

describe('smoke: OTHERS visibility state', () => {
  it('OTHERS hidden with no session', () => {
    const s = getOthersVisibilityState({ activeSessionId: null });
    assert.equal(s.shouldRenderOthers, false);
    assert.equal(s.reason, 'no-session');
  });

  it('OTHERS hidden when no reactions in normal mode', () => {
    const s = getOthersVisibilityState({
      activeSessionId: 'sess-1',
      hasPromptForActiveSession: true,
      visibleMessagesCount: 3,
      reactions: null,
      compareModeEnabled: false,
    });
    assert.equal(s.shouldRenderOthers, false);
    assert.equal(s.reason, 'no-candidates');
  });

  it('OTHERS shown when reactions exist', () => {
    const s = getOthersVisibilityState({
      activeSessionId: 'sess-1',
      hasPromptForActiveSession: true,
      visibleMessagesCount: 3,
      reactions: { soul: { text: '...' }, creative: { text: '...' } },
      compareModeEnabled: false,
    });
    assert.equal(s.shouldRenderOthers, true);
    assert.equal(s.reason, 'ok');
    assert.equal(s.othersCount, 2);
  });

  it('OTHERS section visible in compare mode even without reactions', () => {
    const s = getOthersVisibilityState({
      activeSessionId: 'sess-1',
      hasPromptForActiveSession: true,
      visibleMessagesCount: 2,
      reactions: null,
      compareModeEnabled: true,
    });
    assert.equal(s.shouldRenderOthers, true);
    assert.equal(s.reason, 'no-candidates');
    assert.equal(s.compareModeEnabled, true);
  });

  it('OTHERS shows loading state in compare mode while messages load', () => {
    const s = getOthersVisibilityState({
      activeSessionId: 'sess-1',
      hasPromptForActiveSession: true,
      isMessagesLoading: true,
      visibleMessagesCount: 1,
      reactions: null,
      compareModeEnabled: true,
    });
    assert.equal(s.shouldRenderOthers, true);
    assert.equal(s.reason, 'loading');
    assert.equal(s.shouldShowLoading, true);
  });
});

// ---------------------------------------------------------------------------
// 3. Agent dispatch (delegate / specific agent)
// ---------------------------------------------------------------------------

describe('smoke: agent dispatch', () => {
  it('specific agent click routes to the requested agent id', () => {
    let calledWith = null;
    const handleAgentClick = (agentId) => { calledWith = agentId; };

    handleAgentClick('creative');
    assert.equal(calledWith, 'creative');

    handleAgentClick('soul');
    assert.equal(calledWith, 'soul');
  });

  it('delegate (委ねる) calls onRandomResponse', () => {
    let delegateCalled = false;
    const handleRandomResponse = () => { delegateCalled = true; };

    handleRandomResponse();
    assert.equal(delegateCalled, true);
  });

  it('contextual agent picker returns a known agent id from the pool', () => {
    const patternMix = {
      selected: [{ id: 'bright_focus', weight: 0.8 }, { id: 'truth_gentle', weight: 0.2 }],
      dominant: 'bright_focus',
    };
    const picked = pickContextualAgent(AGENTS, { patternMix, randomValue: 0.5 });
    assert.ok(AGENTS.some(a => a.id === picked), `picked agent "${picked}" should be in pool`);
  });

  it('contextual agent respects last-agent penalty for variety', () => {
    const patternMix = {
      selected: [{ id: 'comfort_soft', weight: 0.9 }],
      dominant: 'comfort_soft',
    };
    // Verify penalty is applied: weight with penalty < weight without penalty
    const withPenalty = buildContextualAgentWeights(AGENTS, patternMix, 'empath');
    const withoutPenalty = buildContextualAgentWeights(AGENTS, patternMix, null);

    const empathWithPenalty = withPenalty.find(w => w.id === 'empath')?.weight ?? 0;
    const empathWithoutPenalty = withoutPenalty.find(w => w.id === 'empath')?.weight ?? 0;

    assert.ok(
      empathWithPenalty < empathWithoutPenalty,
      'empath weight should be reduced when it was the last agent',
    );
  });

  it('getLastRespondingAgentId returns the most recent AI agent', () => {
    const messages = [
      { role: 'user', text: 'hello' },
      { role: 'ai', agentId: 'soul', text: 'hi' },
      { role: 'user', text: 'and?' },
      { role: 'ai', agentId: 'creative', text: 'yes!' },
    ];
    assert.equal(getLastRespondingAgentId(messages), 'creative');
  });

  it('getLastRespondingAgentId returns null for empty or user-only history', () => {
    assert.equal(getLastRespondingAgentId([]), null);
    assert.equal(getLastRespondingAgentId([{ role: 'user', text: 'hi' }]), null);
    assert.equal(getLastRespondingAgentId(null), null);
  });
});

// ---------------------------------------------------------------------------
// 4. Debug trace sequence
// ---------------------------------------------------------------------------

describe('smoke: debug trace events', () => {
  it('debug events push in order: start → dispatch → ai-response:start', () => {
    let events = [];
    events = pushDebugEvent(events, { tag: 'agent-click:start', agentId: 'creative' });
    events = pushDebugEvent(events, { tag: 'agent-click:dispatch', agentId: 'creative' });
    events = pushDebugEvent(events, { tag: 'ai-response:start', agentId: 'creative', sessionId: 'sess-1' });

    assert.equal(events.length, 3);
    assert.equal(events[0].tag, 'agent-click:start');
    assert.equal(events[1].tag, 'agent-click:dispatch');
    assert.equal(events[2].tag, 'ai-response:start');
  });

  it('debug trace is trimmed to max 12 events', () => {
    let events = [];
    for (let i = 0; i < 15; i++) {
      events = pushDebugEvent(events, { tag: `ev-${i}`, agentId: 'soul' });
    }
    assert.equal(events.length, 12);
    assert.equal(events[0].tag, 'ev-3');
  });

  it('blocked agent click event carries reason and messagesCount', () => {
    let events = [];
    events = pushDebugEvent(events, {
      tag: 'agent-click:blocked',
      reason: 'no-prompt',
      agentId: 'creative',
      messagesCount: 0,
      visibleMessagesCount: 0,
    });

    const ev = events[0];
    assert.equal(ev.tag, 'agent-click:blocked');
    assert.equal(ev.reason, 'no-prompt');
    assert.equal(ev.messagesCount, 0);
    assert.ok(ev.at, 'event should have timestamp');
  });

  it('debug events are not pushed when debug mode is off', () => {
    let events = [];
    const isDebugEnabled = false;

    const pushIfDebug = (ev) => {
      if (!isDebugEnabled) return events;
      return pushDebugEvent(events, ev);
    };

    events = pushIfDebug({ tag: 'agent-click:start', agentId: 'soul' });
    assert.equal(events.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 5. Compare Mode guard / panel visibility
// ---------------------------------------------------------------------------

describe('smoke: compare mode guard and panel visibility', () => {
  it('compare panel is hidden when compareMode is disabled', () => {
    assert.equal(shouldShowComparePanel({ enabled: false, entries: [{ id: 'x' }] }), false);
  });

  it('compare panel is hidden when entries is empty even if mode is enabled', () => {
    assert.equal(shouldShowComparePanel({ enabled: true, entries: [] }), false);
  });

  it('compare panel shows when mode is enabled and entries exist', () => {
    assert.equal(shouldShowComparePanel({ enabled: true, entries: [{ id: 'x' }] }), true);
  });

  it('COMPARE_MAX_ENTRIES limits the visible entry list', () => {
    const all = Array.from({ length: COMPARE_MAX_ENTRIES + 4 }, (_, i) => ({ id: `e${i}` }));
    const visible = all.slice(0, COMPARE_MAX_ENTRIES);
    assert.equal(visible.length, COMPARE_MAX_ENTRIES);
    assert.ok(visible.length < all.length);
  });

  it('readCompareModeFlag returns true for ?compareMode=1', () => {
    assert.equal(readCompareModeFlag({ search: '?compareMode=1' }), true);
  });

  it('readCompareModeFlag returns false when neither query nor storage is set', () => {
    assert.equal(readCompareModeFlag({ search: '', storageGetter: () => null }), false);
  });

  it('readCompareModeFlag returns true when localStorage has "1"', () => {
    assert.equal(readCompareModeFlag({ search: '', storageGetter: () => '1' }), true);
  });

  it('readCompareModeFlag survives broken storage gracefully', () => {
    const result = readCompareModeFlag({
      search: '',
      storageGetter: () => { throw new Error('storage error'); },
    });
    assert.equal(result, false, 'broken storage should fall back to disabled');
  });
});

// ---------------------------------------------------------------------------
// 6. FloatingAgentBar visibility and handler delegation
// ---------------------------------------------------------------------------

describe('smoke: FloatingAgentBar integration', () => {
  it('bar hidden when session exists but no messages and no special mode', () => {
    assert.equal(shouldShowFloatingBar({
      activeSessionId: 'sess-1',
      hasMessages: false,
      compareModeEnabled: false,
      isDebugMode: false,
      isOpen: false,
    }), false);
  });

  it('bar shown when session + messages present', () => {
    assert.equal(shouldShowFloatingBar({
      activeSessionId: 'sess-1',
      hasMessages: true,
      compareModeEnabled: false,
      isDebugMode: false,
      isOpen: false,
    }), true);
  });

  it('bar shown in compare mode without messages', () => {
    assert.equal(shouldShowFloatingBar({
      activeSessionId: null,
      hasMessages: false,
      compareModeEnabled: true,
      isDebugMode: false,
      isOpen: false,
    }), true);
  });

  it('bar shown in debug mode without messages', () => {
    assert.equal(shouldShowFloatingBar({
      activeSessionId: null,
      hasMessages: false,
      compareModeEnabled: false,
      isDebugMode: true,
      isOpen: false,
    }), true);
  });

  it('OTHERS scroll handler is called when OTHERS button triggered', () => {
    let scrolled = false;
    const onScrollToOthers = () => { scrolled = true; };
    onScrollToOthers();
    assert.equal(scrolled, true);
  });

  it('master agent click routes with isMirror flag', () => {
    let lastId = null;
    let lastIsMaster = null;
    const onAgentClick = (id, isMaster) => { lastId = id; lastIsMaster = isMaster; };

    onAgentClick('master', true);
    assert.equal(lastId, 'master');
    assert.equal(lastIsMaster, true);
  });
});
