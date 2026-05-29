import React, { useEffect, useRef } from 'react';
import { Users, ChevronRight, Feather, Heart, Compass } from 'lucide-react';

/**
 * 初回画面オーバーレイ。
 * - 「導かない。照らすだけ。歩くのは、あなた自身。」を主役のまま。
 * - その下に、何をするアプリかが一瞬で分かる「3 ステップ」を控えめに添える。
 * - CTA は1つだけ強く ("会議をはじめる")。
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

      <div className="hero-panel max-w-sm w-full text-center px-6 py-9 sm:px-8 sm:py-11 rounded-[2.5rem] relative z-10 space-y-7 anim-card-rise">
        {/* アイコン — 白い霧ガラスのタイルに、濃紺のラインアイコン */}
        <div className="anim-scale-in">
          <div className="icon-tile w-[5.5rem] h-[5.5rem] anim-float">
            <Users size={34} strokeWidth={1.75} aria-hidden="true" />
          </div>
        </div>

        {/* タイトルブロック — アイコンとの一体感を高める */}
        <div className="space-y-2">
          <p className="text-[9px] font-black tracking-[0.38em] text-slate-400 uppercase pl-[0.38em]">
            Inner Conference Room
          </p>
          <h1 id="intro-title" className="text-[2.45rem] leading-tight font-black tracking-tighter text-slate-900">
            じぶん会議
          </h1>
          <p className="text-[0.82rem] font-bold text-slate-500 tracking-wide">
            {hasBlockingConfigIssue ? '設定を確認して、会議の準備を整える' : '5つの視点で、じぶんに潜る'}
          </p>
        </div>

        {/* キャッチコピーカード — 霧を閉じ込めたガラスに、明朝で静かに置く */}
        <div className="keyline-card py-7 px-5 flex justify-center items-center w-full">
          <span className="glass-flecks" aria-hidden="true" />
          <p className="jk-serif relative z-[1] text-[1.05rem] sm:text-[1.15rem] text-slate-800 leading-[2.1] tracking-[0.04em] text-center">
            導かない。照らすだけ。
            <br />
            歩くのは、あなた自身。
          </p>
        </div>

        {/* 3 ステップ */}
        <ol className="flex flex-wrap items-center justify-center gap-2" aria-label="使い方の流れ">
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">1</span>
            <Feather size={11} className="text-slate-500" aria-hidden="true" />
            <span>問いを書く</span>
          </li>
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">2</span>
            <Heart size={11} className="text-slate-500" aria-hidden="true" />
            <span>視点を呼ぶ</span>
          </li>
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">3</span>
            <Compass size={11} className="text-slate-500" aria-hidden="true" />
            <span>心の鏡で映す</span>
          </li>
        </ol>

        {/* CTA — セーフエリアを意識して十分な下余白 */}
        <button
          ref={startBtnRef}
          type="button"
          onClick={onStart}
          className="action-primary w-full py-4 text-white rounded-[1.6rem] font-black text-[0.95rem] tracking-wide active:scale-95 flex items-center justify-center gap-2 mt-2"
        >
          {hasBlockingConfigIssue ? '設定を確認する' : '会議をはじめる'}
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        {hasBlockingConfigIssue && (
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
            まずは不足している設定を確認できる画面へ進みます。
          </p>
        )}
      </div>
    </div>
  );
};

export default IntroOverlay;
