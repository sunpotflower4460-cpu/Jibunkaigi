import React, { useEffect, useRef } from 'react';
import { Users, ChevronRight, Feather, Heart, Compass } from 'lucide-react';
import { useT } from '../../i18n';

const IntroOverlay = ({ visible, isHomeReady, hasBlockingConfigIssue, onStart }) => {
  const startBtnRef = useRef(null);
  const t = useT();

  useEffect(() => {
    if (!visible) return undefined;

    const root = document.documentElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = root.style.overflow;
    const previousViewportHeight = root.style.getPropertyValue('--intro-viewport-height');

    const syncIntroViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      root.style.setProperty('--intro-viewport-height', `${viewportHeight}px`);
    };

    syncIntroViewportHeight();
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';

    window.visualViewport?.addEventListener('resize', syncIntroViewportHeight);
    window.addEventListener('resize', syncIntroViewportHeight);

    const timer = window.setTimeout(() => {
      const isTouchDevice = window.matchMedia?.('(pointer: coarse)')?.matches;
      if (!isTouchDevice) {
        startBtnRef.current?.focus({ preventScroll: true });
      }
    }, 220);

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onStart();
        return;
      }
      if ((event.key === 'Enter' || event.key === ' ') && document.activeElement !== startBtnRef.current) {
        event.preventDefault();
        onStart();
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
      window.visualViewport?.removeEventListener('resize', syncIntroViewportHeight);
      window.removeEventListener('resize', syncIntroViewportHeight);
      document.body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      if (previousViewportHeight) {
        root.style.setProperty('--intro-viewport-height', previousViewportHeight);
      } else {
        root.style.removeProperty('--intro-viewport-height');
      }
    };
  }, [visible, onStart]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      className={`fixed inset-x-0 top-0 z-[100] flex w-full flex-col items-center overflow-hidden transition-opacity duration-500 ${
        isHomeReady ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ height: 'var(--intro-viewport-height, 100svh)', maxHeight: 'var(--intro-viewport-height, 100svh)' }}
    >
      <div className="absolute inset-0 lake-bg z-0" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-top z-0" aria-hidden="true" />
      <div className="water-shimmer z-0" aria-hidden="true" />
      <div className="mesh-grid z-0" aria-hidden="true" />
      <div className="grain-overlay z-0" aria-hidden="true" />

      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden px-4 py-5 sm:px-6 sm:py-10">
        <div
          className="w-full max-w-sm text-center px-2 flex flex-col items-center anim-card-rise"
          style={{ gap: 'clamp(0.55rem, 2vh, 1.35rem)' }}
        >
          <div className="anim-scale-in shrink-0">
            <div
              className="icon-tile anim-float"
              style={{ width: 'clamp(3.45rem, 9vh, 5.5rem)', height: 'clamp(3.45rem, 9vh, 5.5rem)' }}
            >
              <Users size={28} strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-1 w-full">
            <p className="typo-label-small uppercase pl-[0.32em]">
              {t('app.tagline')}
            </p>
            <h1
              id="intro-title"
              className="title-ink leading-tight font-black tracking-tighter"
              style={{ fontSize: 'clamp(1.85rem, 4.8vh, 2.8rem)' }}
            >
              {t('app.name')}
            </h1>
            <p className="typo-body-secondary font-semibold tracking-wide leading-relaxed">
              {hasBlockingConfigIssue ? t('intro.subtitle.config') : t('intro.subtitle.default')}
            </p>
          </div>

          <div
            className="keyline-card px-5 flex justify-center items-center w-full"
            style={{ paddingTop: 'clamp(0.8rem, 2.4vh, 1.9rem)', paddingBottom: 'clamp(0.8rem, 2.4vh, 1.9rem)' }}
          >
            <span className="glass-bloom" aria-hidden="true" />
            <span className="glass-flecks" aria-hidden="true" />
            <p
              className="jk-serif typo-body relative z-[1] font-medium tracking-[0.05em] text-center"
              style={{ fontSize: 'clamp(0.95rem, 2.15vh, 1.2rem)' }}
            >
              {t('intro.keyline.line1')}
              <br />
              {t('intro.keyline.line2')}
            </p>
          </div>

          <ol className="w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="intro steps">
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

          <button
            ref={startBtnRef}
            type="button"
            onClick={onStart}
            className="cta-primary-surface w-full py-3.5 sm:py-4 rounded-[1.6rem] font-black text-[0.95rem] tracking-wide active:scale-95 flex items-center justify-center gap-2"
          >
            {hasBlockingConfigIssue ? t('intro.cta.config') : t('intro.cta.start')}
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          {hasBlockingConfigIssue && (
            <p className="typo-helper-muted font-medium leading-relaxed text-center w-full">
              {t('intro.config.note')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntroOverlay;
