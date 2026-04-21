import React, { useState } from 'react';

const DecisionTabView = ({ events }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // DECISION/ACTIVATION/MATERIAL_PICK段階のイベントを探す
  const decisionEvent = events.find(e => e.stage === 'DECISION');
  const activationEvent = events.find(e => e.stage === 'ACTIVATION');
  const materialPickEvent = events.find(e => e.stage === 'MATERIAL_PICK');

  if (!decisionEvent && !activationEvent && !materialPickEvent) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>決定データがありません</div>;
  }

  const decision = decisionEvent?.payload?.decision || {};
  const activated = activationEvent?.payload?.activated || {};
  const materialPick = materialPickEvent?.payload || {};

  // 上位5件＋スコアのリスト表示
  const renderTopList = (title, items = [], scoreKey = 'score') => {
    if (!items || items.length === 0) return null;
    const top5 = items.slice(0, 5);
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
          {title}
        </div>
        {top5.map((item, i) => {
          const score = item[scoreKey] || 0;
          const percent = Math.round(score * 100);
          const text = item.text || item.content || item.id || `Item ${i + 1}`;
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 10 }}>
                <span style={{ color: '#cbd5e1', flex: 1 }}>{text}</span>
                <span style={{ color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginLeft: 8 }}>
                  {percent}%
                </span>
              </div>
              <div style={{ background: 'rgba(51,65,85,1)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
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

  // クラスター構造を表示
  const renderClusters = (title, clusters = []) => {
    if (!clusters || clusters.length === 0) return null;
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
          {title}
        </div>
        {clusters.slice(0, 5).map((cluster, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(15,23,42,0.7)',
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              border: '1px solid rgba(71,85,105,0.6)',
            }}
          >
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>
              Cluster {i + 1} • Type: {cluster.clusterType || 'unknown'} • Score: {((cluster.score || 0) * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: 11, color: '#e2e8f0' }}>
              {cluster.thoughts?.length || cluster.nodes?.length || 0} items
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 決定サブストレート (意識的意図/長さ計画/表層計画/最終決定)
  const renderDecisionFields = () => {
    if (!decision) return null;
    const { consciousIntent, lengthPlan, surfacePlan, finalDecisionSubstrate } = decision;
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
          📋 決定要素
        </div>
        {consciousIntent && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>consciousIntent</div>
            <div style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {JSON.stringify(consciousIntent).slice(0, 100)}...
            </div>
          </div>
        )}
        {lengthPlan && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>lengthPlan</div>
            <div style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {JSON.stringify(lengthPlan).slice(0, 100)}...
            </div>
          </div>
        )}
        {surfacePlan && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>surfacePlan</div>
            <div style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {JSON.stringify(surfacePlan).slice(0, 100)}...
            </div>
          </div>
        )}
        {finalDecisionSubstrate && (
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>finalDecisionSubstrate（前景seed）</div>
            <div style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {JSON.stringify(finalDecisionSubstrate).slice(0, 100)}...
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        決定段階で活性化された思考・感情・動作とクラスター構造を表示します。
      </div>

      {/* activatedThoughts */}
      {activated?.activatedThoughts && renderTopList(
        '💭 Activated Thoughts (Top 5)',
        activated.activatedThoughts,
        'score'
      )}

      {/* activatedFeelings */}
      {activated?.activatedFeelings && renderTopList(
        '💖 Activated Feelings (Top 5)',
        activated.activatedFeelings,
        'score'
      )}

      {/* activatedMoves */}
      {activated?.activatedMoves && renderTopList(
        '🎬 Activated Moves (Top 5)',
        activated.activatedMoves,
        'score'
      )}

      {/* boundMixedNodes (クラスター構造) */}
      {materialPick?.boundMixedNodes?.clusters && renderClusters(
        '🔗 Bound Mixed Nodes (Cluster Structure)',
        materialPick.boundMixedNodes.clusters
      )}

      {/* 決定要素 */}
      {renderDecisionFields()}

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
            {JSON.stringify({ decision, activated, materialPick }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DecisionTabView;
