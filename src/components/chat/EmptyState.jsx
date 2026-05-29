import React from 'react';
import { ChevronRight, Feather } from 'lucide-react';

/**
 * セッション内にメッセージが1件もないときの「空状態」。
 *
 * 説明しすぎず、4つのヒントだけ静かに置く。
 * 「正解」を提示するのではなく、「置いてみる」入口を増やすことが目的。
 * ヒントはクリックで入力欄へ反映される。
 */
const HINTS = [
  '言葉にならないけど、ずっと胸にあるもの',
  '最近、少しだけ引っかかっていること',
  '誰にも言っていない、小さな違和感',
  '今の自分を、少しだけ見てみたい',
];

const EmptyState = ({ onHintClick }) => (
  <div className="h-full flex flex-col items-center justify-center py-10 sm:py-14 animate-in fade-in duration-1000">
    <section className="w-full max-w-md rounded-[2rem] glass-card px-5 py-6 sm:px-6 sm:py-7 text-center">
      <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-slate-500 mx-auto mb-4 bg-white/55 border border-white/60">
        <Feather size={28} aria-hidden="true" />
      </div>
      <p className="text-[10px] font-black tracking-[0.28em] text-slate-400 uppercase mb-2">
        Inner Conference Room
      </p>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">
        まずは、ひとつ置いてみる。
      </h3>
      <p className="text-xs text-slate-500 mt-2 mb-5 font-medium leading-relaxed">
        まだ言葉になっていなくても、大丈夫です。
      </p>
      <button
        type="button"
        onClick={() => onHintClick(HINTS[0])}
        className="action-primary w-full py-3.5 text-white rounded-2xl font-black text-sm active:scale-95 inline-flex items-center justify-center gap-2"
        aria-label="会議をはじめる"
      >
        会議をはじめる
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </section>

    <div className="flex flex-col gap-3 w-full max-w-md px-2 mt-5">
      {HINTS.map((hint, idx) => (
        <button
          type="button"
          key={idx}
          onClick={() => onHintClick(hint)}
          className="hint-card"
          aria-label={`例として入力: ${hint}`}
        >
          <span className="hint-card__dot" aria-hidden="true" />
          <span className="text-xs text-slate-600 leading-relaxed">{hint}</span>
        </button>
      ))}
    </div>
  </div>
);

export default EmptyState;
