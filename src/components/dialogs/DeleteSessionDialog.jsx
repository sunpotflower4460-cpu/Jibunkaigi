import React, { useEffect, useRef } from 'react';
import { useT } from '../../i18n';

/**
 * セッション削除の確認モーダル。
 * - Escape で閉じる
 * - 開いた直後にキャンセルへフォーカス（誤操作防止）
 */
const DeleteSessionDialog = ({ open, isDeleting, onConfirm, onCancel }) => {
  const t = useT();
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(() => cancelBtnRef.current?.focus(), 40);
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isDeleting) onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, isDeleting, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[150] flex items-center justify-center p-4 sm:p-6 safe-bottom safe-top overflow-y-auto"
      onClick={() => !isDeleting && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-session-dialog-title"
        className="modal-shell rounded-[2.5rem] w-full max-w-sm p-6 sm:p-10 text-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="delete-session-dialog-title" className="text-lg font-black mb-3">
          {t('dialog.delete.title')}
        </h3>
        <p className="text-xs font-medium text-slate-500 mb-8">
          {t('dialog.delete.desc')}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs disabled:opacity-50"
          >
            {t('dialog.delete.confirm')}
          </button>
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full py-4 text-slate-500 font-black text-xs hover:bg-white/50 rounded-2xl transition-all"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSessionDialog;
