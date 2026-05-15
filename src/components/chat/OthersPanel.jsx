import React from 'react';
import { X } from 'lucide-react';
import { getStancePillClass } from '../agents/agentTheme';

/**
 * OTHERS パネル: 一気に全エージェントの反応を眺める表示。
 * 本文の流れを邪魔しないよう、メッセージの下に静かに展開される。
 */
const OthersPanel = ({
  reactions,
  agents,
  isLoading,
  isDebugVisible,
  isCompareModeEnabled,
  onClose,
}) => {
  const entries = reactions ? Object.entries(reactions) : [];

  return (
    <div
      className="mt-4 p-4 rounded-[1.75rem] panel-surface flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg border border-indigo-100/40 w-full min-h-[80px] relative"
      role="region"
      aria-label="他のエージェントの声"
    >
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest">
            Others
          </span>
          {isDebugVisible && reactions && (
            <span className="text-[8px] text-slate-400 opacity-70 font-mono">
              ({entries.length} voices)
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Othersを閉じる"
          title="閉じる"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:bg-white/50 rounded-full p-1 jk-no-min-tap"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 flex flex-col items-center justify-center opacity-70" role="status" aria-live="polite">
          <div className="flex gap-1.5 mb-2">
            <div className="thinking-dot" style={{ width: '6px', height: '6px' }} aria-hidden="true" />
            <div className="thinking-dot" style={{ width: '6px', height: '6px' }} aria-hidden="true" />
            <div className="thinking-dot" style={{ width: '6px', height: '6px' }} aria-hidden="true" />
          </div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            Gathering thoughts…
          </p>
        </div>
      ) : entries.length > 0 ? (
        entries.map(([rId, data]) => {
          const rAgent = agents.find((a) => a.id === rId);
          if (!rAgent) return null;
          return (
            <div
              key={rId}
              className="flex gap-3 items-start bg-white/60 p-3 rounded-xl border border-white/80 animate-in fade-in"
            >
              <div
                className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${rAgent.color} ${rAgent.accentColor} border ${rAgent.borderColor}`}
              >
                {rAgent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black text-slate-700">{rAgent.name}</span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-white/80 text-slate-500 rounded italic font-bold">
                    {data.posture}
                  </span>
                  <span className={getStancePillClass(data.stance)}>{data.stance}</span>
                </div>
                <p className="text-[12px] font-medium text-slate-600 leading-relaxed jk-prose">
                  「{data.comment}」
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="py-4 flex flex-col items-center justify-center opacity-70">
          <p className="text-[11px] text-slate-400 italic">
            {isCompareModeEnabled ? 'まだ比較対象がありません' : '他の声はまだありません'}
          </p>
        </div>
      )}
    </div>
  );
};

export default OthersPanel;
