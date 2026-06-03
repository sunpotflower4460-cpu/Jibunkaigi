import React, { useRef } from 'react';
import { useT } from '../../i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * クライアント名 (お名前) を編集するモーダル。
 * - Escape で閉じる
 * - Enter で確定
 * - 開いた直後にフォーカスが input に当たる
 */
const UserNameDialog = ({ open, tempName, onChange, onConfirm, onCancel }) => {
  const t = useT();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useFocusTrap(open, containerRef, { onEscape: onCancel, initialFocusRef: inputRef });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[150] flex items-center justify-center p-4 sm:p-6 safe-bottom safe-top overflow-y-auto"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-name-dialog-title"
        className="modal-shell rounded-[2.5rem] w-full max-w-sm p-6 sm:p-10 text-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="user-name-dialog-title" className="text-lg font-black mb-3">
          {t('dialog.name.title')}
        </h3>
        <p className="text-xs font-medium text-slate-500 mb-6">
          {t('dialog.name.desc')}
        </p>
        <input
          ref={inputRef}
          aria-labelledby="user-name-dialog-title"
          aria-describedby="user-name-dialog-help"
          maxLength={24}
          value={tempName}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm();
          }}
          className="w-full p-4 rounded-2xl text-center font-bold text-xl outline-none mb-3 neu-concave bg-transparent"
        />
        <p id="user-name-dialog-help" className="text-[11px] font-bold text-slate-400 mb-8">
          {t('dialog.name.maxLength')}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="action-primary w-full py-4 text-white rounded-2xl font-black text-xs"
          >
            {t('dialog.name.apply')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-4 text-slate-500 font-black text-xs hover:bg-white/50 rounded-2xl transition-all"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNameDialog;
