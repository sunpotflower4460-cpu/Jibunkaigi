// src/components/ComparePanel.jsx
// Dev-only Compare Mode panel.
// Rendered only when isCompareModeEnabled() returns true.
// Shows Baseline Reply / Current Reply / Outer Guide side by side per entry.

import React, { useState } from 'react';
import { COMPARE_MAX_ENTRIES } from '../runtime/compareMode';

const fmtTime = (ts) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const Block = ({ title, value, tone = 'slate' }) => {
  const toneMap = {
    slate: 'text-slate-200',
    emerald: 'text-emerald-200',
    amber: 'text-amber-200',
    sky: 'text-sky-200',
  };
  const displayValue = value && value.length > 0 ? value : '—';
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] text-slate-400 font-bold">{title}</div>
      <pre
        className={`text-[10px] whitespace-pre-wrap break-words leading-snug ${toneMap[tone] || toneMap.slate} bg-slate-800/60 rounded px-1.5 py-1 max-h-40 overflow-y-auto`}
      >
        {displayValue}
      </pre>
    </div>
  );
};

const OuterGuideBlock = ({ outerGuide }) => {
  const { stateGuide = '', internalFrame = '', surfaceGuidance = '' } = outerGuide || {};
  return (
    <div className="space-y-1">
      <div className="text-[9px] text-indigo-300 font-bold">Outer Guide</div>
      <div className="space-y-0.5 pl-1 border-l border-slate-700">
        <div className="text-[9px] text-slate-500">stateGuide</div>
        <pre className="text-[10px] whitespace-pre-wrap break-words leading-snug text-slate-300 bg-slate-800/60 rounded px-1.5 py-1 max-h-24 overflow-y-auto">
          {stateGuide && stateGuide.length > 0 ? stateGuide : '—'}
        </pre>
        <div className="text-[9px] text-slate-500">internalFrame</div>
        <pre className="text-[10px] whitespace-pre-wrap break-words leading-snug text-slate-300 bg-slate-800/60 rounded px-1.5 py-1 max-h-24 overflow-y-auto">
          {internalFrame && internalFrame.length > 0 ? internalFrame : '—'}
        </pre>
        <div className="text-[9px] text-slate-500">surfaceGuidance</div>
        <pre className="text-[10px] whitespace-pre-wrap break-words leading-snug text-slate-300 bg-slate-800/60 rounded px-1.5 py-1 max-h-24 overflow-y-auto">
          {surfaceGuidance && surfaceGuidance.length > 0 ? surfaceGuidance : '—'}
        </pre>
      </div>
    </div>
  );
};

const EntryCard = ({ entry, index }) => {
  const [open, setOpen] = useState(index === 0);
  const tag = entry.isMirror ? '🪞Mirror' : `🟢${entry.agentId}`;
  const joeMark = entry.agentId === 'creative' ? '🎯' : '';

  return (
    <div className="border border-slate-600 rounded mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-slate-700/50 rounded"
      >
        <span className="text-[9px] text-slate-400">{fmtTime(entry.timestamp)}</span>
        <span className="text-[9px] font-bold text-amber-300">{joeMark}{tag}</span>
        <span className="text-[9px] text-slate-400">{entry.mode}</span>
        {entry.baselineError && <span className="text-[8px] text-rose-400">bErr</span>}
        {entry.currentError && <span className="text-[8px] text-rose-400">cErr</span>}
        <span className="ml-auto text-slate-500 text-[8px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-2 pb-2 space-y-2">
          <Block title="User" value={entry.userText} tone="sky" />
          <Block
            title="Baseline Reply (Outer Guide 空)"
            value={entry.baselineError ? `⚠ ${entry.baselineError}` : entry.baselineReply}
            tone={entry.baselineError ? 'amber' : 'slate'}
          />
          <Block
            title="Current Reply (full pipeline)"
            value={entry.currentError ? `⚠ ${entry.currentError}` : entry.currentReply}
            tone={entry.currentError ? 'amber' : 'emerald'}
          />
          <OuterGuideBlock outerGuide={entry.outerGuide} />
        </div>
      )}
    </div>
  );
};

const ComparePanel = ({ entries = [], onClear }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCopyLatest = () => {
    if (!entries.length) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(entries[0], null, 2));
    } catch {
      // clipboard not available
    }
  };

  const visible = entries.slice(0, COMPARE_MAX_ENTRIES);

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] w-80 rounded-xl overflow-hidden shadow-2xl"
      style={{ background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(251,191,36,0.3)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <span className="text-[10px] font-mono font-bold text-amber-300">⚖ Compare</span>
        <div className="flex gap-1">
          <button
            onClick={handleCopyLatest}
            title="Copy latest entry JSON"
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            copy
          </button>
          <button
            onClick={onClear}
            title="Clear entries"
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-rose-700"
          >
            clear
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-2 pt-2 pb-1 max-h-[28rem] overflow-y-auto">
          {visible.length === 0 ? (
            <p className="text-[9px] text-slate-500 text-center py-3">No compare entries yet</p>
          ) : (
            visible.map((entry, i) => (
              <EntryCard key={entry.id || `${entry.timestamp}-${i}`} entry={entry} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ComparePanel;
