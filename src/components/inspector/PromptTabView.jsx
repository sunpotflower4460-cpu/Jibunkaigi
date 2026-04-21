import React, { useState } from 'react';

const PromptTabView = ({ events }) => {
  const [copiedSystem, setCopiedSystem] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);

  // PROMPT_SYSTEM/PROMPT_USER段階のイベントを探す
  const systemPromptEvent = events.find(e => e.stage === 'PROMPT_SYSTEM');
  const userPromptEvent = events.find(e => e.stage === 'PROMPT_USER');

  if (!systemPromptEvent && !userPromptEvent) {
    return <div style={{ fontSize: 13, color: '#cbd5e1' }}>プロンプトデータがありません</div>;
  }

  const systemInstruction = systemPromptEvent?.payload?.systemInstruction || '';
  const promptText = userPromptEvent?.payload?.promptText || '';

  const handleCopy = (text, setterFn) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setterFn(true);
        setTimeout(() => setterFn(false), 2000);
      });
    }
  };

  const renderPromptBlock = (title, text, copied, onCopy) => {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#bfdbfe', textTransform: 'uppercase' }}>
            {title}
          </div>
          <button
            type="button"
            onClick={onCopy}
            style={{
              border: '1px solid rgba(148,163,184,0.24)',
              background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(30,41,59,0.9)',
              color: copied ? '#10b981' : '#e2e8f0',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {copied ? '✓ コピー完了' : '📋 このプロンプトをコピー'}
          </button>
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#cbd5e1',
            marginBottom: 6,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          Length: {text.length.toLocaleString()} chars
        </div>
        <div
          style={{
            background: 'rgba(15,23,42,0.82)',
            borderRadius: 8,
            padding: 12,
            maxHeight: 400,
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
            {text}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12, lineHeight: 1.5 }}>
        LLMに送信される最終プロンプトを確認できます。
      </div>

      {systemInstruction && renderPromptBlock(
        '🤖 System Prompt',
        systemInstruction,
        copiedSystem,
        () => handleCopy(systemInstruction, setCopiedSystem)
      )}

      {promptText && renderPromptBlock(
        '👤 User Prompt',
        promptText,
        copiedUser,
        () => handleCopy(promptText, setCopiedUser)
      )}
    </div>
  );
};

export default PromptTabView;
