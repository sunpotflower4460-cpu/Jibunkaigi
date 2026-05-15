import React from 'react';

/**
 * AI 応答生成中のローディング表示。
 * 派手にせず、湖面の中にゆっくり波紋が広がるような落ち着いた表現に揃える。
 */
const ThinkingIndicator = ({ agentName }) => (
  <div
    className="flex flex-col gap-3 p-4 animate-in fade-in"
    role="status"
    aria-live="polite"
  >
    <div className="flex gap-2 items-center">
      <div className="thinking-dot" aria-hidden="true" />
      <div className="thinking-dot" aria-hidden="true" />
      <div className="thinking-dot" aria-hidden="true" />
    </div>
    {agentName && (
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.22em]">
        {agentName} が思考中…
      </p>
    )}
  </div>
);

export default ThinkingIndicator;
