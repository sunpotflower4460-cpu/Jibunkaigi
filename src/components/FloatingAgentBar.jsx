import React, { useState } from 'react';
import { Sparkles, Compass, Flame, ChevronUp, ChevronDown, Users, Heart, ShieldAlert, X } from 'lucide-react';

/**
 * FloatingAgentBar – Phase 3 実験版（控えめ版）
 *
 * 会話が下に伸びたときに上部 agent bar まで戻らなくても
 * 同じ操作にアクセスできるようにする固定バー。
 * 既存の上部 UI は残したまま、下部にも同じ入口を置く。
 *
 * 表示条件:
 *   - activeSession がある かつ hasMessages が true
 *   - または compareModeEnabled / isDebugMode が true
 *   - または user が明示的に開いた (isOpen=true)
 *
 * 初期状態:
 *   - デフォルトは折りたたみ (isOpen=false)
 *   - 初回入力後に控えめに出現
 *   - compare/debug 時でも最初から開かない
 */
const FloatingAgentBar = ({
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
  // 初期状態は常に折りたたみ（控えめに）
  const [isOpen, setIsOpen] = useState(false);
  const [hasEverHadMessages, setHasEverHadMessages] = useState(false);

  // メッセージが来たことを記憶（初回入力後に表示開始）
  // Note: Using ref to track state without triggering re-render
  const hasMessagesRef = React.useRef(hasMessages);

  // Update ref and state only when hasMessages changes from false to true
  React.useEffect(() => {
    if (hasMessages && !hasMessagesRef.current) {
      hasMessagesRef.current = true;
      setHasEverHadMessages(true);
    }
  }, [hasMessages]);

  // 表示するかどうかの判定（初回入力後に出現）
  const shouldShow =
    hasEverHadMessages ||
    compareModeEnabled ||
    isDebugMode;

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
          aria-label="視点を開く"
          title="視点を開く"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 16px',
            borderRadius: 24,
            background: 'linear-gradient(150deg, rgba(14,22,58,0.78), rgba(22,32,70,0.72))',
            color: '#c7d2e8',
            fontSize: 10,
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer',
            backdropFilter: 'blur(18px) saturate(1.3)',
            boxShadow: '0 4px 16px rgba(8,12,36,0.24), inset 0 1px 0 rgba(255,255,255,0.12)',
            letterSpacing: '0.04em',
          }}
        >
          <ChevronUp size={12} />
          視点を開く
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
          gap: 5,
          padding: '7px 10px',
          borderRadius: 22,
          background: compareModeEnabled || isDebugMode
            ? 'linear-gradient(150deg, rgba(14,22,58,0.88), rgba(20,30,68,0.82))'
            : 'linear-gradient(150deg, rgba(14,22,58,0.78), rgba(20,30,68,0.72))',
          border: '1px solid rgba(255,255,255,0.13)',
          backdropFilter: 'blur(22px) saturate(1.35)',
          boxShadow: '0 6px 24px rgba(8,12,36,0.28), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)',
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

        {/* レイ（soul） */}
        {agents.find(a => a.id === 'soul') && (
          <button
            onClick={() => onAgentClick('soul')}
            disabled={disabled}
            aria-label="レイを呼び出す"
            title="レイ"
            style={buttonStyle({ disabled, variant: 'light' })}
          >
            <span style={{ flexShrink: 0, display: 'flex' }}>
              {agents.find(a => a.id === 'soul').icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: 800 }}>レイ</span>
          </button>
        )}

        {/* ケン（strategist） */}
        {agents.find(a => a.id === 'strategist') && (
          <button
            onClick={() => onAgentClick('strategist')}
            disabled={disabled}
            aria-label="ケンを呼び出す"
            title="ケン"
            style={buttonStyle({ disabled, variant: 'light' })}
          >
            <span style={{ flexShrink: 0, display: 'flex' }}>
              {agents.find(a => a.id === 'strategist').icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: 800 }}>ケン</span>
          </button>
        )}

        {/* ミナ（empath） */}
        {agents.find(a => a.id === 'empath') && (
          <button
            onClick={() => onAgentClick('empath')}
            disabled={disabled}
            aria-label="ミナを呼び出す"
            title="ミナ"
            style={buttonStyle({ disabled, variant: 'light' })}
          >
            <Heart size={12} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 800 }}>ミナ</span>
          </button>
        )}

        {/* サトウ（critic） */}
        {agents.find(a => a.id === 'critic') && (
          <button
            onClick={() => onAgentClick('critic')}
            disabled={disabled}
            aria-label="サトウを呼び出す"
            title="サトウ"
            style={buttonStyle({ disabled, variant: 'light' })}
          >
            <ShieldAlert size={12} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 800 }}>サトウ</span>
          </button>
        )}

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

        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.14)', flexShrink: 0, borderRadius: 1 }} />

        {/* たたむボタン */}
        <button
          onClick={() => setIsOpen(false)}
          aria-label="閉じる"
          title="閉じる"
          style={buttonStyle({ disabled: false, variant: 'ghost' })}
        >
          <X size={12} style={{ flexShrink: 0 }} />
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
    gap: 5,
    padding: '6px 11px',
    borderRadius: 14,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.32 : 1,
    transition: 'opacity 0.18s, transform 0.18s',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  };

  switch (variant) {
    case 'dark':
      return {
        ...base,
        background: 'linear-gradient(150deg, rgba(24,36,72,0.95), rgba(30,46,80,0.9))',
        color: '#dde4f0',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
        border: '1px solid rgba(99,102,241,0.2)',
      };
    case 'gradient':
      return {
        ...base,
        background: 'linear-gradient(135deg, rgba(108,40,220,0.88), rgba(79,80,220,0.88))',
        color: '#fff',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
        border: '1px solid rgba(167,139,250,0.2)',
      };
    case 'orange':
      return {
        ...base,
        background: 'linear-gradient(150deg, rgba(255,248,238,0.94), rgba(255,237,213,0.88))',
        color: '#92400e',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
        border: '1px solid rgba(251,191,36,0.2)',
      };
    case 'light':
      return {
        ...base,
        background: 'rgba(255,255,255,0.16)',
        color: '#dde4f0',
        border: '1px solid rgba(255,255,255,0.1)',
      };
    case 'ghost':
    default:
      return { ...base, background: 'transparent', color: 'rgba(196,210,234,0.75)', border: 'none' };
  }
}

export default FloatingAgentBar;
