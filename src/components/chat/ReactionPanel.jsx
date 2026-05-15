import React from 'react';
import { getStancePillClass } from '../agents/agentTheme';

/**
 * 単一の OTHERS reaction を、メッセージ本文の下に展開表示する。
 * (1人の声を選択した時の "深掘り表示")
 */
const ReactionPanel = ({ agent, reaction }) => {
  if (!agent || !reaction) return null;
  return (
    <div className="mt-3 w-full p-5 rounded-[1.75rem] panel-surface animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {agent.name}
        </span>
        <span className="px-1.5 py-0.5 bg-white/55 border border-white/70 text-slate-500 text-[8px] font-black rounded italic">
          {reaction.posture}
        </span>
        <span className={getStancePillClass(reaction.stance)}>{reaction.stance}</span>
      </div>
      <p className="text-[13px] font-medium text-slate-600 italic jk-prose">
        「{reaction.comment}」
      </p>
    </div>
  );
};

export default ReactionPanel;
