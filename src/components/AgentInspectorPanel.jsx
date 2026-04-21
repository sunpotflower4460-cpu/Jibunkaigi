import React, { useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'input', label: '📥 入力' },
  { id: 'latent', label: '🧠 潜在層' },
  { id: 'dynamic', label: '⚡ 動的層' },
  { id: 'decision', label: '🎯 決定' },
  { id: 'surface', label: '🪞 表層' },
  { id: 'prompt', label: '📝 プロンプト' },
  { id: 'llm', label: '🤖 LLM応答' },
  { id: 'afterglow', label: '💾 余韻' },
];

const TAB_STAGE_PREFIX = {
  input: ['INPUT', 'MICRO_SIGNAL'],
  latent: ['LATENT_', 'PRECONDITION_'],
  dynamic: ['DYNAMIC_', 'PERMISSION'],
  decision: ['DECISION', 'ACTIVATION', 'MATERIAL_PICK'],
  surface: ['RESIDUE', 'REENTRY'],
  prompt: ['PROMPT_'],
  llm: ['LLM_'],
  afterglow: ['AFTERGLOW_'],
};

const TURN_LABELS = ['最新ターン', '1つ前', '2つ前'];

const buildTurns = (trace, history = []) => {
  const seen = new Set();
  return [trace, ...history]
    .filter(Boolean)
    .filter((entry) => {
      const key = entry.turnId || `${entry.sessionId || 'session'}:${entry.startTime || 0}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
};

const matchesTab = (stage, tabId) => {
  const prefixes = TAB_STAGE_PREFIX[tabId] || [];
  return prefixes.some((prefix) => stage === prefix || stage.startsWith(prefix));
};

const AgentInspectorPanel = ({ trace = null, history = [], onClose }) => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(0);
  const [isEntered, setIsEntered] = useState(false);

  const turns = useMemo(() => buildTurns(trace, history), [trace, history]);
  const selectedTrace = turns[selectedTurnIndex] ?? null;
  const selectedEvents = Array.isArray(selectedTrace?.events) ? selectedTrace.events : [];
  const matchedEvents = selectedEvents.filter((event) => matchesTab(event?.stage || '', activeTab));

  useEffect(() => {
    setIsEntered(true);
  }, []);

  useEffect(() => {
    if (selectedTurnIndex >= turns.length) {
      setSelectedTurnIndex(0);
    }
  }, [selectedTurnIndex, turns.length]);

  return (
    <aside
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        bottom: 16,
        width: '40vw',
        minWidth: 360,
        maxWidth: 720,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 18,
        border: '1px solid rgba(148,163,184,0.2)',
        background: 'rgba(15,23,42,0.96)',
        boxShadow: '0 24px 80px rgba(15,23,42,0.42)',
        color: '#e2e8f0',
        overflow: 'hidden',
        transform: isEntered ? 'translateX(0)' : 'translateX(110%)',
        transition: 'transform 220ms ease',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(148,163,184,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: 0.8 }}>INSPECTOR</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Agent Inspector</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid rgba(148,163,184,0.24)',
              background: 'rgba(30,41,59,0.9)',
              color: '#e2e8f0',
              borderRadius: 999,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {TURN_LABELS.map((label, index) => {
            const enabled = !!turns[index];
            const selected = selectedTurnIndex === index;
            return (
              <button
                key={label}
                type="button"
                disabled={!enabled}
                onClick={() => setSelectedTurnIndex(index)}
                style={{
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 12,
                  cursor: enabled ? 'pointer' : 'not-allowed',
                  border: selected ? '1px solid rgba(129,140,248,0.85)' : '1px solid rgba(148,163,184,0.18)',
                  background: selected ? 'rgba(79,70,229,0.22)' : 'rgba(30,41,59,0.75)',
                  color: enabled ? '#e2e8f0' : '#64748b',
                  opacity: enabled ? 1 : 0.6,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          {selectedTrace ? (
            <>
              <div>agent: {selectedTrace.agentId || 'unknown'}</div>
              <div>turn: {selectedTrace.turnId || 'unknown'}</div>
              <div>events: {selectedEvents.length}</div>
            </>
          ) : (
            <div>trace データ待機中</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 18px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: 10,
                border: selected ? '1px solid rgba(96,165,250,0.75)' : '1px solid rgba(51,65,85,1)',
                background: selected ? 'rgba(30,64,175,0.26)' : 'rgba(15,23,42,0.82)',
                color: selected ? '#eff6ff' : '#cbd5e1',
                padding: '8px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
        <div
          style={{
            borderRadius: 14,
            border: '1px solid rgba(51,65,85,1)',
            background: 'rgba(15,23,42,0.72)',
            padding: 16,
            minHeight: 220,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            {TABS.find((tab) => tab.id === activeTab)?.label}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
            V-2 以降で詳細を埋める骨組みです。
          </div>

          {!selectedTrace ? (
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>まだ表示できるトレースがありません。</div>
          ) : matchedEvents.length === 0 ? (
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>このタブに対応するイベントはまだありません。</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {matchedEvents.map((event, index) => (
                <div
                  key={`${event.stage}-${event.timestamp}-${index}`}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(71,85,105,0.8)',
                    padding: 12,
                    background: 'rgba(30,41,59,0.72)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#bfdbfe', marginBottom: 8 }}>{event.stage}</div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 11,
                      color: '#e2e8f0',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {JSON.stringify(event.payload ?? {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AgentInspectorPanel;
