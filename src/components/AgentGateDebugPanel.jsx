import React from 'react';

const isAgentDebugEnabled = () => {
  try {
    if (typeof window === 'undefined') return false;
    if (new URLSearchParams(window.location.search).get('debugAgent') === '1') return true;
    if (localStorage.getItem('jibunkaigi:debugAgent') === '1') return true;
  } catch { /* ignore */ }
  return false;
};

const AgentGateDebugPanel = ({
  isAppReady,
  isGenerating,
  isSending,
  showInput,
  activeSessionId,
  hasPromptForActiveSession,
  showDelegateBar,
  canUseAgents,
  messagesCount,
  visibleMessagesCount,
  currentSessionId,
  generatingAgent,
}) => {
  if (!isAgentDebugEnabled()) return null;

  const rows = [
    ['isAppReady', isAppReady],
    ['isGenerating', isGenerating],
    ['isSending', isSending],
    ['showInput', showInput],
    ['hasActiveSession', !!activeSessionId],
    ['hasPromptForActiveSession', hasPromptForActiveSession],
    ['showDelegateBar', showDelegateBar],
    ['canUseAgents', canUseAgents],
    ['messagesCount', messagesCount],
    ['visibleMessagesCount', visibleMessagesCount],
    ['currentSessionId', currentSessionId ? currentSessionId.slice(0, 8) + '…' : 'null'],
    ['generatingAgent', generatingAgent?.id ?? 'null'],
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        zIndex: 9999,
        background: 'rgba(15,23,42,0.9)',
        color: '#e2e8f0',
        borderRadius: 10,
        padding: '8px 10px',
        fontSize: 10,
        fontFamily: 'monospace',
        minWidth: 220,
        maxWidth: 260,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
        lineHeight: 1.6,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#818cf8', letterSpacing: 1 }}>
        ⚙ Agent Gate Debug
      </div>
      {rows.map(([key, val]) => {
        const color = typeof val === 'boolean'
          ? (val ? '#4ade80' : '#f87171')
          : '#fbbf24';
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: '#94a3b8' }}>{key}</span>
            <span style={{ color, fontWeight: 700 }}>{String(val)}</span>
          </div>
        );
      })}
    </div>
  );
};

export { isAgentDebugEnabled }; // eslint-disable-line react-refresh/only-export-components
export default AgentGateDebugPanel;
