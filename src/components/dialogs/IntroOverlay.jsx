import React, { useEffect, useRef } from 'react';
import { Users, ChevronRight, Feather, Heart, Compass } from 'lucide-react';
import { useT } from '../../i18n';

/**
 * 初回画面オーバーレイ。
 * - 「導かない。照らすだけ。歩くのは、あなた自身。」を主役のまま。
 * - その下に、何をするアプリかが一瞬で分かる「3 ステップ」を控えめに添える。
 * - CTA は押しつけず、静かに入る導線として置く。
 * - Escape でも開始できる。
 *
 * モックアップに寄せ、外枠カードは置かず、白く澄んだ背景に要素を浮かべる。
 */
const IntroOverlay = ({ visible, isHomeReady, hasBlockingConfigIssue, onStart }) => {
  const startBtnRef = useRef(null);
  const t = useT();

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
      className={`fixed inset-0 z-[100] flex flex-col items-center px-4 sm:px-6 safe-bottom safe-top overflow-y-auto overflow-x-hidden transition-opacity duration-500 ${
        isHomeReady ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 lake-bg z-0" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-top z-0" aria-hidden="true" />
      <div className="water-shimmer z-0" aria-hidden="true" />
      <div className="mesh-grid z-0" aria-hidden="true" />
      <div className="grain-overlay z-0" aria-hidden="true" />

      <div
        className="max-w-sm w-full min-w-0 text-center px-2 my-auto relative z-10 flex flex-col items-center anim-card-rise overflow-x-hidden"
        style={{
          gap: 'clamp(0.85rem, 3vh, 1.6rem)',
          paddingTop: 'clamp(1rem, 4vh, 2.25rem)',
          paddingBottom: 'clamp(1rem, 4vh, 2.25rem)',
        }}
      >
        {/* アイコン — 白い霧ガラスのタイルに、濃紺のラインアイコン */}
        <div className="anim-scale-in max-w-full">
          <div
            className="icon-tile anim-float"
            style={{ width: 'clamp(4.25rem, 11vh, 5.5rem)', height: 'clamp(4.25rem, 11vh, 5.5rem)' }}
          >
            <Users size={32} strokeWidth={1.75} aria-hidden="true" />
          </div>
        </div>

        {/* タイトルブロック — アイコンとの一体感を高める */}
        <div className="space-y-1.5 max-w-full min-w-0">
          <p className="typo-label-small uppercase pl-[0.32em]">
            {t('app.tagline')}
          </p>
          <h1
            id="intro-title"
            className="title-ink leading-tight font-black tracking-tighter max-w-full"
            style={{ fontSize: 'clamp(2.1rem, 5.5vh, 2.8rem)' }}
          >
            {t('app.name')}
          </h1>
          <p className="typo-body-secondary font-semibold tracking-wide leading-relaxed">
            {hasBlockingConfigIssue ? t('intro.subtitle.config') : t('intro.subtitle.default')}
          </p>
        </div>

        {/* キャッチコピーカード — 霧を閉じ込めたガラスに、明朝で静かに置く */}
        <div
          className="keyline-card px-6 flex justify-center items-center w-full min-w-0 max-w-full overflow-hidden"
          style={{ paddingTop: 'clamp(1.15rem, 3.4vh, 1.9rem)', paddingBottom: 'clamp(1.15rem, 3.4vh, 1.9rem)' }}
        >
          <span className="glass-bloom" aria-hidden="true" />
          <span className="glass-flecks" aria-hidden="true" />
          <p
            className="jk-serif typo-body relative z-[1] font-medium tracking-[0.05em] text-center max-w-full"
            style={{ fontSize: 'clamp(1.02rem, 2.5vh, 1.2rem)' }}
          >
            {t('intro.keyline.line1')}
            <br />
            {t('intro.keyline.line2')}
          </p>
        </div>

        {/* 3 ステップ — 横並びでコンパクトに（2＋1 で折り返す） */}
        <ol className="w-full min-w-0 max-w-full flex flex-wrap items-center justify-center gap-2" aria-label="使い方の流れ">
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">1</span>
            <Feather size={12} className="text-slate-500" aria-hidden="true" />
            <span>{t('intro.step.write')}</span>
          </li>
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">2</span>
            <Heart size={12} className="text-slate-500" aria-hidden="true" />
            <span>{t('intro.step.summon')}</span>
          </li>
          <li className="intro-step">
            <span className="intro-step__num" aria-hidden="true">3</span>
            <Compass size={12} className="text-slate-500" aria-hidden="true" />
            <span>{t('intro.step.mirror')}</span>
          </li>
        </ol>

        {/* CTA — セーフエリアを意識して十分な下余白 */}
        <button
          ref={startBtnRef}
          type="button"
          onClick={onStart}
          className="cta-primary-surface w-full max-w-full py-4 rounded-[1.6rem] font-black text-[0.95rem] tracking-wide active:scale-95 flex items-center justify-center gap-2"
        >
          {hasBlockingConfigIssue ? t('intro.cta.config') : t('intro.cta.start')}
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        {hasBlockingConfigIssue && (
          <p className="typo-helper-muted font-medium leading-relaxed text-center w-full max-w-full">
            {t('intro.config.note')}
          </p>
        )}
      </div>
    </div>
  );
};

export default IntroOverlay;
