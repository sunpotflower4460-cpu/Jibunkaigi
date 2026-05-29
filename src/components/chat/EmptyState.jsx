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
  <div className="h-full flex flex-col items-center justify-center py-12 sm:py-16 animate-in fade-in duration-1000">
    <section className="w-full max-w-md px-2 text-center">
      <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-slate-600 mx-auto mb-6 bg-white/78 border border-white/85 shadow-[0_12px_34px_rgba(99,102,241,0.12)]">
        <Feather size={27} aria-hidden="true" />
      </div>
      <h3 className="text-[1.78rem] leading-[1.45] font-semibold tracking-tight text-slate-800 [font-family:'Hiragino_Mincho_ProN','Yu_Mincho',serif]">
        <span className="block">まずは、ひとつ</span>
        <span className="block">置いてみる。</span>
      </h3>
      <p className="text-sm text-slate-500 mt-4 font-medium leading-relaxed">
        まだ言葉になっていなくても、大丈夫です。
      </p>
    </section>

    <div className="flex flex-col gap-3 w-full max-w-md px-2 mt-8">
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
