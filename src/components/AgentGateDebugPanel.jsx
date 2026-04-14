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
  agentDebugEvents = [],
}) => {
  if (!isAgentDebugEnabled()) return null;

  const handleCopyTrace = () => {
    try {
      const traceText = agentDebugEvents
        .slice(-10)
        .map((event) => {
          const time = event.at ? new Date(event.at).toLocaleTimeString('ja-JP', { hour12: false }) : '??:??:??';
          const agentInfo = event.agentId ? ` ${event.agentId}` : '';
          const phase = event.phase ? ` phase=${event.phase}` : '';
          const reason = event.reason ? ` reason=${event.reason}` : '';
          return `[${time}] ${event.tag}${agentInfo}${phase}${reason}`;
        })
        .join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(traceText).catch(() => {
          // silent fail
        });
      }
    } catch {
      // silent fail
    }
  };

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
        maxWidth: 320,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
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

      {agentDebugEvents.length > 0 && (
        <>
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(148,163,184,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: '#818cf8', fontSize: 9 }}>LATEST TRACE</span>
              <button
                onClick={handleCopyTrace}
                style={{
                  background: 'rgba(129,140,248,0.2)',
                  border: '1px solid rgba(129,140,248,0.4)',
                  color: '#c7d2fe',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 8,
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                Copy
              </button>
            </div>
            <div style={{ fontSize: 9, lineHeight: 1.4, maxHeight: 120, overflowY: 'auto' }}>
              {agentDebugEvents.slice(-10).map((event, idx) => {
                const time = event.at ? new Date(event.at).toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '??:??:??';
                const agentInfo = event.agentId ? ` ${event.agentId}` : '';
                const phase = event.phase ? ` phase=${event.phase}` : '';
                const reason = event.reason ? ` ${event.reason}` : '';
                const summary = `${event.tag}${agentInfo}${phase}${reason}`;
                return (
                  <div key={idx} style={{ marginBottom: 2, color: '#cbd5e1' }}>
                    <span style={{ color: '#64748b' }}>{time}</span> {summary}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { isAgentDebugEnabled }; // eslint-disable-line react-refresh/only-export-components
export default AgentGateDebugPanel;
