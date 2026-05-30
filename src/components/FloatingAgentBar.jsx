import React, { useState } from 'react';
import { Sparkles, Compass, Flame, ChevronUp, Users, Heart, ShieldAlert, X } from 'lucide-react';
import { useT } from '../i18n';

/**
 * FloatingAgentBar — 下部に控えめに浮かぶエージェント操作バー。
 *
 * 表示条件:
 *   - hasMessages（初回入力後）になったら出現
 *   - または compareMode / debug 時
 *
 * 初期状態は折りたたみ。「視点を開く」をタップすると展開。
 *
 * Phase 3 改善:
 *   - safe-area-inset-bottom を必ず加算
 *   - タップ領域は最低 44×44px
 *   - focus-visible は global の indigo ring に従う
 *   - キーボード表示時に重ならないよう、bottom を safe-area + 余白で計算
 *   - 横スクロールは scroll-padding と momentum scroll
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
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [hasEverHadMessages, setHasEverHadMessages] = useState(false);

  const hasMessagesRef = React.useRef(hasMessages);

  React.useEffect(() => {
    if (hasMessages && !hasMessagesRef.current) {
      hasMessagesRef.current = true;
      setHasEverHadMessages(true);
    }
  }, [hasMessages]);

  const shouldShow = hasEverHadMessages || compareModeEnabled || isDebugMode;
  if (!shouldShow) return null;

  // safe-area + debug panel が出ているときは追加で持ち上げる
  const bottomOffset = isDebugPanelVisible
    ? 'calc(env(safe-area-inset-bottom, 0px) + 148px)'
    : 'calc(env(safe-area-inset-bottom, 0px) + 14px)';

  const disabled = !canUseAgents || isGenerating || isSending;

  const handleScrollToOthers = () => {
    if (onScrollToOthers) onScrollToOthers();
  };

  // 折りたたみ — 小さなトグル
  if (!isOpen) {
    return (
      <div
        role="complementary"
        aria-label={t('floating.collapsed.aria')}
        style={{
          position: 'fixed',
          bottom: bottomOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={t('floating.open')}
          title={t('floating.open')}
          className="floating-agent-toggle"
        >
          <ChevronUp size={14} aria-hidden="true" />
          <span>{t('floating.open')}</span>
        </button>
      </div>
    );
  }

  // 展開
  return (
    <div
      role="complementary"
      aria-label={t('floating.expanded.aria')}
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 'min(calc(100vw - 24px), 640px)',
      }}
    >
      <div
        className={`floating-agent-rail ${compareModeEnabled || isDebugMode ? 'is-debug' : ''}`}
      >
        {/* 心の鏡 */}
        <button
          type="button"
          onClick={() => onAgentClick('master', true)}
          disabled={disabled}
          aria-label={t('floating.mirror.aria')}
          title={t('agentbar.mirror.name')}
          className="floating-agent-btn floating-agent-btn--dark"
        >
          <Compass size={13} aria-hidden="true" style={{ color: '#a5b4fc', flexShrink: 0 }} />
          <span>{t('agentbar.mirror.name')}</span>
        </button>

        {/* 委ねる */}
        <button
          type="button"
          onClick={() => onRandomResponse()}
          disabled={disabled}
          aria-label={t('floating.delegate.aria')}
          title={t('agentbar.delegate.name')}
          className="floating-agent-btn floating-agent-btn--gradient"
        >
          <Sparkles size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{t('agentbar.delegate.name')}</span>
        </button>

        {/* ジョー（creative） */}
        <button
          type="button"
          onClick={() => onAgentClick('creative')}
          disabled={disabled}
          aria-label={t('floating.summon.aria', { name: 'ジョー' })}
          title="ジョー"
          className="floating-agent-btn floating-agent-btn--orange"
        >
          <Flame size={13} aria-hidden="true" style={{ color: '#ea580c', flexShrink: 0 }} />
          <span>ジョー</span>
        </button>

        {/* レイ（soul） */}
        {agents.find(a => a.id === 'soul') && (
          <button
            type="button"
            onClick={() => onAgentClick('soul')}
            disabled={disabled}
            aria-label={t('floating.summon.aria', { name: 'レイ' })}
            title="レイ"
            className="floating-agent-btn floating-agent-btn--light"
          >
            <span style={{ flexShrink: 0, display: 'flex' }} aria-hidden="true">
              {agents.find(a => a.id === 'soul').icon}
            </span>
            <span>レイ</span>
          </button>
        )}

        {/* ケン（strategist） */}
        {agents.find(a => a.id === 'strategist') && (
          <button
            type="button"
            onClick={() => onAgentClick('strategist')}
            disabled={disabled}
            aria-label={t('floating.summon.aria', { name: 'ケン' })}
            title="ケン"
            className="floating-agent-btn floating-agent-btn--light"
          >
            <span style={{ flexShrink: 0, display: 'flex' }} aria-hidden="true">
              {agents.find(a => a.id === 'strategist').icon}
            </span>
            <span>ケン</span>
          </button>
        )}

        {/* ミナ（empath） */}
        {agents.find(a => a.id === 'empath') && (
          <button
            type="button"
            onClick={() => onAgentClick('empath')}
            disabled={disabled}
            aria-label={t('floating.summon.aria', { name: 'ミナ' })}
            title="ミナ"
            className="floating-agent-btn floating-agent-btn--light"
          >
            <Heart size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>ミナ</span>
          </button>
        )}

        {/* サトウ（critic） */}
        {agents.find(a => a.id === 'critic') && (
          <button
            type="button"
            onClick={() => onAgentClick('critic')}
            disabled={disabled}
            aria-label={t('floating.summon.aria', { name: 'サトウ' })}
            title="サトウ"
            className="floating-agent-btn floating-agent-btn--light"
          >
            <ShieldAlert size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>サトウ</span>
          </button>
        )}

        {/* OTHERS スクロール */}
        <button
          type="button"
          onClick={handleScrollToOthers}
          aria-label={t('floating.others.aria')}
          title="OTHERS"
          className="floating-agent-btn floating-agent-btn--ghost"
        >
          <Users size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>OTHERS</span>
        </button>

        <div className="floating-agent-divider" aria-hidden="true" />

        {/* たたむ */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label={t('floating.close.aria')}
          title={t('common.close')}
          className="floating-agent-btn floating-agent-btn--ghost floating-agent-btn--icon"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {(compareModeEnabled || isDebugMode) && agentDisabledReason && (
        <p
          style={{
            marginTop: 4,
            textAlign: 'center',
            fontSize: 10,
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#f97316',
          }}
        >
          disabled: {agentDisabledReason}
        </p>
      )}
    </div>
  );
};

export default FloatingAgentBar;
