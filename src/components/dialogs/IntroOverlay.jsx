import React, { useEffect, useRef } from 'react';
import { Users, ChevronRight, Feather, Heart, Compass } from 'lucide-react';

/**
 * 初回画面オーバーレイ。
 * - 「導かない。照らすだけ。歩くのは、あなた自身。」を主役のまま。
 * - その下に、何をするアプリかが一瞬で分かる「3 ステップ」を控えめに添える。
 * - CTA は1つだけ強く ("会議をはじめる")。
 * - Escape でも開始できる。
 */
const IntroOverlay = ({ visible, isHomeReady, onStart }) => {
  const startBtnRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    // 開いた直後にフォーカスを CTA に移す（キーボード操作対応）
    const t = window.setTimeout(() => startBtnRef.current?.focus(), 220);
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        // CTA にフォーカスがある場合のみ
        if (document.activeElement === startBtnRef.current) return;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', handleKey);
    };
  }, [visible]);

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

      <div className="hero-panel max-w-md w-full text-center p-7 md:p-10 rounded-[2.5rem] relative z-10 space-y-7 anim-card-rise">
        <div className="anim-scale-in">
          <div className="inline-flex items-center justify-center p-5 rounded-[2rem] bg-[#1e293b] text-white anim-float shadow-2xl">
            <Users size={36} aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">
            Inner Conference Room
          </p>
          <h1 id="intro-title" className="text-4xl font-black tracking-tighter text-slate-800">
            じぶん会議
          </h1>
          <p className="text-sm font-bold text-slate-500">5つの視点で、じぶんに潜る</p>
        </div>

        <div className="py-6 px-2 md:p-7 rounded-[2rem] bg-white/30 border border-white/50 shadow-inner flex justify-center items-center w-full">
          <p className="text-base sm:text-lg font-medium text-slate-700 leading-loose tracking-[0.08em] text-center">
            導かない。照らすだけ。
            <br />
            歩くのは、あなた自身。
          </p>
        </div>

        {/* 3 ステップ — 詩と機能説明の中間。説明しすぎない。 */}
        <ol className="flex flex-wrap items-center justify-center gap-2" aria-label="使い方の流れ">
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">1</span>
            <Feather size={12} className="text-slate-500" aria-hidden="true" />
            <span>問いを書く</span>
          </li>
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">2</span>
            <Heart size={12} className="text-slate-500" aria-hidden="true" />
            <span>視点を呼ぶ</span>
          </li>
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">3</span>
            <Compass size={12} className="text-slate-500" aria-hidden="true" />
            <span>心の鏡で映す</span>
          </li>
        </ol>

        <button
          ref={startBtnRef}
          type="button"
          onClick={onStart}
          className="action-primary w-full py-5 text-white rounded-2xl font-black text-sm active:scale-95 flex items-center justify-center gap-2"
        >
          会議をはじめる
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default IntroOverlay;
