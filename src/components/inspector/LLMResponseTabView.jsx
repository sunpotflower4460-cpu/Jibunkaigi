import React, { useState } from 'react';

const LLMResponseTabView = ({ events }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  // LLM_REQUEST/LLM_RESPONSE段階のイベントを探す
  const requestEvent = events.find(e => e.stage === 'LLM_REQUEST');
  const responseEvent = events.find(e => e.stage === 'LLM_RESPONSE');

  if (!requestEvent && !responseEvent) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>LLM応答データがありません</div>;
  }

  const request = requestEvent?.payload || {};
  const response = responseEvent?.payload || {};

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        LLMリクエストと応答の詳細を表示します。
      </div>

      {/* 注意文を固定表示 */}
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(245,158,11,0.5)',
          background: 'rgba(245,158,11,0.1)',
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 11, color: '#fbbf24', lineHeight: 1.6 }}>
          ⚠️ 再生成しない。記録のみ。
        </div>
      </div>

      {/* LLMリクエスト情報 */}
      {requestEvent && (
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
            📤 LLM Request
          </div>
          <div style={{ display: 'grid', gap: 6, fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Model: </span>
              <span style={{ color: '#e2e8f0' }}>{request.model || 'gemini-2.5-flash'}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Request Time: </span>
              <span style={{ color: '#e2e8f0' }}>
                {requestEvent.timestamp ? new Date(requestEvent.timestamp).toLocaleTimeString('ja-JP') : 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Prompt Length: </span>
              <span style={{ color: '#e2e8f0' }}>{request.promptLength?.toLocaleString() || 0} chars</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>System Instruction Length: </span>
              <span style={{ color: '#e2e8f0' }}>{request.systemInstructionLength?.toLocaleString() || 0} chars</span>
            </div>
          </div>
        </div>
      )}

      {/* LLM応答情報 */}
      {responseEvent && (
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
            📥 LLM Response
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#94a3b8', marginBottom: 4 }}>
              <span style={{ color: '#94a3b8' }}>Response Time: </span>
              <span style={{ color: '#e2e8f0' }}>
                {responseEvent.timestamp ? new Date(responseEvent.timestamp).toLocaleTimeString('ja-JP') : 'N/A'}
              </span>
              {requestEvent && responseEvent && (
                <span style={{ marginLeft: 8 }}>
                  (Duration: {((responseEvent.timestamp - requestEvent.timestamp) / 1000).toFixed(2)}s)
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#94a3b8', marginBottom: 6 }}>
              Response Length: {response.length?.toLocaleString() || 0} chars
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>生応答テキスト（最初の500文字）</div>
          <div
            style={{
              background: 'rgba(15,23,42,0.82)',
              borderRadius: 8,
              padding: 10,
              maxHeight: 200,
              overflowY: 'auto',
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
                lineHeight: 1.5,
              }}
            >
              {response.response || '（なし）'}
            </pre>
          </div>
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
            {JSON.stringify({ request, response }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default LLMResponseTabView;
