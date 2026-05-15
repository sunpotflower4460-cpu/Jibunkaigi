import React from 'react';
import { Users, Plus, Info } from 'lucide-react';
import UserProfileButton from './UserProfileButton';
import SessionList from './SessionList';

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
}) => (
  <>
    {isOpen && (
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[60] md:hidden"
      />
    )}
    <aside
      aria-label="セッション一覧"
      className={`sidebar-shell fixed md:relative inset-y-0 left-0 w-72 z-[70] transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="flex-1 flex flex-col p-6 overflow-hidden safe-top">
        <button
          type="button"
          onClick={onOpenBeliefs}
          aria-label="会議メンバーの魂を見る"
          className="flex items-center gap-3 mb-10 px-2 cursor-pointer text-left rounded-2xl"
        >
          <div className="p-2.5 rounded-2xl bg-[#1e293b] text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
            <Users size={18} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-black tracking-[0.12em] text-slate-400">
              内なる会議
            </span>
            <h1 className="text-lg font-black tracking-tighter text-slate-800">じぶん会議</h1>
          </div>
        </button>

        <UserProfileButton userName={userName} onEdit={onOpenUserName} />

        <button
          type="button"
          onClick={onNewSession}
          aria-label="新しい問いを始める"
          className="action-primary flex items-center justify-center gap-2 w-full py-4 text-white rounded-2xl font-bold text-xs mb-6 shrink-0"
        >
          <Plus size={16} aria-hidden="true" /> 新しい問い
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

        <div className="mt-4 pt-4 border-t border-slate-300/30 shrink-0">
          <button
            type="button"
            onClick={onOpenBeliefs}
            className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors w-full p-2 rounded-xl hover:bg-white/30"
          >
            <Info size={14} className="text-slate-400" aria-hidden="true" />
            エージェントの役割
          </button>
        </div>
      </div>
    </aside>
  </>
);

export default Sidebar;
