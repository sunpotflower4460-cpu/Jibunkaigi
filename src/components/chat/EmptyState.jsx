import React from 'react';
import { Feather } from 'lucide-react';
import { useT } from '../../i18n';

/**
 * セッション内にメッセージが1件もないときの「空状態」。
 *
 * 説明しすぎず、4つのヒントだけ静かに置く。
 * 「正解」を提示するのではなく、「置いてみる」入口を増やすことが目的。
 * ヒントはクリックで入力欄へ反映される（選択言語の文言が入る）。
 */
const HINT_KEYS = ['empty.hint.1', 'empty.hint.2', 'empty.hint.3', 'empty.hint.4'];

const EmptyState = ({ onHintClick }) => {
  const t = useT();
  return (
  <div className="h-full flex flex-col items-center justify-center py-14 sm:py-20 animate-in fade-in duration-1000">
    <div className="icon-tile w-[5.5rem] h-[5.5rem] text-slate-400 mb-7">
      <Feather size={34} strokeWidth={1.75} aria-hidden="true" />
    </div>
    <h3 className="jk-serif title-ink text-[1.8rem] sm:text-[2.1rem] font-bold mb-3.5 tracking-tight leading-[1.4] text-center">
      {t('empty.title.line1')}
      <br />
      {t('empty.title.line2')}
    </h3>
    <p className="text-[0.8rem] text-slate-500 mb-11 text-center font-medium leading-relaxed">
      {t('empty.subtitle')}
    </p>
    <div className="flex flex-col gap-4 w-full max-w-sm px-2">
      {HINT_KEYS.map((key) => {
        const hint = t(key);
        return (
        <button
          type="button"
          key={key}
          onClick={() => onHintClick(hint)}
          className="hint-card"
          aria-label={t('empty.hint.aria', { hint })}
        >
          <span className="glass-bloom" aria-hidden="true" />
          <span className="glass-flecks" aria-hidden="true" />
          <span className="hint-card__dot" aria-hidden="true" />
          <span className="relative z-[1] text-[0.82rem] text-slate-600 leading-relaxed">{hint}</span>
        </button>
        );
      })}
    </div>
  </div>
  );
};

export default EmptyState;
