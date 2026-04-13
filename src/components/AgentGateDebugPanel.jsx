import React, { useState } from 'react';

const fmt = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const Row = ({ label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-[9px] text-slate-400 shrink-0 min-w-24">{label}</span>
    <span className="text-[9px] text-slate-200 break-all">{fmt(value)}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="border border-slate-700 rounded-lg p-2 space-y-1">
    <p className="text-[9px] font-mono font-bold text-indigo-300">{title}</p>
    {children}
  </div>
);

const AgentGateDebugPanel = ({
  debug,
  showDelegateBarHiddenReasons = [],
  canUseAgentsReasons = [],
  buttonStates = [],
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="fixed bottom-4 left-4 z-[120] w-80 rounded-xl overflow-hidden shadow-2xl"
      style={{ background: 'rgba(15,23,42,0.94)', border: '1px solid rgba(99,102,241,0.3)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <span className="text-[10px] font-mono font-bold text-indigo-300">🧪 AgentGateDebug</span>
        <button
          onClick={() => setCollapsed((value) => !value)}
          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
        >
          {collapsed ? '▸' : '▾'}
        </button>
      </div>

      {!collapsed && (
        <div className="p-2 max-h-[70vh] overflow-y-auto space-y-2">
          <Section title="summary">
            <Row label="isAppReady" value={debug.isAppReady} />
            <Row label="isGenerating" value={debug.isGenerating} />
            <Row label="isSending" value={debug.isSending} />
            <Row label="showInput" value={debug.showInput} />
            <Row label="hasActiveSession" value={debug.activeSessionIdPresent} />
            <Row label="activeSessionId" value={debug.activeSessionId} />
            <Row label="hasPrompt" value={debug.hasPromptForActiveSession} />
            <Row label="showDelegateBar" value={debug.showDelegateBar} />
            <Row label="canUseAgents" value={debug.canUseAgents} />
            <Row label="messagesCount" value={debug.messagesCount} />
            <Row label="visibleMessagesCount" value={debug.visibleMessagesCount} />
            <Row label="currentSessionId" value={debug.currentSessionId} />
            <Row label="generatingAgent" value={debug.generatingAgent} />
          </Section>

          <Section title="showDelegateBar gate">
            {Object.entries(debug.showDelegateBarGate).map(([key, value]) => (
              <Row key={key} label={key} value={value} />
            ))}
            <Row label="hiddenReasons" value={showDelegateBarHiddenReasons} />
          </Section>

          <Section title="canUseAgents gate">
            {Object.entries(debug.canUseAgentsGate).map(([key, value]) => (
              <Row key={key} label={key} value={value} />
            ))}
            <Row label="disabledReasons" value={canUseAgentsReasons} />
          </Section>

          <Section title="buttons">
            {buttonStates.map((button) => (
              <div key={button.agentId} className="border border-slate-700/80 rounded p-2 space-y-1">
                <Row label="agentId" value={button.agentId} />
                <Row label="label" value={button.label} />
                <Row label="disabled" value={button.disabled} />
                <Row label="reason" value={button.reason} />
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
};

export default AgentGateDebugPanel;
