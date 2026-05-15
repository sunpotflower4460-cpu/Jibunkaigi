import React, { forwardRef } from 'react';
import { Send, X } from 'lucide-react';

/**
 * 入力欄 (綴る) — 初回は「主役」として、強い影と大きめの角丸で目立たせる。
 * Enter で送信、Shift+Enter で改行。
 * 設定不備時は disabled で、placeholder と helper text が状態を伝える。
 */
const Composer = forwardRef(function Composer(
  {
    userInput,
    onChange,
    onSend,
    onClose,
    disabled,
    canSend,
    placeholder,
    helperText,
    showCloseButton,
    onResize,
  },
  textareaRef,
) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 w-full">
      <div className="flex-1">
        <p
          id="composer-helper-text"
          className="mb-2 px-2 text-[11px] font-bold text-slate-400"
          aria-live="polite"
        >
          {helperText}
        </p>
        <div className="composer-shell relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={userInput}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              onResize?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="相談内容の入力欄"
            aria-describedby="composer-helper-text"
            className="w-full rounded-[1.75rem] px-5 py-5 pr-16 text-base font-medium outline-none resize-none transition-all bg-transparent placeholder:text-slate-400/80 disabled:opacity-60 disabled:cursor-not-allowed jk-prose"
          />
          <button
            type="button"
            aria-label="メッセージを送信"
            title="メッセージを送信"
            onClick={onSend}
            disabled={!canSend}
            className="action-primary absolute right-2.5 top-1/2 -translate-y-1/2 p-3 rounded-2xl text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed jk-no-min-tap"
          >
            <Send aria-hidden="true" size={18} />
          </button>
        </div>
      </div>
      {showCloseButton && (
        <button
          type="button"
          aria-label="入力欄を閉じる"
          title="入力欄を閉じる"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-900 self-center rounded-xl jk-no-min-tap"
        >
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export default Composer;
