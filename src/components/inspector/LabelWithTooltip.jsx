import React, { useState } from 'react';
import { formatLabel, getHint } from '../../runtime/trace/labelDict.js';

/**
 * LabelWithTooltip
 *
 * Phase V-5: 解説モード用のラベルとツールチップコンポーネント
 *
 * Props:
 * - fieldKey: フィールド名（英語）
 * - showExplanation: 解説モードかどうか
 */
const LabelWithTooltip = ({ fieldKey, showExplanation }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const label = formatLabel(fieldKey, showExplanation);
  const hint = showExplanation ? getHint(fieldKey) : null;

  if (!hint) {
    return <>{label}</>;
  }

  return (
    <span
      style={{ position: 'relative', cursor: 'help', borderBottom: '1px dotted rgba(203,213,225,0.5)' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {label}
      {showTooltip && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 4,
            padding: '6px 10px',
            background: 'rgba(15,23,42,0.98)',
            border: '1px solid rgba(148,163,184,0.4)',
            borderRadius: 8,
            fontSize: 10,
            color: '#e2e8f0',
            whiteSpace: 'normal',
            width: 'max-content',
            maxWidth: 300,
            lineHeight: 1.4,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        >
          {hint}
        </span>
      )}
    </span>
  );
};

export default LabelWithTooltip;
