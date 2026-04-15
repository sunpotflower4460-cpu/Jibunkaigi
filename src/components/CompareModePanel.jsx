import { Copy, Eye, EyeOff, Tags } from 'lucide-react'

import { formatCompareCopyBundle } from '../runtime/compareInsights.js'
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

const QUALITY_STATUS_STYLES = {
  gained: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  lost: 'bg-rose-50 text-rose-700 border-rose-100',
  mixed: 'bg-amber-50 text-amber-700 border-amber-100',
  watch: 'bg-slate-100 text-slate-600 border-slate-200',
  unmentioned: 'bg-white text-slate-400 border-slate-200',
  'n/a': 'bg-slate-50 text-slate-300 border-slate-200',
}

const JOE_EMPHASIS_STYLES = {
  positive: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  watch: 'bg-slate-100 text-slate-600 border-slate-200',
}

const getResponseCardClassName = (emphasis = false) => `flex flex-col gap-2 rounded-2xl border p-3 sm:p-4 shadow-sm ${
  emphasis ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-white/60'
}`

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

const ResponseCard = ({ title, text, emphasis = false, onCopy }) => (
  <div
    aria-label={emphasis ? `${title} response (current candidate)` : `${title} response`}
    className={getResponseCardClassName(emphasis)}
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-wide">{title}</p>
      <button
        type="button"
        aria-label={`${title} をコピー`}
        title={`${title} をコピー`}
        onClick={() => onCopy?.(text)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
      >
        <Copy size={14} />
      </button>
    </div>
    <p className="text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
      {text || '（未生成）'}
    </p>
  </div>
)

const CoachLine = ({ title, value, tone = 'text-slate-700', empty = '-' }) => (
  <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
    <p className={`text-sm font-semibold leading-relaxed ${tone}`}>{value || empty}</p>
  </div>
)

const QualityDimensionChip = ({ dimension }) => (
  <span
    className={`px-2 py-1 rounded-full border text-[11px] font-bold ${QUALITY_STATUS_STYLES[dimension.status] || QUALITY_STATUS_STYLES.watch}`}
    title={`${dimension.label}: ${dimension.status}`}
  >
    {dimension.label} · {dimension.status}
  </span>
)

const JoePriorityChip = ({ priority }) => (
  <span
    className={`px-2 py-1 rounded-full border text-[11px] font-bold ${JOE_EMPHASIS_STYLES[priority.emphasis] || JOE_EMPHASIS_STYLES.watch}`}
    title={`${priority.label}: ${priority.value}`}
  >
    {priority.label} · {priority.value}
  </span>
)

const CompareModePanel = ({
  enabled,
  entries = [],
  collapsed = true,
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
    qualityDimensions = [],
    joeReview = {},
    revisionLabels = [],
    suggestedRevisionLabels = [],
    labels = {},
  } = latest || {}

  const selectedLabels = labels.selected || revisionLabels
  const suggestedLabels = labels.suggested || suggestedRevisionLabels

  const handleCopy = async (text, label) => {
    await copyText(text, onCopy, label)
  }

  const handleCopyBundle = async () => {
    await copyText(formatCompareCopyBundle(latest), onCopy, 'bundle')
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-5xl z-[120]">
      <div className="glass-card rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-200/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Compare Mode (dev)</p>
            <p className="text-[9px] text-slate-500 leading-relaxed mt-0.5">
              Baseline と Current の差を見る開発用パネルです。Outer Guide は得失を短く比較します。ラベルは開発用メモです。
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{agentId || 'unknown'}</span>
              {summary?.mode && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">mode: {summary.mode}</span>}
              {summary?.baselineLength !== undefined && summary?.currentLength !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
                  len {summary.baselineLength} → {summary.currentLength}{summary.currentUsesInternalOS ? ' (OS)' : ''}
                </span>
              )}
              {summary?.sameOpening && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">same opening</span>}
              {selectedLabels.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
                  labels {selectedLabels.length}
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
              aria-label="Compare Mode パネルを閉じる"
              title={collapsed ? "比較を開く" : "閉じる"}
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
                  <SummaryBlock title="Current gained" value={compareSummary.gained?.join(', ')} />
                  <SummaryBlock title="Current lost" value={compareSummary.lost?.join(', ')} />
                  <SummaryBlock title="Guide hint" value={compareSummary.hint} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 px-4 sm:px-6 pb-4">
              <ResponseCard title="Baseline" text={baselineReply} onCopy={(text) => handleCopy(text, 'baseline')} />
              <ResponseCard title="Current" text={currentReply} emphasis onCopy={(text) => handleCopy(text, 'current')} />
            </div>

            <div className="px-4 sm:px-6 pb-4">
              <div className="rounded-2xl border border-slate-200 bg-white/55 px-4 py-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Outer Guide</p>
                  <button
                    type="button"
                    aria-label="Outer Guide をコピー"
                    title="Outer Guide をコピー"
                    onClick={() => handleCopy(outerGuide, 'outer')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <CoachLine title="得たもの" value={compareSummary.gained?.join(', ')} tone="text-emerald-700" />
                  <CoachLine title="失ったもの" value={compareSummary.lost?.join(', ')} tone="text-rose-700" />
                  <CoachLine title="1つの提案" value={compareSummary.hint} tone="text-indigo-700" />
                </div>
                {outerGuide && (
                  <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500 whitespace-pre-wrap break-words">
                    {outerGuide}
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-4">
              <div className="rounded-2xl border border-slate-200 bg-white/55 px-4 py-3.5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Quality frame</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {qualityDimensions
                    .filter((dimension) => dimension.applicable)
                    .map((dimension) => <QualityDimensionChip key={dimension.key} dimension={dimension} />)}
                </div>

                {joeReview?.applicable && (
                  <div className="mt-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Joe watch</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {joeReview.priorities.map((priority) => <JoePriorityChip key={priority.key} priority={priority} />)}
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Tags size={12} />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em]">Revision labels</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(labels.available || []).map((label) => (
                      <RevisionLabelChip
                        key={label}
                        label={label}
                        active={selectedLabels.includes(label)}
                        suggested={suggestedLabels.includes(label)}
                        onToggle={() => onToggleLabel?.(compareKey, label)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CompareModePanel
