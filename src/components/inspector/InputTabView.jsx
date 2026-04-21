import React, { useState } from 'react';
import LabelWithTooltip from './LabelWithTooltip.jsx';

const InputTabView = ({ events, showExplanation = false }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // INPUT段階のイベントを探す
  const inputEvents = events.filter(e => e.stage === 'INPUT');
  if (inputEvents.length === 0) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>入力データがありません</div>;
  }

  const latestInput = inputEvents[inputEvents.length - 1];
  const payload = latestInput.payload || {};
  const { userText, selectedMode, afterglowSeed, estimateState } = payload;

  // estimateState の8軸スコアを横棒グラフで可視化
  const renderEstimateStateBar = (label, value) => {
    const percent = Math.round((value || 0) * 100);
    return (
      <div key={label} style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
          <span style={{ color: '#cbd5e1' }}>
            <LabelWithTooltip fieldKey={label} showExplanation={showExplanation} />
          </span>
          <span style={{ color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            {percent}%
          </span>
        </div>
        <div style={{ background: 'rgba(51,65,85,1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              height: '100%',
              width: `${percent}%`,
              borderRadius: 4,
              transition: 'width 220ms ease',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 📥 入力カード */}
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(71,85,105,0.8)',
          padding: 14,
          background: 'rgba(30,41,59,0.72)',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 8, textTransform: 'uppercase' }}>
          📥 入力
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>userText（原文）</div>
          <div
            style={{
              fontSize: 12,
              color: '#e2e8f0',
              lineHeight: 1.6,
              background: 'rgba(15,23,42,0.7)',
              padding: 10,
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {userText || '（なし）'}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>selectedMode</div>
          <div
            style={{
              fontSize: 12,
              color: '#e2e8f0',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {selectedMode || 'medium'}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>afterglowSeed（前ターンからの持ち越し）</div>
          <div
            style={{
              fontSize: 11,
              color: '#94a3b8',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {afterglowSeed ? (
              <>
                previousMix: {afterglowSeed.previousMix ? 'あり' : 'なし'},
                previousLatentState: {afterglowSeed.previousLatentState ? 'あり' : 'なし'}
              </>
            ) : '（なし）'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>othersField（直近の他エージェント発話）</div>
          <div
            style={{
              fontSize: 11,
              color: '#94a3b8',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {/* TODO: othersFieldの表示は別イベントで取得する必要がある */}
            （別イベントで取得）
          </div>
        </div>
      </div>

      {/* estimateStateの8軸スコアを横棒グラフで可視化 */}
      {estimateState && (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(71,85,105,0.8)',
            padding: 14,
            background: 'rgba(30,41,59,0.72)',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 10, textTransform: 'uppercase' }}>
            📊 EstimateState
          </div>
          {renderEstimateStateBar('desire', estimateState.desire)}
          {renderEstimateStateBar('fear', estimateState.fear)}
          {renderEstimateStateBar('freeze', estimateState.freeze)}
          {renderEstimateStateBar('reach', estimateState.reach)}
          {renderEstimateStateBar('resignation', estimateState.resignation)}
          {renderEstimateStateBar('selfErasure', estimateState.selfErasure)}
          {renderEstimateStateBar('shame', estimateState.shame)}
          {renderEstimateStateBar('unfinished', estimateState.unfinished)}
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
            marginBottom: 12,
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
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default InputTabView;
