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
    <div className="icon-tile w-[5.5rem] h-[5.5rem] text-slate-400 mb-7">
      <Feather size={34} strokeWidth={1.75} aria-hidden="true" />
    </div>
    <h3 className="jk-serif title-ink typo-hero-title mb-3.5 text-center">
      まずは、ひとつ
      <br />
      置いてみる。
    </h3>
    <p className="typo-body-secondary mb-11 text-center font-medium leading-relaxed">
      まだ言葉になっていなくても、大丈夫です。
    </p>
    <div className="flex flex-col gap-4 w-full max-w-sm px-2">
      {HINTS.map((hint, idx) => (
        <button
          type="button"
          key={idx}
          onClick={() => onHintClick(hint)}
          className="hint-card"
          aria-label={`例として入力: ${hint}`}
        >
          <span className="glass-bloom" aria-hidden="true" />
          <span className="glass-flecks" aria-hidden="true" />
          <span className="hint-card__dot" aria-hidden="true" />
          <span className="typo-body-secondary relative z-[1] leading-relaxed">{hint}</span>
        </button>
      ))}
    </div>
  </div>
);

export default EmptyState;
