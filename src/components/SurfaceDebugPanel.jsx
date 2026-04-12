// src/components/SurfaceDebugPanel.jsx
// Dev-only Surface Translator debug panel.
// Rendered only when isSurfaceDebugEnabled() returns true.

import React, { useState } from 'react';

const MAX_ENTRIES = 8;

const fmt = (v) => {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  return String(v);
};

const fmtTime = (ts) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const Row = ({ label, value }) => (
  <div className="flex gap-1 flex-wrap">
    <span className="text-[9px] text-slate-400 shrink-0">{label}:</span>
    <span className="text-[9px] text-slate-200 break-all">{fmt(value)}</span>
  </div>
);

const EntryCard = ({ entry, index }) => {
  const [open, setOpen] = useState(index === 0);
  const tag = entry.isMirror ? '🪞Mirror' : `🟢${entry.agentId}`;
  return (
    <div className="border border-slate-600 rounded mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-slate-700/50 rounded"
      >
        <span className="text-[9px] text-slate-400">{fmtTime(entry.timestamp)}</span>
        <span className="text-[9px] font-bold text-green-400">{tag}</span>
        <span className="text-[9px] text-slate-400">{entry.mode}</span>
        {entry.usedAfterglow && <span className="text-[8px] text-yellow-400">✨AG</span>}
        <span className="ml-auto text-slate-500 text-[8px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-2 pb-2 space-y-0.5">
          <Row label="dominantPatterns" value={entry.dominantPatterns} />
          <Row label="permissionHints" value={entry.permissionHints} />
          <Row label="pacing" value={entry.pacing} />
          <Row label="directness" value={entry.directness} />
          <Row label="emotionalTemperature" value={entry.emotionalTemperature} />
          <Row label="fieldHint" value={entry.fieldHint} />
          <Row label="surfaceHint" value={entry.surfaceHint} />
          <Row label="guidancePreview" value={entry.guidancePreview} />
          <Row label="userPreview" value={entry.latestUserPreview} />
        </div>
      )}
    </div>
  );
};

const SurfaceDebugPanel = ({ entries = [], onClear }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCopyLatest = () => {
    if (!entries.length) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(entries[0], null, 2));
    } catch {
      // clipboard not available
    }
  };

  const visible = entries.slice(0, MAX_ENTRIES);

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] w-72 rounded-xl overflow-hidden shadow-2xl"
      style={{ background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(99,102,241,0.3)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <span className="text-[10px] font-mono font-bold text-indigo-300">🔬 SurfaceDebug</span>
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
        <div className="px-2 pt-2 pb-1 max-h-80 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="text-[9px] text-slate-500 text-center py-3">No entries yet</p>
          ) : (
            visible.map((entry, i) => (
              <EntryCard key={entry.timestamp + i} entry={entry} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SurfaceDebugPanel;
