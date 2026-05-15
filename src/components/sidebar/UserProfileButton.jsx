import React from 'react';
import { UserCircle2, Edit3 } from 'lucide-react';

/**
 * サイドバーの「あなた」プロフィール部分。
 * クライアントネームを表示し、タップで名前編集モーダルを開く。
 */
const UserProfileButton = ({ userName, onEdit }) => (
  <button
    type="button"
    onClick={onEdit}
    aria-label={`お名前を編集: 現在 ${userName}`}
    className="group flex items-center gap-4 w-full p-4 mb-8 rounded-[1.75rem] panel-surface hover:-translate-y-0.5 transition-all text-left"
  >
    <div className="w-10 h-10 rounded-full bg-white/55 border border-white/70 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
      <UserCircle2 size={20} aria-hidden="true" />
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Client</p>
      <p className="font-bold truncate text-xs">{userName}</p>
    </div>
    <Edit3 size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" aria-hidden="true" />
  </button>
);

export default UserProfileButton;
