import React from 'react';
import { Feather } from 'lucide-react';

/**
 * セッション内にメッセージが1件もないときの「空状態」。
 * 「思考の部屋へようこそ」と書きすぎず、3つのヒントだけ静かに置く。
 * ヒントはクリックで入力欄へ反映される。
 */
const HINTS = [
  '言葉にならないけど、ずっと胸にあるもの',
  '誰にも言っていない、小さな違和感',
  '理由はないけど、心が動いたこと',
];

const EmptyState = ({ onHintClick }) => (
  <div className="h-full flex flex-col items-center justify-center py-16 sm:py-20 animate-in fade-in duration-1000">
    <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-slate-400 mb-6 glass-card shadow-xl shadow-indigo-950/5">
      <Feather size={34} aria-hidden="true" />
    </div>
    <h3 className="text-lg font-black text-slate-800 mb-2">思考の部屋へようこそ</h3>
    <p className="text-xs text-slate-500 mb-10 text-center font-medium">
      心の欠片を、自由に置いてみてください。
    </p>
    <div className="flex flex-col gap-3 w-full max-w-sm px-2">
      {HINTS.map((hint, idx) => (
        <button
          type="button"
          key={idx}
          onClick={() => onHintClick(hint)}
          className="hint-card"
          aria-label={`例: ${hint}`}
        >
          <span className="hint-card__dot" aria-hidden="true" />
          <span className="text-xs text-slate-600">{hint}</span>
        </button>
      ))}
    </div>
  </div>
);

export default EmptyState;
