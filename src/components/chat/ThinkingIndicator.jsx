import React from 'react';
import { getThinkingPhrase } from '../../agents/agentDefinitions.jsx';

/**
 * AI 応答生成中のローディング表示。
 *
 * 派手にせず、湖面の中にゆっくり波紋が広がるような落ち着いた表現に揃える。
 * エージェントごとに少しだけ違う「視線」を持たせ、誰が動いているかが
 * テキストでも伝わるようにする。
 */
const ThinkingIndicator = ({ agentName, agentId }) => {
  const phrase = agentId
    ? getThinkingPhrase(agentId)
    : agentName
      ? `${agentName} が、静かに見ています…`
      : '視点が立ち上がっています…';

  return (
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
      <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
        {phrase}
      </p>
    </div>
  );
};

export default ThinkingIndicator;
