import React from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';

import { shouldShowComparePanel } from '../runtime/compareMode.js';

const truncate = (text = '', max = 160) => {
  const trimmed = (text || '').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
};

const Section = ({ title, text, onCopy }) => (
  <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-xl bg-white/60 border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">{title}</p>
      <button
        type="button"
        aria-label={`${title} をコピー`}
        title={`${title} をコピー`}
        onClick={() => onCopy?.(text)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <Copy size={14} />
      </button>
    </div>
    <p className="text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
      {text || '（未生成）'}
    </p>
  </div>
);

const CompareModePanel = ({
  enabled,
  entries = [],
  collapsed = false,
  onToggleCollapse,
  onCopy,
}) => {
  if (!shouldShowComparePanel({ enabled, entries })) return null;

  const latest = entries[entries.length - 1];
  const {
    agentId,
    userText,
    baselineReply,
    currentReply,
    outerGuide,
    summary = {},
  } = latest || {};

  const handleCopy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // silent
      }
    } finally {
      onCopy?.(text, label);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-4xl z-[120]">
      <div className="glass-card rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-200/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Compare Mode (dev)</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{agentId || 'unknown'}</span>
              {summary?.mode && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">mode: {summary.mode}</span>}
              {summary?.baselineLength !== undefined && summary?.currentLength !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
                  len {summary.baselineLength} → {summary.currentLength}{summary.currentUsesInternalOS ? ' (OS)' : ''}
                </span>
              )}
              {summary?.sameOpening && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">same opening</span>}
            </div>
            {userText && <p className="text-[11px] font-medium text-slate-500 truncate">{truncate(userText, 140)}</p>}
          </div>
          <button
            type="button"
            aria-label="Compare Mode パネルを折りたたむ"
            title="折りたたむ"
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/70 transition-colors"
          >
            {collapsed ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        {!collapsed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 pb-5">
            <Section title="Baseline" text={baselineReply} onCopy={(text) => handleCopy(text, 'baseline')} />
            <Section title="Current" text={currentReply} onCopy={(text) => handleCopy(text, 'current')} />
            <Section title="Outer Guide" text={outerGuide} onCopy={(text) => handleCopy(text, 'outer')} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareModePanel;
