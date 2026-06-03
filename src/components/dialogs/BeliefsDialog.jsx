import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * 会議メンバーの「魂」(belief) を一覧表示するモーダル。
 * - Escape で閉じる
 * - 開いた直後に閉じるボタンへフォーカス
 */
const BeliefsDialog = ({ open, agents, onClose }) => {
  const t = useT();
  const closeBtnRef = useRef(null);
  const containerRef = useRef(null);

  useFocusTrap(open, containerRef, { onEscape: onClose, initialFocusRef: closeBtnRef });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/10 backdrop-blur-xl z-[150] flex items-center justify-center p-4 sm:p-6 safe-bottom safe-top"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="beliefs-dialog-title"
        className="modal-shell rounded-[2.5rem] w-full max-w-xl h-[min(82vh,720px)] sm:h-4/5 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-white/10">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-black tracking-[0.32em] text-slate-400 uppercase mb-1">
              {t('beliefs.tagline')}
            </p>
            <h3 id="beliefs-dialog-title" className="text-xl font-black tracking-tight">
              {t('beliefs.title')}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
              {t('beliefs.desc')}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label={t('beliefs.close.aria')}
            title={t('common.close')}
            onClick={onClose}
            className="p-3 hover:bg-white/40 rounded-full inline-flex items-center justify-center"
            style={{ minWidth: 'var(--jk-tap-min)', minHeight: 'var(--jk-tap-min)' }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-6 no-scrollbar space-y-4">
          {agents.map((a) => (
            <div
              key={a.id}
              className={`p-5 sm:p-6 rounded-[1.75rem] ${a.color} ${a.accentColor} panel-surface backdrop-blur-sm`}
            >
              <div className="flex items-center gap-3 mb-3">
                {a.icon}
                <span className="font-black text-xs">{a.name} — {a.title}</span>
              </div>
              <p className="text-xs font-bold leading-relaxed text-slate-600 italic jk-prose">
                {a.belief}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BeliefsDialog;
