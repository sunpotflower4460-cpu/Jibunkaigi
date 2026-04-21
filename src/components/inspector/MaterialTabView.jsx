import React, { useState } from 'react';
import { formatLabel } from '../../runtime/trace/labelDict.js';
import LabelWithTooltip from './LabelWithTooltip.jsx';

const MaterialTabView = ({ events, showExplanation = false }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // ACTIVATION段階のイベントからactivated.debugを取得
  const activationEvent = events.find(e => e.stage === 'ACTIVATION');
  const activated = activationEvent?.payload?.activated || {};
  const debug = activated.debug || {};

  // 各素材の全候補データ
  const allBeliefCandidates = debug.allBeliefCandidates || [];
  const allMemoryCandidates = debug.allMemoryCandidates || [];
  const allFieldCandidates = debug.allFieldCandidates || [];
  const reentryCandidates = debug.reentryCandidates || [];

  if (!activationEvent) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>素材データがありません</div>;
  }

  // 素材候補テーブルを描画
  const renderCandidatesTable = (title, candidates, columns) => {
    if (!candidates || candidates.length === 0) return null;

    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(71,85,105,0.8)',
          padding: 12,
          background: 'rgba(30,41,59,0.72)',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 10, textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.6)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>選択</th>
                {columns.map((col) => (
                  <th key={col.key} style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx < candidates.length - 1 ? '1px solid rgba(71,85,105,0.3)' : 'none',
                    background: candidate.picked ? 'rgba(34,197,94,0.08)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {candidate.picked ? (
                      <span style={{ color: '#22c55e', fontSize: 14 }}>✅</span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: 14 }}>—</span>
                    )}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '8px',
                        color: candidate.picked ? '#e2e8f0' : '#94a3b8',
                        fontFamily: col.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
                      }}
                    >
                      {col.render ? col.render(candidate[col.key], candidate) : candidate[col.key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // スコアをパーセント表示
  const renderScore = (score) => {
    const percent = Math.round((score || 0) * 100);
    return `${percent}%`;
  };

  // ベクトルの要素を簡潔に表示（上位3つ）
  const renderVector = (vector) => {
    if (!vector || typeof vector !== 'object') return '—';
    const entries = Object.entries(vector)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (entries.length === 0) return '—';
    return entries.map(([k, v]) => {
      const label = showExplanation ? formatLabel(k, true) : k;
      return `${label}:${Math.round(v * 100)}%`;
    }).join(', ');
  };

  // Reentry候補テーブル（専用表示）
  const renderReentryCandidatesTable = () => {
    if (!reentryCandidates || reentryCandidates.length === 0) return null;

    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(71,85,105,0.8)',
          padding: 12,
          background: 'rgba(30,41,59,0.72)',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', marginBottom: 6, textTransform: 'uppercase' }}>
          🎯 Reentry 候補（内的方向づけ）
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#fbbf24',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 6,
            padding: '6px 8px',
            marginBottom: 10,
          }}
        >
          ⚠️ 現在ランダム選択・プロンプト未使用（設計書v2の指摘を可視化）
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(71,85,105,0.6)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>選択</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>インデックス</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>重み</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>内容プレビュー</th>
              </tr>
            </thead>
            <tbody>
              {reentryCandidates.slice(0, 4).map((candidate, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx < Math.min(4, reentryCandidates.length) - 1 ? '1px solid rgba(71,85,105,0.3)' : 'none',
                    background: candidate.selected ? 'rgba(34,197,94,0.08)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {candidate.selected ? (
                      <span style={{ color: '#22c55e', fontSize: 14 }}>✅</span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: 14 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', color: candidate.selected ? '#e2e8f0' : '#94a3b8' }}>
                    {idx}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      color: candidate.selected ? '#e2e8f0' : '#94a3b8',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {Math.round((candidate.weight || 0) * 100)}%
                  </td>
                  <td style={{ padding: '8px', color: candidate.selected ? '#e2e8f0' : '#94a3b8', maxWidth: 400 }}>
                    {(candidate.text || '').slice(0, 80)}
                    {(candidate.text || '').length > 80 ? '...' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        全候補のスコアと選定結果を表示します。「なぜこれが選ばれたか」「なぜあれが選ばれなかったか」を検証できます。
      </div>

      {/* Beliefs */}
      {renderCandidatesTable(
        '💭 Beliefs（信念フィルター）',
        allBeliefCandidates,
        [
          { key: 'id', label: 'ID', mono: false },
          { key: 'score', label: 'スコア', mono: true, render: renderScore },
          { key: 'vector', label: 'ベクトル（上位3）', mono: true, render: renderVector },
        ]
      )}

      {/* Memories */}
      {renderCandidatesTable(
        '📚 Memories（記憶）',
        allMemoryCandidates,
        [
          { key: 'id', label: 'ID', mono: false },
          { key: 'score', label: 'スコア', mono: true, render: renderScore },
          { key: 'tone', label: 'トーン', mono: false },
        ]
      )}

      {/* Fields */}
      {renderCandidatesTable(
        '🌐 Fields（反応ノード）',
        allFieldCandidates,
        [
          { key: 'id', label: 'ID', mono: false },
          { key: 'score', label: 'スコア', mono: true, render: renderScore },
        ]
      )}

      {/* Reentry */}
      {renderReentryCandidatesTable()}

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
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MaterialTabView;
