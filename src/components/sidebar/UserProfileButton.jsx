import React from 'react';
import { UserCircle2, Edit3 } from 'lucide-react';
import { useT } from '../../i18n';

/**
 * サイドバーの「あなた」プロフィール部分。
 * クライアントネームを表示し、タップで名前編集モーダルを開く。
 */
const UserProfileButton = ({ userName, onEdit }) => {
  const t = useT();
  return (
  <button
    type="button"
    onClick={onEdit}
    aria-label={t('profile.edit.aria', { name: userName })}
    className="group flex items-center gap-4 w-full p-4 mb-8 rounded-[1.75rem] panel-surface hover:-translate-y-0.5 transition-all text-left"
  >
    <div className="icon-tile icon-tile--round w-10 h-10 text-slate-400 shrink-0">
      <UserCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('profile.client')}</p>
      <p className="font-bold truncate text-[0.82rem] text-slate-800 mt-0.5">{userName}</p>
    </div>
    <div className="flex items-center text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0">
      <Edit3 size={13} aria-hidden="true" />
    </div>
  </button>
  );
};

export default UserProfileButton;
