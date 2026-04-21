import React, { useState } from 'react';

const SurfaceTabView = ({ events }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // RESIDUE/REENTRY段階のイベントを探す
  const residueEvent = events.find(e => e.stage === 'RESIDUE');
  const reentryEvent = events.find(e => e.stage === 'REENTRY');

  if (!residueEvent && !reentryEvent) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>表層データがありません</div>;
  }

  const { surfaceWindow, patternMix } = residueEvent?.payload || {};
  const reentry = reentryEvent?.payload || {};

  // surfaceWindowを表示 (最終3〜4行の素材サマリー)
  const renderSurfaceWindow = () => {
    if (!surfaceWindow) return null;
    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(71,85,105,0.8)',
          padding: 12,
          background: 'rgba(30,41,59,0.72)',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 8, textTransform: 'uppercase' }}>
          🪟 Surface Window
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#e2e8f0',
            lineHeight: 1.6,
            background: 'rgba(15,23,42,0.7)',
            padding: 10,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {typeof surfaceWindow === 'string' ? surfaceWindow : JSON.stringify(surfaceWindow, null, 2)}
        </div>
      </div>
    );
  };

  // patternMixを表示 (選ばれたパターンと重み)
  const renderPatternMix = () => {
    if (!patternMix) return null;
    const patterns = Object.entries(patternMix).filter(([_key, value]) => typeof value === 'number' && value > 0);
    if (patterns.length === 0) return null;

    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(71,85,105,0.8)',
          padding: 12,
          background: 'rgba(30,41,59,0.72)',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 8, textTransform: 'uppercase' }}>
          🎨 Pattern Mix
        </div>
        {patterns.map(([key, value]) => {
          const percent = Math.round(value * 100);
          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 10 }}>
                <span style={{ color: '#cbd5e1' }}>{key}</span>
                <span style={{ color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {percent}%
                </span>
              </div>
              <div style={{ background: 'rgba(51,65,85,1)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                    height: '100%',
                    width: `${percent}%`,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        表層要素（surfaceWindow と patternMix）を表示します。
      </div>

      {renderSurfaceWindow()}
      {renderPatternMix()}

      {/* 生JSONを展開ボタン */}
      <button
        type="button"
        onClick={() => setShowRawJson(!showRawJson)}
        style={{
          border: '1px solid rgba(148,163,184,0.24)',
          background: 'rgba(30,41,59,0.9)',
          color: '#e2e8f0',
          borderRadius: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: 11,
          marginBottom: 10,
        }}
      >
        {showRawJson ? '▼' : '▶'} JSON生データを{showRawJson ? '折りたたむ' : '展開'}
      </button>

      {showRawJson && (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(71,85,105,0.8)',
            padding: 12,
            background: 'rgba(15,23,42,0.82)',
          }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 10,
              color: '#e2e8f0',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {JSON.stringify({ surfaceWindow, patternMix, reentry }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SurfaceTabView;
