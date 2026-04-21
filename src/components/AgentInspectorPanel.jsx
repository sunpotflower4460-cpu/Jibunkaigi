import React, { useMemo, useState } from 'react';
import InputTabView from './inspector/InputTabView';
import LatentTabView from './inspector/LatentTabView';
import DynamicTabView from './inspector/DynamicTabView';
import DecisionTabView from './inspector/DecisionTabView';
import SurfaceTabView from './inspector/SurfaceTabView';
import PromptTabView from './inspector/PromptTabView';
import LLMResponseTabView from './inspector/LLMResponseTabView';
import AfterglowTabView from './inspector/AfterglowTabView';
import MaterialTabView from './inspector/MaterialTabView';
import { downloadTraceAsJSON } from '../runtime/trace/traceHistoryStore.js';

const TABS = [
  { id: 'input', label: '📥 入力' },
  { id: 'latent', label: '🧠 潜在層' },
  { id: 'dynamic', label: '⚡ 動的層' },
  { id: 'decision', label: '🎯 決定' },
  { id: 'material', label: '🎒 素材' },
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
  material: ['ACTIVATION'],
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

// 比較用のデータ抽出ヘルパー
const extractComparisonData = (trace) => {
  if (!trace || !Array.isArray(trace.events)) {
    return { field: {}, stance: {}, beliefs: [] };
  }

  const data = { field: {}, stance: {}, beliefs: [] };

  // DYNAMIC_FIELD から field 軸を抽出
  const fieldEvent = trace.events.find((e) => e.stage === 'DYNAMIC_FIELD');
  if (fieldEvent?.payload) {
    const field = fieldEvent.payload.field || fieldEvent.payload;
    data.field = {
      security: field.security ?? 0,
      fragility: field.fragility ?? 0,
      energy: field.energy ?? 0,
      openness: field.openness ?? 0,
    };
  }

  // DYNAMIC_STANCE から stance 軸を抽出
  const stanceEvent = trace.events.find((e) => e.stage === 'DYNAMIC_STANCE');
  if (stanceEvent?.payload) {
    const stance = stanceEvent.payload.stance || stanceEvent.payload;
    data.stance = {
      approach: stance.approach ?? 0,
      avoid: stance.avoid ?? 0,
      freeze: stance.freeze ?? 0,
    };
  }

  // ACTIVATION から選ばれた belief IDs を抽出
  const activationEvent = trace.events.find((e) => e.stage === 'ACTIVATION');
  if (activationEvent?.payload?.activeBeliefs) {
    data.beliefs = activationEvent.payload.activeBeliefs
      .slice(0, 5)
      .map((b) => b.id || b.sense || 'unknown');
  }

  return data;
};

const formatDiff = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
};

const getDiffColor = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '#94a3b8';
  if (Math.abs(value) < 0.05) return '#94a3b8'; // 変化なし
  return value > 0 ? '#fbbf24' : '#38bdf8'; // 増加: 黄, 減少: 青
};

const ComparisonView = ({ traceA, traceB }) => {
  const dataA = extractComparisonData(traceA);
  const dataB = extractComparisonData(traceB);

  const fieldDiff = Object.keys(dataA.field).reduce((acc, key) => {
    acc[key] = (dataB.field[key] ?? 0) - (dataA.field[key] ?? 0);
    return acc;
  }, {});

  const stanceDiff = Object.keys(dataA.stance).reduce((acc, key) => {
    acc[key] = (dataB.stance[key] ?? 0) - (dataA.stance[key] ?? 0);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
        🔀 比較モード
      </div>

      {/* Field 比較 */}
      <div style={{ borderRadius: 10, border: '1px solid rgba(51,65,85,1)', background: 'rgba(15,23,42,0.5)', padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 10 }}>
          Field 4軸の変化
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '8px 12px', fontSize: 12 }}>
          <div style={{ color: '#64748b', fontWeight: 600 }}>軸</div>
          <div style={{ color: '#64748b', fontWeight: 600 }}>値A → 値B</div>
          <div style={{ color: '#64748b', fontWeight: 600 }}>差分</div>
          <div></div>
          {Object.keys(dataA.field).map((key) => (
            <React.Fragment key={key}>
              <div style={{ color: '#cbd5e1' }}>{key}</div>
              <div style={{ color: '#94a3b8' }}>
                {(dataA.field[key] ?? 0).toFixed(2)} → {(dataB.field[key] ?? 0).toFixed(2)}
              </div>
              <div style={{ color: getDiffColor(fieldDiff[key]), fontWeight: 600 }}>
                {formatDiff(fieldDiff[key])}
              </div>
              <div
                style={{
                  width: 40,
                  height: 8,
                  background: 'rgba(51,65,85,1)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: Math.abs(fieldDiff[key]) > 0.5 ? 0 : '50%',
                    width: `${Math.min(Math.abs(fieldDiff[key]) * 100, 50)}%`,
                    height: '100%',
                    background: getDiffColor(fieldDiff[key]),
                    transform: fieldDiff[key] < 0 ? 'translateX(-100%)' : 'none',
                  }}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stance 比較 */}
      <div style={{ borderRadius: 10, border: '1px solid rgba(51,65,85,1)', background: 'rgba(15,23,42,0.5)', padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 10 }}>
          Stance 3軸の変化
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '8px 12px', fontSize: 12 }}>
          <div style={{ color: '#64748b', fontWeight: 600 }}>軸</div>
          <div style={{ color: '#64748b', fontWeight: 600 }}>値A → 値B</div>
          <div style={{ color: '#64748b', fontWeight: 600 }}>差分</div>
          <div></div>
          {Object.keys(dataA.stance).map((key) => (
            <React.Fragment key={key}>
              <div style={{ color: '#cbd5e1' }}>{key}</div>
              <div style={{ color: '#94a3b8' }}>
                {(dataA.stance[key] ?? 0).toFixed(2)} → {(dataB.stance[key] ?? 0).toFixed(2)}
              </div>
              <div style={{ color: getDiffColor(stanceDiff[key]), fontWeight: 600 }}>
                {formatDiff(stanceDiff[key])}
              </div>
              <div
                style={{
                  width: 40,
                  height: 8,
                  background: 'rgba(51,65,85,1)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: Math.abs(stanceDiff[key]) > 0.5 ? 0 : '50%',
                    width: `${Math.min(Math.abs(stanceDiff[key]) * 100, 50)}%`,
                    height: '100%',
                    background: getDiffColor(stanceDiff[key]),
                    transform: stanceDiff[key] < 0 ? 'translateX(-100%)' : 'none',
                  }}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Beliefs 比較 */}
      <div style={{ borderRadius: 10, border: '1px solid rgba(51,65,85,1)', background: 'rgba(15,23,42,0.5)', padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#34d399', marginBottom: 10 }}>
          選ばれた Belief IDs (top 5)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>ターンA</div>
            {dataA.beliefs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dataA.beliefs.map((id, idx) => (
                  <div
                    key={`a-${idx}`}
                    style={{
                      fontSize: 11,
                      color: dataB.beliefs.includes(id) ? '#34d399' : '#cbd5e1',
                      padding: '4px 8px',
                      background: dataB.beliefs.includes(id) ? 'rgba(52,211,153,0.1)' : 'rgba(51,65,85,0.5)',
                      borderRadius: 6,
                    }}
                  >
                    {id}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#64748b' }}>なし</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>ターンB</div>
            {dataB.beliefs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dataB.beliefs.map((id, idx) => (
                  <div
                    key={`b-${idx}`}
                    style={{
                      fontSize: 11,
                      color: dataA.beliefs.includes(id) ? '#34d399' : '#cbd5e1',
                      padding: '4px 8px',
                      background: dataA.beliefs.includes(id) ? 'rgba(52,211,153,0.1)' : 'rgba(51,65,85,0.5)',
                      borderRadius: 6,
                    }}
                  >
                    {id}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#64748b' }}>なし</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentInspectorPanel = ({ trace = null, history = [], onClose }) => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(0);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareTraceA, setCompareTraceA] = useState(null);
  const [compareTraceB, setCompareTraceB] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportMaskLLM, setExportMaskLLM] = useState(false);
  const [exportMaskUser, setExportMaskUser] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const turns = useMemo(() => buildTurns(trace, history), [trace, history]);
  const safeSelectedTurnIndex = selectedTurnIndex < turns.length ? selectedTurnIndex : 0;
  const selectedTrace = turns[safeSelectedTurnIndex] ?? null;
  const selectedEvents = Array.isArray(selectedTrace?.events) ? selectedTrace.events : [];
  const matchedEvents = selectedEvents.filter((event) => matchesTab(event?.stage || '', activeTab));

  const handleExportJSON = () => {
    if (!selectedTrace) return;
    downloadTraceAsJSON(selectedTrace, {
      maskLLMResponse: exportMaskLLM,
      maskUserText: exportMaskUser,
    });
    setShowExportOptions(false);
  };

  const handleSelectHistoryItem = (index) => {
    setSelectedTurnIndex(index);
    setIsHistoryDropdownOpen(false);
  };

  const handleEnterCompareMode = () => {
    if (turns.length >= 2) {
      setIsCompareMode(true);
      setCompareTraceA(turns[0]);
      setCompareTraceB(turns[1]);
    }
  };

  const handleExitCompareMode = () => {
    setIsCompareMode(false);
    setCompareTraceA(null);
    setCompareTraceB(null);
  };

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
        animation: 'agentInspectorSlideIn 220ms ease',
        pointerEvents: 'auto',
      }}
    >
      <style>{'@keyframes agentInspectorSlideIn { from { transform: translateX(110%); } to { transform: translateX(0); } }'}</style>
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(148,163,184,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: 0.8 }}>INSPECTOR</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Agent Inspector</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* 📜 履歴ドロップダウン */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
                disabled={turns.length === 0}
                style={{
                  border: '1px solid rgba(148,163,184,0.24)',
                  background: 'rgba(30,41,59,0.9)',
                  color: turns.length === 0 ? '#64748b' : '#e2e8f0',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: turns.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
                title="履歴"
              >
                📜 履歴 {turns.length > 0 ? `(${turns.length})` : ''}
              </button>
              {isHistoryDropdownOpen && turns.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    minWidth: 200,
                    background: 'rgba(15,23,42,0.98)',
                    border: '1px solid rgba(148,163,184,0.3)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 10000,
                    overflow: 'hidden',
                  }}
                >
                  {turns.map((turn, index) => (
                    <button
                      key={turn.turnId || `turn-${index}`}
                      type="button"
                      onClick={() => handleSelectHistoryItem(index)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        border: 'none',
                        background: safeSelectedTurnIndex === index ? 'rgba(79,70,229,0.22)' : 'transparent',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        fontSize: 12,
                        borderBottom: index < turns.length - 1 ? '1px solid rgba(148,163,184,0.1)' : 'none',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{TURN_LABELS[index] || `ターン ${index + 1}`}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        {turn.turnId ? `ID: ${turn.turnId.slice(0, 8)}...` : 'ID なし'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 🔀 比較モード */}
            <button
              type="button"
              onClick={isCompareMode ? handleExitCompareMode : handleEnterCompareMode}
              disabled={turns.length < 2}
              style={{
                border: '1px solid rgba(148,163,184,0.24)',
                background: isCompareMode ? 'rgba(79,70,229,0.3)' : 'rgba(30,41,59,0.9)',
                color: turns.length < 2 ? '#64748b' : '#e2e8f0',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: turns.length < 2 ? 'not-allowed' : 'pointer',
                fontSize: 12,
              }}
              title="比較モード"
            >
              🔀 {isCompareMode ? '通常表示' : '比較'}
            </button>

            {/* 🎓 解説モード */}
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              style={{
                border: '1px solid rgba(148,163,184,0.24)',
                background: showExplanation ? 'rgba(251,191,36,0.2)' : 'rgba(30,41,59,0.9)',
                color: '#e2e8f0',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
              }}
              title="解説モード：日本語ラベルとヒントを表示"
            >
              🎓 {showExplanation ? 'ON' : 'OFF'}
            </button>

            {/* 💾 JSON保存 */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={!selectedTrace}
                style={{
                  border: '1px solid rgba(148,163,184,0.24)',
                  background: 'rgba(30,41,59,0.9)',
                  color: selectedTrace ? '#e2e8f0' : '#64748b',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: selectedTrace ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                }}
                title="JSON保存"
              >
                💾 保存
              </button>
              {showExportOptions && selectedTrace && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    minWidth: 220,
                    background: 'rgba(15,23,42,0.98)',
                    border: '1px solid rgba(148,163,184,0.3)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 10000,
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 8, fontWeight: 600 }}>
                    エクスポート オプション
                  </div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: '#cbd5e1',
                      marginBottom: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={exportMaskLLM}
                      onChange={(e) => setExportMaskLLM(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    LLM応答をマスク
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: '#cbd5e1',
                      marginBottom: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={exportMaskUser}
                      onChange={(e) => setExportMaskUser(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    ユーザー入力をマスク
                  </label>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(129,140,248,0.85)',
                      background: 'rgba(79,70,229,0.3)',
                      color: '#e2e8f0',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ダウンロード
                  </button>
                </div>
              )}
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
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {TURN_LABELS.map((label, index) => {
            const enabled = !!turns[index];
            const selected = safeSelectedTurnIndex === index;
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
        {isCompareMode && compareTraceA && compareTraceB ? (
          <div
            style={{
              borderRadius: 14,
              border: '1px solid rgba(51,65,85,1)',
              background: 'rgba(15,23,42,0.72)',
              padding: 16,
              minHeight: 220,
            }}
          >
            <ComparisonView traceA={compareTraceA} traceB={compareTraceB} />
          </div>
        ) : (
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

            {!selectedTrace ? (
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>まだ表示できるトレースがありません。</div>
            ) : matchedEvents.length === 0 && activeTab !== 'input' ? (
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>このタブに対応するイベントはまだありません。</div>
            ) : (
              <>
                {activeTab === 'input' && <InputTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'latent' && <LatentTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'dynamic' && <DynamicTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'decision' && <DecisionTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'material' && <MaterialTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'surface' && <SurfaceTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'prompt' && <PromptTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'llm' && <LLMResponseTabView events={selectedEvents} showExplanation={showExplanation} />}
                {activeTab === 'afterglow' && <AfterglowTabView events={selectedEvents} showExplanation={showExplanation} />}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default AgentInspectorPanel;
