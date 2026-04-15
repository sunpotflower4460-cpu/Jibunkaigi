import React, { useState } from 'react';
import { Sparkles, Compass, Flame, ChevronUp, ChevronDown, Users } from 'lucide-react';

/**
 * FloatingAgentBar – Phase 3 実験版
 *
 * 会話が下に伸びたときに上部 agent bar まで戻らなくても
 * 同じ操作にアクセスできるようにする固定バー。
 * 既存の上部 UI は残したまま、下部にも同じ入口を置く。
 *
 * 表示条件:
 *   - activeSession がある かつ hasMessages が true
 *   - または compareModeEnabled / isDebugMode が true
 *   - または user が明示的に開いた (isOpen=true)
 */
const FloatingAgentBar = ({
  activeSessionId,
  hasMessages,
  canUseAgents,
  isGenerating,
  isSending,
  agentDisabledReason,
  compareModeEnabled = false,
  isDebugMode = false,
  isDebugPanelVisible = false,
  onRandomResponse,
  onAgentClick,
  onScrollToOthers,
  agents = [],
}) => {
  // compare 中は最初から開いた状態にする
  // debug panel 表示中は最小化して重なりを避ける
  const [isOpen, setIsOpen] = useState(compareModeEnabled && !isDebugPanelVisible);

  // 表示するかどうかの判定
  const shouldShow =
    (!!activeSessionId && hasMessages) ||
    compareModeEnabled ||
    isDebugMode ||
    isOpen;

  if (!shouldShow) return null;

  // AgentGateDebugPanel (bottom:8, right:8) との重なりを避けるため
  // debug panel が表示されているときは bottom を上げる
  // safe-area-inset-bottom を calc() に含めて iPhone ノッチ対応
  const bottomOffset = isDebugPanelVisible
    ? 'calc(env(safe-area-inset-bottom, 0px) + 140px)'
    : 'calc(env(safe-area-inset-bottom, 0px) + 12px)';

  const disabled = !canUseAgents || isGenerating || isSending;

  // OTHERS にスクロール
  const handleScrollToOthers = () => {
    if (onScrollToOthers) {
      onScrollToOthers();
    }
  };

  // たたんだ状態: 小さいトグルボタンのみ
  if (!isOpen) {
    return (
      <div
        role="complementary"
        aria-label="下部エージェント操作バー（たたみ中）"
        style={{
          position: 'fixed',
          bottom: bottomOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          aria-label="下部エージェント操作バーを開く"
          title="エージェント操作を開く"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(30,41,59,0.75)',
            color: '#e2e8f0',
            fontSize: 10,
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <ChevronUp size={12} />
          エージェント
        </button>
      </div>
    );
  }

  // 展開状態
  return (
    <div
      role="complementary"
      aria-label="下部エージェント操作バー"
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 'min(calc(100vw - 32px), 600px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 20,
          background: compareModeEnabled || isDebugMode
            ? 'rgba(30,41,59,0.88)'
            : 'rgba(30,41,59,0.72)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {/* 心の鏡 */}
        <button
          onClick={() => onAgentClick('master', true)}
          disabled={disabled}
          aria-label="心の鏡を呼び出す"
          title="心の鏡"
          style={buttonStyle({ disabled, variant: 'dark' })}
        >
          <Compass size={12} style={{ color: '#818cf8', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800 }}>心の鏡</span>
        </button>

        {/* 委ねる */}
        <button
          onClick={() => onRandomResponse()}
          disabled={disabled}
          aria-label="委ねる（ランダムエージェント）"
          title="委ねる"
          style={buttonStyle({ disabled, variant: 'gradient' })}
        >
          <Sparkles size={12} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800 }}>委ねる</span>
        </button>

        {/* ジョー（creative） */}
        <button
          onClick={() => onAgentClick('creative')}
          disabled={disabled}
          aria-label="ジョーを呼び出す"
          title="ジョー"
          style={buttonStyle({ disabled, variant: 'orange' })}
        >
          <Flame size={12} style={{ color: '#ea580c', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800 }}>ジョー</span>
        </button>

        {/* その他エージェント（first 2 from remaining agents） */}
        {agents
          .filter(a => a.id !== 'creative')
          .slice(0, 2)
          .map(a => (
            <button
              key={a.id}
              onClick={() => onAgentClick(a.id)}
              disabled={disabled}
              aria-label={`${a.name}を呼び出す`}
              title={a.name}
              style={buttonStyle({ disabled, variant: 'light' })}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}>{a.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 800 }}>{a.name}</span>
            </button>
          ))}

        {/* OTHERS スクロール */}
        <button
          onClick={handleScrollToOthers}
          aria-label="OTHERSセクションへスクロール"
          title="OTHERS"
          style={buttonStyle({ disabled: false, variant: 'ghost' })}
        >
          <Users size={12} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 800 }}>OTHERS</span>
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

        {/* たたむボタン */}
        <button
          onClick={() => setIsOpen(false)}
          aria-label="下部エージェント操作バーをたたむ"
          title="たたむ"
          style={buttonStyle({ disabled: false, variant: 'ghost' })}
        >
          <ChevronDown size={12} style={{ flexShrink: 0 }} />
        </button>
      </div>

      {/* debug/compare 時のみ disabled reason を表示 */}
      {(compareModeEnabled || isDebugMode) && agentDisabledReason && (
        <div
          style={{
            marginTop: 2,
            textAlign: 'center',
            fontSize: 9,
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#f97316',
          }}
        >
          disabled: {agentDisabledReason}
        </div>
      )}
    </div>
  );
};

/** ボタンスタイルを variant に応じて返す */
function buttonStyle({ disabled, variant }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 14,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    transition: 'opacity 0.15s',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };

  switch (variant) {
    case 'dark':
      return { ...base, background: 'rgba(30,41,59,0.9)', color: '#e2e8f0' };
    case 'gradient':
      return {
        ...base,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(99,102,241,0.85))',
        color: '#fff',
      };
    case 'orange':
      return { ...base, background: 'rgba(255,247,237,0.9)', color: '#9a3412' };
    case 'light':
      return { ...base, background: 'rgba(255,255,255,0.18)', color: '#e2e8f0' };
    case 'ghost':
    default:
      return { ...base, background: 'transparent', color: 'rgba(226,232,240,0.7)' };
  }
}

export default FloatingAgentBar;
