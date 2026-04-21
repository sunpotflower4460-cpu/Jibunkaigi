import React, { useState } from 'react';

const AfterglowTabView = ({ events }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // AFTERGLOW_SAVE段階のイベントを探す
  const afterglowEvent = events.find(e => e.stage === 'AFTERGLOW_SAVE');
  // RESIDUEイベントからpatternMixとsurfaceWindowを取得
  const residueEvent = events.find(e => e.stage === 'RESIDUE');

  if (!afterglowEvent && !residueEvent) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>余韻データがありません</div>;
  }

  const afterglow = afterglowEvent?.payload || {};
  const { patternMix, surfaceWindow } = residueEvent?.payload || {};

  // ブレンド率（15〜30%）- 固定値で表示
  const blendPercent = 20;

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        次ターンへ持ち越される latentState と patternMix を表示します。
      </div>

      {/* ブレンド率 */}
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(139,92,246,0.5)',
          background: 'rgba(139,92,246,0.1)',
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, color: '#a78bfa', lineHeight: 1.6 }}>
          💫 次ターンで約 <strong>{blendPercent}%</strong> ブレンドされる予定です。
        </div>
      </div>

      {/* 保存される latentState */}
      {afterglow.latentState && (
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
            🧠 Latent State (Saved)
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            {Object.keys(afterglow.latentState).length} keys saved
          </div>
        </div>
      )}

      {/* 保存される patternMix */}
      {patternMix && (
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
            🎨 Pattern Mix (Saved)
          </div>
          {Object.entries(patternMix)
            .filter(([_key, value]) => typeof value === 'number' && value > 0)
            .map(([key, value]) => {
              const percent = Math.round(value * 100);
              return (
                <div key={key} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 10 }}>
                    <span style={{ color: '#cbd5e1' }}>{key}</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {percent}%
                    </span>
                  </div>
                  <div style={{ background: 'rgba(51,65,85,1)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
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
      )}

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
            {JSON.stringify({ afterglow, patternMix, surfaceWindow }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AfterglowTabView;
