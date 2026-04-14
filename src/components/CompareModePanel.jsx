import React from 'react'
import { Copy, Eye, EyeOff, Tags } from 'lucide-react'

import {
  COMPARE_QUALITY_DIMENSIONS,
  COMPARE_REVISION_LABELS,
  formatCompareCopyBundle,
} from '../runtime/compareInsights.js'
import { shouldShowComparePanel } from '../runtime/compareMode.js'

const truncate = (text = '', max = 160) => {
  const trimmed = (text || '').trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

const copyText = async (text, onCopy, label) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    } catch {
      // silent
    }
  } finally {
    onCopy?.(text, label)
  }
}

const QualityChip = ({ observation }) => {
  if (!observation?.applicable || !observation.mentioned) return null

  let tone = 'bg-slate-100 text-slate-600 border-slate-200'
  let suffix = 'mentioned'
  if (observation.gained && !observation.lost) {
    tone = 'bg-emerald-50 text-emerald-700 border-emerald-100'
    suffix = 'gain'
  } else if (observation.lost && !observation.gained) {
    tone = 'bg-rose-50 text-rose-700 border-rose-100'
    suffix = 'loss'
  } else if (observation.gained && observation.lost) {
    tone = 'bg-amber-50 text-amber-700 border-amber-100'
    suffix = 'mixed'
  }

  return (
    <span className={`px-2 py-1 rounded-full border text-[11px] font-bold ${tone}`}>
      {observation.label} · {suffix}
    </span>
  )
}

const JoeFlagChip = ({ label, active, positive = false }) => (
  <span
    aria-label={`${label}: ${active ? 'on' : 'off'}`}
    title={`${label}: ${active ? 'on' : 'off'}`}
    className={`px-2 py-1 rounded-full border text-[11px] font-bold ${
      active
        ? positive
          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
          : 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-slate-100 text-slate-400 border-slate-200'
    }`}
  >
    {label}
  </span>
)

const RevisionLabelChip = ({ label, active, suggested, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle?.(label)}
    className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors ${
      active
        ? 'bg-slate-800 text-white border-slate-800'
        : suggested
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'
    }`}
  >
    {label}
  </button>
)

const SummaryBlock = ({ title, value, empty = '-' }) => (
  <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">{value || empty}</p>
  </div>
)

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
)

const CompareModePanel = ({
  enabled,
  entries = [],
  collapsed = false,
  onToggleCollapse,
  onCopy,
  onToggleLabel,
}) => {
  if (!shouldShowComparePanel({ enabled, entries })) return null

  const latest = entries[entries.length - 1]
  const {
    agentId,
    compareKey,
    userText,
    baselineReply,
    currentReply,
    outerGuide,
    summary = {},
    compareSummary = {},
    qualityObservations = {},
    joeObservationFlags = {},
    revisionLabels = [],
    suggestedRevisionLabels = [],
  } = latest || {}

  const handleCopy = async (text, label) => {
    await copyText(text, onCopy, label)
  }

  const handleCopyBundle = async () => {
    await copyText(formatCompareCopyBundle(latest), onCopy, 'bundle')
  }

  const gainedText = compareSummary.gained?.join(', ')
  const lostText = compareSummary.lost?.join(', ')

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
              {revisionLabels.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
                  labels {revisionLabels.length}
                </span>
              )}
            </div>
            {userText && <p className="text-[11px] font-medium text-slate-500 truncate">{truncate(userText, 140)}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Compare bundle をコピー"
              title="bundle をコピー"
              onClick={handleCopyBundle}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/70 transition-colors"
            >
              <Copy size={16} />
            </button>
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
        </div>

        {!collapsed && (
          <>
            <div className="px-4 sm:px-6 pb-4">
              <div className="rounded-2xl border border-indigo-100 bg-white/60 px-4 py-3.5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Compare summary</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <SummaryBlock title="Current gained" value={gainedText} />
                  <SummaryBlock title="Current lost" value={lostText} />
                  <SummaryBlock title="Guide hint" value={compareSummary.hint} />
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Quality frame</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COMPARE_QUALITY_DIMENSIONS.map((dimension) => (
                      <QualityChip key={dimension.key} observation={qualityObservations[dimension.key]} />
                    ))}
                  </div>
                </div>

                {joeObservationFlags?.applicable && (
                  <div className="mt-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Joe watch</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <JoeFlagChip label="focus present" active={joeObservationFlags.joeFocusStrength} positive />
                      <JoeFlagChip label="grounded" active={joeObservationFlags.joeGrounding} positive />
                      <JoeFlagChip label="over-softened" active={joeObservationFlags.joeOverSoftened} />
                      <JoeFlagChip label="too explanatory" active={joeObservationFlags.joeTooExplanatory} />
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Tags size={12} />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em]">Revision labels</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {COMPARE_REVISION_LABELS.map((label) => (
                      <RevisionLabelChip
                        key={label}
                        label={label}
                        active={revisionLabels.includes(label)}
                        suggested={suggestedRevisionLabels.includes(label)}
                        onToggle={() => onToggleLabel?.(compareKey, label)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 pb-5">
              <Section title="Baseline" text={baselineReply} onCopy={(text) => handleCopy(text, 'baseline')} />
              <Section title="Current" text={currentReply} onCopy={(text) => handleCopy(text, 'current')} />
              <Section title="Outer Guide" text={outerGuide} onCopy={(text) => handleCopy(text, 'outer')} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CompareModePanel
