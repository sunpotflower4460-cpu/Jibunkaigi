import React, { useState } from 'react';

const LatentTabView = ({ events }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpanded = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 潜在層関連のイベントを抽出
  const makerSeedEvent = events.find(e => e.stage === 'LATENT_MAKER_SEED');
  const homeEvent = events.find(e => e.stage === 'LATENT_HOME');
  const existence1Event = events.find(e => e.stage === 'LATENT_EXISTENCE');
  const existence2Event = events.find(e => e.stage === 'LATENT_EXISTENCE_2');
  const beliefCoreEvent = events.find(e => e.stage === 'LATENT_BELIEF_CORE');
  const beliefBranchEvent = events.find(e => e.stage === 'LATENT_BELIEF_BRANCH');
  const beliefLeafEvent = events.find(e => e.stage === 'LATENT_BELIEF_LEAF');
  const beliefTensionEvent = events.find(e => e.stage === 'LATENT_BELIEF_TENSION');
  const preconditionFilterEvent = events.find(e => e.stage === 'PRECONDITION_FILTER');
  const preconditionBiasEvent = events.find(e => e.stage === 'PRECONDITION_BIAS');

  if (!makerSeedEvent && !homeEvent && !existence1Event && !existence2Event) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>潜在層データがありません</div>;
  }

  const renderCollapsibleJson = (key, title, data) => {
    const isExpanded = expanded[key];
    return (
      <div
        key={key}
        style={{
          borderRadius: 12,
          border: '1px solid rgba(71,85,105,0.8)',
          padding: 12,
          background: 'rgba(30,41,59,0.72)',
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => toggleExpanded(key)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#bfdbfe',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textTransform: 'uppercase',
          }}
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>{title}</span>
        </button>
        {isExpanded && (
          <pre
            style={{
              margin: '10px 0 0 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 10,
              color: '#e2e8f0',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              background: 'rgba(15,23,42,0.7)',
              padding: 10,
              borderRadius: 8,
            }}
          >
            {JSON.stringify(data || {}, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  const renderCalculationValues = (title, values) => {
    if (!values || Object.keys(values).length === 0) return null;
    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(71,85,105,0.8)',
          padding: 12,
          background: 'rgba(30,41,59,0.72)',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 8, textTransform: 'uppercase' }}>
          {title}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 8,
            fontSize: 10,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {Object.entries(values).map(([key, value]) => (
            <div key={key}>
              <div style={{ color: '#94a3b8' }}>{key}</div>
              <div style={{ color: '#e2e8f0' }}>
                {typeof value === 'number' ? value.toFixed(3) : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        潜在層の各レイヤーを折りたたみで確認できます。
      </div>

      {/* makerSeed */}
      {makerSeedEvent && renderCollapsibleJson('makerSeed', '🌱 Maker Seed', makerSeedEvent.payload?.makerSeed)}

      {/* home */}
      {homeEvent && renderCollapsibleJson('home', '🏠 Home Layer', homeEvent.payload?.baseHome)}

      {/* existence1 */}
      {existence1Event && renderCollapsibleJson('existence1', '✨ Existence Layer 1', existence1Event.payload?.existenceLayer1)}

      {/* existence2 */}
      {existence2Event && renderCollapsibleJson('existence2', '🌌 Existence Layer 2', existence2Event.payload?.existenceLayer2)}

      {/* beliefCore */}
      {beliefCoreEvent && renderCollapsibleJson('beliefCore', '🔮 Belief Core', beliefCoreEvent.payload?.beliefCore)}

      {/* beliefBranch */}
      {beliefBranchEvent && renderCollapsibleJson('beliefBranch', '🌿 Belief Branch', beliefBranchEvent.payload?.beliefBranch)}

      {/* beliefLeaf */}
      {beliefLeafEvent && renderCollapsibleJson('beliefLeaf', '🍃 Belief Leaf', beliefLeafEvent.payload?.beliefLeaf)}

      {/* beliefTension */}
      {beliefTensionEvent && renderCollapsibleJson('beliefTension', '⚡ Belief Tension', beliefTensionEvent.payload?.beliefTension)}

      {/* belief計算過程（数値） */}
      {beliefCoreEvent && beliefCoreEvent.payload?.beliefCore && renderCalculationValues(
        '📐 Belief 計算過程',
        {
          beliefCore: beliefCoreEvent.payload.beliefCore.activeCoreBeliefs?.length || 0,
          beliefBranch: beliefBranchEvent?.payload?.beliefBranch?.activeBranchBeliefs?.length || 0,
          beliefLeaf: beliefLeafEvent?.payload?.beliefLeaf?.activeLeafBeliefs?.length || 0,
          beliefTension: beliefTensionEvent?.payload?.beliefTension?.totalTensionStrength || 0,
        }
      )}

      {/* preconditionFilter */}
      {preconditionFilterEvent && renderCollapsibleJson('preconditionFilter', '🔍 Precondition Filter', preconditionFilterEvent.payload?.preconditionFilter)}

      {/* preconditionBias */}
      {preconditionBiasEvent && renderCollapsibleJson('preconditionBias', '🎚️ Precondition Bias', preconditionBiasEvent.payload?.preconditionBias)}
    </div>
  );
};

export default LatentTabView;
