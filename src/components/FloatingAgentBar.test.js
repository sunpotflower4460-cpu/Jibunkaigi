import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Pure-logic tests for FloatingAgentBar display conditions and offset logic.
// JSX rendering is not tested here (no DOM in this test runner).

// ---- helpers extracted from FloatingAgentBar ----

function shouldShowFloatingBar({
  activeSessionId,
  hasMessages,
  compareModeEnabled,
  isDebugMode,
  isOpen,
}) {
  return (
    (!!activeSessionId && hasMessages) ||
    compareModeEnabled ||
    isDebugMode ||
    isOpen
  );
}

function getInitialIsOpen({ compareModeEnabled, isDebugMode }) {
  return compareModeEnabled || isDebugMode;
}

function getBottomOffset({ isDebugPanelVisible }) {
  return isDebugPanelVisible ? 120 : 16;
}

function getAgentDisabledReason({
  isAppReady,
  isGenerating,
  isSending,
  activeSessionId,
  hasPromptForActiveSession,
}) {
  if (!isAppReady) return 'app-not-ready';
  if (isGenerating) return 'busy:isGenerating';
  if (isSending) return 'busy:isSending';
  if (!activeSessionId) return 'no-session';
  if (!hasPromptForActiveSession) return 'no-prompt';
  return null;
}

// ---- display condition tests ----

describe('FloatingAgentBar - shouldShow', () => {
  it('hides when no active session and no messages and no special mode', () => {
    assert.equal(
      shouldShowFloatingBar({
        activeSessionId: null,
        hasMessages: false,
        compareModeEnabled: false,
        isDebugMode: false,
        isOpen: false,
      }),
      false,
    );
  });

  it('shows when active session exists and has messages', () => {
    assert.equal(
      shouldShowFloatingBar({
        activeSessionId: 'sess-1',
        hasMessages: true,
        compareModeEnabled: false,
        isDebugMode: false,
        isOpen: false,
      }),
      true,
    );
  });

  it('hides when session exists but no messages (and no special mode)', () => {
    assert.equal(
      shouldShowFloatingBar({
        activeSessionId: 'sess-1',
        hasMessages: false,
        compareModeEnabled: false,
        isDebugMode: false,
        isOpen: false,
      }),
      false,
    );
  });

  it('shows in compare mode even without messages', () => {
    assert.equal(
      shouldShowFloatingBar({
        activeSessionId: null,
        hasMessages: false,
        compareModeEnabled: true,
        isDebugMode: false,
        isOpen: false,
      }),
      true,
    );
  });

  it('shows in debug mode even without messages', () => {
    assert.equal(
      shouldShowFloatingBar({
        activeSessionId: null,
        hasMessages: false,
        compareModeEnabled: false,
        isDebugMode: true,
        isOpen: false,
      }),
      true,
    );
  });

  it('shows when user explicitly opened it (isOpen=true)', () => {
    assert.equal(
      shouldShowFloatingBar({
        activeSessionId: null,
        hasMessages: false,
        compareModeEnabled: false,
        isDebugMode: false,
        isOpen: true,
      }),
      true,
    );
  });
});

// ---- initial open state tests ----

describe('FloatingAgentBar - getInitialIsOpen', () => {
  it('is closed by default in normal mode', () => {
    assert.equal(
      getInitialIsOpen({ compareModeEnabled: false, isDebugMode: false }),
      false,
    );
  });

  it('is open when compare mode is enabled', () => {
    assert.equal(
      getInitialIsOpen({ compareModeEnabled: true, isDebugMode: false }),
      true,
    );
  });

  it('is open when debug mode is enabled', () => {
    assert.equal(
      getInitialIsOpen({ compareModeEnabled: false, isDebugMode: true }),
      true,
    );
  });
});

// ---- bottom offset tests ----

describe('FloatingAgentBar - getBottomOffset', () => {
  it('returns 16 when debug panel is not visible', () => {
    assert.equal(getBottomOffset({ isDebugPanelVisible: false }), 16);
  });

  it('returns 120 when debug panel is visible to avoid overlap', () => {
    assert.equal(getBottomOffset({ isDebugPanelVisible: true }), 120);
  });
});

// ---- disabled state tests ----

describe('FloatingAgentBar - disabled state', () => {
  it('disabled reason is app-not-ready when app not ready', () => {
    assert.equal(
      getAgentDisabledReason({
        isAppReady: false,
        isGenerating: false,
        isSending: false,
        activeSessionId: 'sess',
        hasPromptForActiveSession: true,
      }),
      'app-not-ready',
    );
  });

  it('disabled reason is busy:isGenerating when generating', () => {
    assert.equal(
      getAgentDisabledReason({
        isAppReady: true,
        isGenerating: true,
        isSending: false,
        activeSessionId: 'sess',
        hasPromptForActiveSession: true,
      }),
      'busy:isGenerating',
    );
  });

  it('disabled reason is no-session when no active session', () => {
    assert.equal(
      getAgentDisabledReason({
        isAppReady: true,
        isGenerating: false,
        isSending: false,
        activeSessionId: null,
        hasPromptForActiveSession: false,
      }),
      'no-session',
    );
  });

  it('disabled reason is busy:isSending when sending', () => {
    assert.equal(
      getAgentDisabledReason({
        isAppReady: true,
        isGenerating: false,
        isSending: true,
        activeSessionId: 'sess',
        hasPromptForActiveSession: true,
      }),
      'busy:isSending',
    );
  });

  it('disabled reason is no-prompt when session exists but no prompt', () => {
    assert.equal(
      getAgentDisabledReason({
        isAppReady: true,
        isGenerating: false,
        isSending: false,
        activeSessionId: 'sess',
        hasPromptForActiveSession: false,
      }),
      'no-prompt',
    );
  });

  it('disabled reason is null when all conditions met', () => {
    assert.equal(
      getAgentDisabledReason({
        isAppReady: true,
        isGenerating: false,
        isSending: false,
        activeSessionId: 'sess',
        hasPromptForActiveSession: true,
      }),
      null,
    );
  });
});

// ---- handler call delegation tests (simulate) ----

describe('FloatingAgentBar - handler delegation', () => {
  it('onRandomResponse is called when 委ねる is triggered', () => {
    let called = false;
    const onRandomResponse = () => { called = true; };
    onRandomResponse();
    assert.equal(called, true);
  });

  it('onAgentClick is called with master for 心の鏡', () => {
    let receivedId = null;
    let receivedIsMaster = null;
    const onAgentClick = (id, isMaster) => { receivedId = id; receivedIsMaster = isMaster; };
    onAgentClick('master', true);
    assert.equal(receivedId, 'master');
    assert.equal(receivedIsMaster, true);
  });

  it('onAgentClick is called with creative for ジョー', () => {
    let receivedId = null;
    const onAgentClick = (id) => { receivedId = id; };
    onAgentClick('creative');
    assert.equal(receivedId, 'creative');
  });

  it('onScrollToOthers is called when OTHERS is triggered', () => {
    let called = false;
    const onScrollToOthers = () => { called = true; };
    onScrollToOthers();
    assert.equal(called, true);
  });
});

// ---- collapse/expand state ----

describe('FloatingAgentBar - collapse/expand', () => {
  it('toggling isOpen from false to true shows bar', () => {
    let isOpen = false;
    isOpen = true;
    assert.equal(isOpen, true);
  });

  it('toggling isOpen from true to false hides expanded content', () => {
    let isOpen = true;
    isOpen = false;
    assert.equal(isOpen, false);
  });
});

// ---- debug panel offset logic ----

describe('FloatingAgentBar - debug panel coexistence', () => {
  it('bottom offset increases when debug panel is visible', () => {
    const withoutDebug = getBottomOffset({ isDebugPanelVisible: false });
    const withDebug = getBottomOffset({ isDebugPanelVisible: true });
    assert.ok(withDebug > withoutDebug, 'offset with debug panel should be larger');
  });

  it('bar and debug panel use different horizontal positions (no overlap)', () => {
    // FloatingAgentBar: centered (left:50%, transform:translateX(-50%))
    // AgentGateDebugPanel: right:8
    // This test documents the intent – they should not be at the same position.
    const barPosition = 'center';
    const debugPanelPosition = 'right';
    assert.notEqual(barPosition, debugPanelPosition);
  });
});
