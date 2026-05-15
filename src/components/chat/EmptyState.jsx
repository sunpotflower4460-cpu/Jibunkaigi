import React from 'react';
import { Feather } from 'lucide-react';

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
  <div className="h-full flex flex-col items-center justify-center py-14 sm:py-20 animate-in fade-in duration-1000">
    <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-slate-400 mb-6 glass-card shadow-xl shadow-indigo-950/5">
      <Feather size={34} aria-hidden="true" />
    </div>
    <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">
      まずは、ひとつ置いてみる。
    </h3>
    <p className="text-xs text-slate-500 mb-10 text-center font-medium leading-relaxed">
      まだ言葉になっていなくても、大丈夫です。
    </p>
    <div className="flex flex-col gap-3 w-full max-w-sm px-2">
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
