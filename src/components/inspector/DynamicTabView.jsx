import React, { useState } from 'react';

const DynamicTabView = ({ events }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // 動的層関連のイベントを抽出
  const fieldEvent = events.find(e => e.stage === 'DYNAMIC_FIELD');
  const reactionEvent = events.find(e => e.stage === 'DYNAMIC_REACTION');
  const stanceEvent = events.find(e => e.stage === 'DYNAMIC_STANCE');
  const permissionEvent = events.find(e => e.stage === 'PERMISSION');

  if (!fieldEvent && !reactionEvent && !stanceEvent) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>動的層データがありません</div>;
  }

  const field = fieldEvent?.payload?.field || {};
  const reaction = reactionEvent?.payload?.reaction || {};
  const stance = stanceEvent?.payload?.stance || {};
  const permissionShape = permissionEvent?.payload?.permissionShape || {};

  // レーダーチャートを描画 (field用)
  const renderRadarChart = (data, keys) => {
    const size = 180;
    const center = size / 2;
    const maxRadius = size / 2 - 20;
    const angleStep = (Math.PI * 2) / keys.length;

    const points = keys.map((key, i) => {
      const value = data[key] || 0;
      const angle = angleStep * i - Math.PI / 2; // 上から始める
      const radius = value * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y, key, value, angle };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* グリッド円 */}
          {[0.25, 0.5, 0.75, 1].map(scale => (
            <circle
              key={scale}
              cx={center}
              cy={center}
              r={maxRadius * scale}
              fill="none"
              stroke="rgba(71,85,105,0.4)"
              strokeWidth="1"
            />
          ))}
          {/* 軸線 */}
          {points.map((p, i) => (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(p.angle)}
              y2={center + maxRadius * Math.sin(p.angle)}
              stroke="rgba(71,85,105,0.4)"
              strokeWidth="1"
            />
          ))}
          {/* データ領域 */}
          <path d={pathData} fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth="2" />
          {/* データポイント */}
          {points.map((p, i) => (
            <circle key={`point-${i}`} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
          ))}
          {/* ラベル */}
          {points.map((p, i) => {
            const labelRadius = maxRadius + 12;
            const labelX = center + labelRadius * Math.cos(p.angle);
            const labelY = center + labelRadius * Math.sin(p.angle);
            return (
              <text
                key={`label-${i}`}
                x={labelX}
                y={labelY}
                fill="#cbd5e1"
                fontSize="9"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {p.key}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // 横棒グラフを描画 (reaction/stance用)
  const renderBarChart = (data, keys, title) => {
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
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 10, textTransform: 'uppercase' }}>
          {title}
        </div>
        {keys.map(key => {
          const value = data[key] || 0;
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
                    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                    height: '100%',
                    width: `${percent}%`,
                    borderRadius: 4,
                    transition: 'width 220ms ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // チェックリスト形式でpermissionShapeを表示
  const renderPermissionChecklist = () => {
    if (!permissionShape || Object.keys(permissionShape).length === 0) return null;
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
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 10, textTransform: 'uppercase' }}>
          ✅ Permission Shape
        </div>
        {Object.entries(permissionShape).map(([key, value]) => {
          const percent = Math.round((value || 0) * 100);
          const isActive = percent >= 50;
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                fontSize: 11,
                color: '#e2e8f0',
              }}
            >
              <span style={{ color: isActive ? '#10b981' : '#64748b', fontSize: 14 }}>
                {isActive ? '✓' : '○'}
              </span>
              <span>{key}</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#94a3b8', fontSize: 10 }}>
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        動的層の field / reaction / stance / permission を可視化します。
      </div>

      {/* field: レーダーチャート */}
      {fieldEvent && (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(71,85,105,0.8)',
            padding: 12,
            background: 'rgba(30,41,59,0.72)',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 10, textTransform: 'uppercase' }}>
            🌐 Field (Radar Chart)
          </div>
          {renderRadarChart(field, ['softness', 'depth', 'urgency', 'fragility'])}
        </div>
      )}

      {/* reaction: 横棒 */}
      {reactionEvent && renderBarChart(
        reaction,
        ['touched', 'protect', 'holdBackJudgment', 'clarify', 'curiosity'],
        '💫 Reaction'
      )}

      {/* stance: 横棒 */}
      {stanceEvent && renderBarChart(
        stance,
        ['receive', 'illuminate', 'structure', 'guard', 'nudge'],
        '🧭 Stance'
      )}

      {/* permissionShape: チェックリスト */}
      {renderPermissionChecklist()}

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
            {JSON.stringify({ field, reaction, stance, permissionShape }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DynamicTabView;
