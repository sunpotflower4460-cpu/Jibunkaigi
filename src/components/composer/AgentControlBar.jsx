import React from 'react';
import { Compass, Sparkles, Feather, X } from 'lucide-react';

/**
 * 「綴る入力欄」のすぐ下に並ぶ、エージェント呼び出しバー。
 * - 心の鏡 (master) は左端に「総括」として静かに置く。
 * - 委ねる (delegate) は特別ボタンとしてグラデを与える。
 * - 5人のエージェントは agent-chip で統一感を持たせる。
 *
 * 横スクロール時の引っかかりを減らすため、外周は overflow-x-auto + scroll-snap。
 * モバイルでも 44px 以上のタップ領域を確保する。
 */
const AgentControlBar = ({
  agents,
  canUseAgents,
  isBusy,
  helperText,
  agentDisabledReason,
  isDebugMode,
  showInput,
  onToggleShowInput,
  onAgentClick,
  onMasterClick,
  onRandomResponse,
}) => {
  const toggleProps = showInput
    ? { onClick: () => onToggleShowInput(false), icon: <X size={14} aria-hidden="true" />, label: '閉じる' }
    : { onClick: () => onToggleShowInput(true), icon: <Feather size={14} aria-hidden="true" />, label: '綴る' };

  return (
    <div
      className="relative flex flex-col animate-in fade-in slide-in-from-bottom-2 w-full gap-2"
      role="group"
      aria-label="会議メンバーの呼び出し"
    >
      <div className="flex items-center w-full">
        <div className="flex-1 flex gap-2 py-2 px-1 overflow-x-auto no-scrollbar items-center w-full" style={{ scrollSnapType: 'x proximity' }}>
          <button
            type="button"
            onClick={onMasterClick}
            disabled={!canUseAgents || isBusy}
            aria-label="心の鏡: ここまでの思考を総括する"
            className="agent-chip mirror-chip shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <Compass size={14} className="text-indigo-300" aria-hidden="true" />
            <div className="flex flex-col min-w-0">
              <span className="agent-chip__name">心の鏡</span>
              <span className="agent-chip__role">思考を総括する</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onRandomResponse}
            disabled={!canUseAgents || isBusy}
            aria-label="委ねる: 場に応じた視点に任せる"
            className="agent-chip delegate-chip shrink-0"
          >
            <Sparkles size={14} aria-hidden="true" />
            <span className="agent-chip__name">委ねる</span>
          </button>

          <div className="w-px h-6 bg-slate-300/60 self-center mx-1 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={toggleProps.onClick}
            aria-label={showInput ? '入力欄を閉じる' : '入力欄を開く'}
            className="agent-chip shrink-0 text-slate-600"
          >
            {toggleProps.icon}
            <span className="agent-chip__name">{toggleProps.label}</span>
          </button>

          {agents.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => onAgentClick(a.id)}
              disabled={!canUseAgents || isBusy}
              aria-label={`${a.name} (${a.role}) を呼び出す`}
              className={`agent-chip shrink-0 ${a.color} ${a.accentColor} ${a.borderColor}`}
            >
              {a.icon}
              <div className="flex flex-col min-w-0">
                <span className="agent-chip__name">{a.name}</span>
                <span className="agent-chip__role">{a.role}</span>
              </div>
            </button>
          ))}
          <div className="w-4 md:w-0 shrink-0" aria-hidden="true" />
        </div>
      </div>
      <p className="px-2 text-[11px] font-bold text-slate-400" aria-live="polite">
        {helperText}
      </p>
      {isDebugMode && agentDisabledReason && (
        <p className="px-2 text-[10px] font-black text-orange-500 font-mono">
          disabled: {agentDisabledReason}
        </p>
      )}
    </div>
  );
};

export default AgentControlBar;
