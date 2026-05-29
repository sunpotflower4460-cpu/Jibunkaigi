import React, { useEffect, useRef } from 'react';
import { Users, ChevronRight, Feather, Heart, Compass } from 'lucide-react';

/**
 * 初回画面オーバーレイ。
 * - 「導かない。照らすだけ。歩くのは、あなた自身。」を主役のまま。
 * - その下に、何をするアプリかが一瞬で分かる「3 ステップ」を控えめに添える。
 * - CTA は押しつけず、静かに入る導線として置く。
 * - Escape でも開始できる。
 */
const IntroOverlay = ({ visible, isHomeReady, hasBlockingConfigIssue, onStart }) => {
  const startBtnRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    // 開いた直後にフォーカスを CTA に移す（キーボード操作対応）
    const t = window.setTimeout(() => startBtnRef.current?.focus(), 220);
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStart();
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== startBtnRef.current) {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', handleKey);
    };
  }, [visible, onStart]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 safe-bottom safe-top overflow-y-auto transition-opacity duration-500 ${
        isHomeReady ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-[#eef2f7] z-0" />
      <div className="water-shimmer z-0" aria-hidden="true" />
      <div className="mesh-grid z-0" aria-hidden="true" />

      <div className="max-w-[27rem] w-full text-center px-2 sm:px-3 py-6 sm:py-8 relative z-10 space-y-5 sm:space-y-6 anim-card-rise">
        {/* アイコン */}
        <div className="anim-scale-in">
          <div className="inline-flex items-center justify-center p-4 rounded-[1.75rem] bg-white/80 border border-white/90 text-slate-700 anim-float shadow-[0_14px_34px_rgba(99,102,241,0.14)]">
            <Users size={30} aria-hidden="true" />
          </div>
        </div>

        <div className="hero-panel rounded-[2rem] px-5 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-5 text-center">
          {/* タイトルブロック — CTA と同じ面でまとめて視線を安定させる */}
          <div className="space-y-2.5">
            <h1
              id="intro-title"
              className="text-[2.1rem] sm:text-[2.35rem] leading-tight font-semibold tracking-tight text-slate-800 [font-family:'Hiragino_Mincho_ProN','Yu_Mincho',serif]"
            >
              じぶん会議
            </h1>
            <p className="text-[0.8rem] font-bold text-slate-500 tracking-[0.14em]">
              {hasBlockingConfigIssue ? '設定を確認して、会議の準備を整える' : '5つの視点で、じぶんに潜る'}
            </p>
          </div>

          {/* キャッチコピーカード */}
          <div className="py-[1.125rem] px-4 sm:px-5 rounded-[1.5rem] bg-white/58 border border-white/80 flex justify-center items-center w-full shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <p className="text-[0.95rem] sm:text-base font-medium text-slate-700 leading-[1.95] tracking-[0.06em] text-center">
              導かない。照らすだけ。
              <br />
              歩くのは、あなた自身。
            </p>
          </div>

          {/* 3 ステップ */}
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label="使い方の流れ">
            <li className="intro-step justify-center sm:justify-start min-h-[2.75rem]">
              <span className="intro-step__num" aria-hidden="true">1</span>
              <Feather size={11} className="text-slate-500" aria-hidden="true" />
              <span>問いを書く</span>
            </li>
            <li className="intro-step justify-center sm:justify-start min-h-[2.75rem]">
              <span className="intro-step__num" aria-hidden="true">2</span>
              <Heart size={11} className="text-slate-500" aria-hidden="true" />
              <span>視点を呼ぶ</span>
            </li>
            <li className="intro-step justify-center sm:justify-start min-h-[2.75rem]">
              <span className="intro-step__num" aria-hidden="true">3</span>
              <Compass size={11} className="text-slate-500" aria-hidden="true" />
              <span>心の鏡で映す</span>
            </li>
          </ol>

          {/* CTA — 面の中で余白を揃えて重心を整える */}
          <button
            ref={startBtnRef}
            type="button"
            onClick={onStart}
            className="w-full min-h-12 py-3.5 rounded-2xl border border-white/80 bg-white/78 text-slate-700 shadow-[0_14px_30px_rgba(99,102,241,0.13)] font-bold text-sm active:scale-95 flex items-center justify-center gap-2 backdrop-blur-[18px]"
          >
            {hasBlockingConfigIssue ? '設定を確認する' : '静かに始める'}
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          {hasBlockingConfigIssue && (
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              まずは不足している設定を確認できる画面へ進みます。
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntroOverlay;
