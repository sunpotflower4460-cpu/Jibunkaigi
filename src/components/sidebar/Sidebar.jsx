import React from 'react';
import { Users, Plus, Info, Languages } from 'lucide-react';
import UserProfileButton from './UserProfileButton';
import SessionList from './SessionList';
import { useT, useLang } from '../../i18n';

/**
 * サイドバー全体。モバイルでは overlay、デスクトップでは固定。
 * ロゴ部分は「内なる会議 / じぶん会議」を縦に並べ、タップで beliefs ダイアログを開く。
 */
const Sidebar = ({
  isOpen,
  onClose,
  userName,
  onOpenUserName,
  onOpenBeliefs,
  onNewSession,
  sessions,
  currentSessionId,
  editingSessionId,
  editSessionTitle,
  onSelectSession,
  onStartEdit,
  onChangeEditTitle,
  onCommitEditTitle,
  onTogglePin,
  onRequestDelete,
}) => {
  const t = useT();
  const { lang, toggleLang } = useLang();
  return (
  <>
    {isOpen && (
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[60] md:hidden"
      />
    )}
    <aside
      aria-label={t('sidebar.sessions.aria')}
      className={`sidebar-shell fixed md:relative inset-y-0 left-0 w-72 z-[70] transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="flex-1 flex flex-col p-6 overflow-hidden safe-top">
        <button
          type="button"
          onClick={onOpenBeliefs}
          aria-label={t('sidebar.members.aria')}
          className="flex items-center gap-3 mb-10 px-2 cursor-pointer text-left rounded-2xl"
        >
          <div className="icon-tile w-11 h-11 rounded-2xl text-slate-800">
            <Users size={19} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-black tracking-[0.12em] text-slate-400">
              {t('app.subtitleInner')}
            </span>
            <h1 className="title-ink text-lg font-black tracking-tighter">{t('app.name')}</h1>
          </div>
        </button>

        <UserProfileButton userName={userName} onEdit={onOpenUserName} />

        <button
          type="button"
          onClick={onNewSession}
          aria-label={t('sidebar.newQuestion.aria')}
          className="action-primary flex items-center justify-center gap-2 w-full py-4 text-white rounded-[1.5rem] font-bold text-xs mb-6 shrink-0"
        >
          <Plus size={16} aria-hidden="true" /> {t('sidebar.newQuestion')}
        </button>

        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          editingSessionId={editingSessionId}
          editSessionTitle={editSessionTitle}
          onSelectSession={onSelectSession}
          onStartEdit={onStartEdit}
          onChangeEditTitle={onChangeEditTitle}
          onCommitEditTitle={onCommitEditTitle}
          onTogglePin={onTogglePin}
          onRequestDelete={onRequestDelete}
        />

        <div className="mt-4 pt-4 border-t border-slate-300/30 shrink-0 space-y-1">
          <button
            type="button"
            onClick={onOpenBeliefs}
            className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-xl hover:bg-white/30"
          >
            <Info size={14} className="text-slate-400" aria-hidden="true" />
            {t('sidebar.agentRoles')}
          </button>
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('lang.toggleLabel')}
            className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-xl hover:bg-white/30"
          >
            <Languages size={14} className="text-slate-400" aria-hidden="true" />
            <span>{lang === 'ja' ? '日本語' : 'English'}</span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <span className="text-slate-400">{lang === 'ja' ? 'English' : '日本語'}</span>
          </button>
        </div>
      </div>
    </aside>
  </>
  );
};

export default Sidebar;
