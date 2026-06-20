import React, { useEffect, useRef } from 'react';
import { Users, ChevronRight, Feather, Heart, Compass } from 'lucide-react';
import { useT } from '../../i18n';

const IntroOverlay = ({ visible, isHomeReady, hasBlockingConfigIssue, onStart }) => {
  const startBtnRef = useRef(null);
  const t = useT();

  useEffect(() => {
    if (!visible) return undefined;

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
    };
  }, [visible, onStart]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        width: '100%',
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
        opacity: isHomeReady ? 0 : 1,
        transition: 'opacity 500ms ease',
      }}
    >
      <div className="lake-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden="true" />
      <div className="aurora-orb aurora-orb-top" style={{ zIndex: 0 }} aria-hidden="true" />
      <div className="water-shimmer" style={{ zIndex: 0 }} aria-hidden="true" />
      <div className="mesh-grid" style={{ zIndex: 0 }} aria-hidden="true" />
      <div className="grain-overlay" style={{ zIndex: 0 }} aria-hidden="true" />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          boxSizing: 'border-box',
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 'min(86px, 12vh)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 384,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'min(14px, 1.9vh)',
            textAlign: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <div
              className="icon-tile"
              style={{
                width: 'min(72px, 9vh)',
                height: 'min(72px, 9vh)',
              }}
            >
              <Users size={26} strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <p className="typo-label-small uppercase" style={{ paddingLeft: '0.32em', margin: 0, marginBottom: 4 }}>
              {t('app.tagline')}
            </p>
            <h1
              id="intro-title"
              className="title-ink"
              style={{
                margin: 0,
                fontSize: 'min(2.55rem, 4.8vh)',
                lineHeight: 1.14,
                fontWeight: 900,
                letterSpacing: '-0.04em',
              }}
            >
              {t('app.name')}
            </h1>
            <p className="typo-body-secondary" style={{ margin: 0, marginTop: 10, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.6 }}>
              {hasBlockingConfigIssue ? t('intro.subtitle.config') : t('intro.subtitle.default')}
            </p>
          </div>

          <div
            className="keyline-card"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 'min(18px, 2.3vh) 20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span className="glass-bloom" aria-hidden="true" />
            <span className="glass-flecks" aria-hidden="true" />
            <p
              className="jk-serif typo-body"
              style={{
                position: 'relative',
                zIndex: 1,
                margin: 0,
                fontWeight: 500,
                letterSpacing: '0.05em',
                textAlign: 'center',
                fontSize: 'min(1.08rem, 2.35vh)',
                lineHeight: 1.75,
              }}
            >
              {t('intro.keyline.line1')}
              <br />
              {t('intro.keyline.line2')}
            </p>
          </div>

          <ol
            style={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 0,
              margin: 0,
              listStyle: 'none',
            }}
            aria-label="intro steps"
          >
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
            className="cta-primary-surface"
            style={{
              width: '100%',
              minHeight: 58,
              padding: '14px 18px',
              borderRadius: '1.6rem',
              fontWeight: 900,
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {hasBlockingConfigIssue ? t('intro.cta.config') : t('intro.cta.start')}
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          {hasBlockingConfigIssue && (
            <p className="typo-helper-muted" style={{ margin: 0, width: '100%', fontWeight: 600, lineHeight: 1.6, textAlign: 'center' }}>
              {t('intro.config.note')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntroOverlay;
