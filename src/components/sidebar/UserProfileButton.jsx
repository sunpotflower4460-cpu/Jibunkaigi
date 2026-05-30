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
    className="group flex items-center gap-3.5 w-full p-4 mb-7 rounded-[1.65rem] panel-surface hover:-translate-y-0.5 transition-all text-left"
  >
    <div className="icon-tile icon-tile--round w-10 h-10 text-slate-400 shrink-0">
      <UserCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.18em]">CLIENT</p>
      <p className="font-semibold truncate text-[0.77rem] text-slate-600 mt-0.5">あなた</p>
      <p className="font-semibold truncate text-[0.84rem] text-slate-800 mt-1">{userName}</p>
    </div>
    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0">
      <Edit3 size={13} aria-hidden="true" />
      <span className="text-[10px] font-medium">編集</span>
    </div>
  </button>
);

export default UserProfileButton;
