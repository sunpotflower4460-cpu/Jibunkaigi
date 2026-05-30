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

  const textareaPaddingClass = disabled ? 'pr-5' : 'pr-14';

  return (
    <div className="flex gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 w-full items-end">
      <div className="flex-1 min-w-0">
        <p
          id="composer-helper-text"
          className="typo-helper-muted mb-1.5 px-1 font-bold"
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
            className={`w-full rounded-[1.75rem] px-5 py-4 ${textareaPaddingClass} text-base font-medium outline-none resize-none transition-all bg-transparent placeholder:text-[15px] sm:placeholder:text-base placeholder:text-slate-400/80 disabled:opacity-60 disabled:cursor-not-allowed jk-prose`}
          />
          {!disabled && (
            <button
              type="button"
              aria-label="メッセージを送信"
              title="メッセージを送信"
              onClick={onSend}
              disabled={!canSend}
              className="cta-primary-surface !absolute right-2.5 bottom-2.5 p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed jk-no-min-tap"
            >
              <Send aria-hidden="true" size={17} />
            </button>
          )}
        </div>
      </div>
      {showCloseButton && (
        <button
          type="button"
          aria-label="入力欄を閉じる"
          title="入力欄を閉じる"
          onClick={onClose}
          className="p-2 mb-2 text-slate-400 hover:text-slate-600 rounded-xl jk-no-min-tap flex-shrink-0"
        >
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

export default Composer;
