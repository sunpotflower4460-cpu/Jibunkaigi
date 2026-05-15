import React from 'react';
import { Edit3, Pin, Trash2, Feather } from 'lucide-react';

/**
 * セッション一覧。ピン留め・タイトル編集・削除を提供する。
 * デスクトップでは hover で操作 icon を出し、モバイルでは常に表示する。
 */
const SessionList = ({
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
  if (sessions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="mt-2 mx-1 px-4 py-5 rounded-[1.5rem] bg-white/30 border border-white/40 text-center">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-white/60 text-slate-400 mb-3">
            <Feather size={16} aria-hidden="true" />
          </div>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            まだ保存された問いはありません。
          </p>
          <p className="text-[11px] font-medium text-slate-400 mt-1 leading-relaxed">
            最初の問いが、ここに残ります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 relative" role="list" aria-label="過去のセッション">
      {sessions.map((s) => {
        const isActive = currentSessionId === s.id;
        const isEditing = editingSessionId === s.id;
        return (
          <div
            key={s.id}
            role="listitem"
            onClick={() => !isEditing && onSelectSession(s.id)}
            onKeyDown={(e) => {
              if (isEditing) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectSession(s.id);
              }
            }}
            tabIndex={isEditing ? -1 : 0}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex flex-col px-4 py-3 rounded-[1.35rem] cursor-pointer transition-all border ${
              isActive ? 'session-card-active text-indigo-700' : 'session-card-idle text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                {s.isPinned && (
                  <Pin size={10} className="text-amber-500 shrink-0 fill-amber-500" aria-label="ピン留め中" />
                )}
                {isEditing ? (
                  <input
                    autoFocus
                    aria-label="セッションタイトル"
                    className="flex-1 bg-white border border-indigo-200 rounded px-1 py-0.5 text-xs font-bold outline-none"
                    value={editSessionTitle}
                    onChange={(e) => onChangeEditTitle(e.target.value)}
                    onBlur={() => onCommitEditTitle(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                      if (e.key === 'Escape') {
                        onChangeEditTitle(s.title || '');
                        e.target.blur();
                      }
                    }}
                  />
                ) : (
                  <span className="text-xs font-bold truncate">{s.title || '無題'}</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  aria-label="タイトルを編集"
                  title="タイトルを編集"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(s.id, s.title || '');
                  }}
                  className="p-2 -m-1 rounded-lg hover:text-indigo-600 hover:bg-white/40 jk-no-min-tap inline-flex items-center justify-center"
                >
                  <Edit3 size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={s.isPinned ? 'ピン留めを外す' : 'ピン留めする'}
                  title={s.isPinned ? 'ピン留めを外す' : 'ピン留めする'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(s);
                  }}
                  className={`p-2 -m-1 rounded-lg hover:bg-white/40 jk-no-min-tap inline-flex items-center justify-center ${s.isPinned ? 'text-amber-500' : 'hover:text-amber-500'}`}
                >
                  <Pin size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="セッションを削除"
                  title="セッションを削除"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDelete(s.id);
                  }}
                  className="p-2 -m-1 rounded-lg hover:text-rose-500 hover:bg-white/40 jk-no-min-tap inline-flex items-center justify-center"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionList;
