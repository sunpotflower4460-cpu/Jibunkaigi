import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  gradients,
  mobileLayout,
  mobileLineHeights,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { MobileMessageToolbar } from './MobileMessageToolbar';
import { MobileAgentOthersTrigger } from '../others/MobileAgentOthersTrigger';
import type { MobileAgentId, OthersPosition } from '../../state/mobileTypes';

export type MessageRole = 'user' | 'agent';

// OTHERSのメインへのスタンス表示。小さく、控えめに（彩度を上げない・にぎやかにしない）。
const OTHERS_POSITION_LABELS: Record<OthersPosition, string> = {
  agree: '共感',
  question: '疑問',
  neutral: '中立',
};

interface MobileMessageBubbleProps {
  messageId: string;
  role: MessageRole;
  text: string;
  agentId?: MobileAgentId;
  agentLabel?: string;
  origin?: 'direct' | 'others';
  /** OTHERSのメインへのスタンス。origin === 'others' のときだけ小さく表示する。 */
  position?: OthersPosition;
  /** Thinking 中は agent 直下導線を非表示にする */
  isThinking?: boolean;
  /** OTHERS 読み込み中は導線を disabled / loading 表示にする */
  isLoadingOthers?: boolean;
  onCopy?: (messageId: string) => void;
  onShare?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRequestOthers?: (messageId: string) => void;
}

export function MobileMessageBubble({
  messageId,
  role,
  text,
  agentLabel,
  origin,
  position,
  isThinking = false,
  isLoadingOthers = false,
  onCopy,
  onShare,
  onDelete,
  onRequestOthers,
}: MobileMessageBubbleProps) {
  const isUser = role === 'user';
  const isOthers = origin === 'others';
  const hasToolbar = Boolean(onCopy && onShare && onDelete);

  // Phase 3A: agent message 直下「ほかの声も聴く」導線の表示条件
  //   - role === 'agent'
  //   - origin !== 'others'（others message からは連鎖させない）
  //   - Thinking 中ではない
  //   - onRequestOthers が存在する
  const showAgentOthersTrigger =
    !isUser &&
    !isOthers &&
    !isThinking &&
    Boolean(onRequestOthers);

  // Web版 MessageBubble.jsx と同じく、発言者名は吹き出しの「外の上」に置く。
  const headerLabel = !isUser && agentLabel ? agentLabel : null;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      <View style={[styles.column, isUser ? styles.columnUser : styles.columnAgent]}>
        {headerLabel || isOthers ? (
          <View style={styles.labelRow}>
            {headerLabel ? <Text style={styles.agentLabel}>{headerLabel}</Text> : null}
            {isOthers ? (
              <View style={styles.othersBadge}>
                <Text style={styles.othersBadgeText}>ほかの声</Text>
              </View>
            ) : null}
            {isOthers && position ? (
              <Text style={styles.positionLabel}>{OTHERS_POSITION_LABELS[position]}</Text>
            ) : null}
          </View>
        ) : null}

        {isUser ? (
          <LinearGradient
            colors={gradients.messageUser}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={[styles.bubble, styles.bubbleUser, shadow.messageUser]}
          >
            <Text style={[styles.text, styles.textUser]}>{text}</Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.bubble,
              styles.bubbleAgent,
              isOthers && styles.bubbleOthers,
              shadow.soft,
            ]}
          >
            {/* .mirror-reflection — 上端で光を受ける鏡面のスジ */}
            <View style={styles.mirrorReflection} pointerEvents="none" />
            <Text style={[styles.text, styles.textAgent]}>{text}</Text>
          </View>
        )}

        {hasToolbar ? (
          <MobileMessageToolbar
            messageId={messageId}
            canRequestOthers={isUser && Boolean(onRequestOthers)}
            onCopy={(id) => onCopy?.(id)}
            onShare={(id) => onShare?.(id)}
            onDelete={(id) => onDelete?.(id)}
            onRequestOthers={onRequestOthers}
          />
        ) : null}
        {showAgentOthersTrigger && onRequestOthers ? (
          <MobileAgentOthersTrigger
            messageId={messageId}
            onPress={onRequestOthers}
            isLoading={isLoadingOthers}
            disabled={isLoadingOthers}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    maxWidth: mobileLayout.timelineMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    // Web版は mb-10 / sm:mb-12（40–48px）。声と声のあいだに沈黙の間をとる。
    paddingBottom: spacing.xxl,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAgent: {
    alignItems: 'flex-start',
  },
  column: {
    minWidth: 0,
  },
  // Web版: ユーザーは max-w-[88%]、AI は max-w-full（読みやすさを優先）
  columnUser: {
    maxWidth: '88%',
  },
  columnAgent: {
    maxWidth: '100%',
  },
  bubble: {
    // Web版 rounded-[1.75rem] = 28px、px-5 py-4
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  bubbleUser: {
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.22)',
  },
  bubbleAgent: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  bubbleOthers: {
    borderColor: colors.accentIndigoSoft,
    backgroundColor: 'rgba(249,250,255,0.94)',
  },
  mirrorReflection: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '12%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  agentLabel: {
    // Web版: text-[10px] font-black tracking-[0.18em] text-slate-500
    fontSize: 10,
    color: colors.inkMuted,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  othersBadge: {
    backgroundColor: 'rgba(238,242,255,0.7)',
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(224,231,255,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  othersBadgeText: {
    fontSize: 8,
    color: colors.accentIndigo,
    fontWeight: '900',
  },
  positionLabel: {
    fontSize: 9,
    color: colors.inkFaint,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  text: {
    // Web版: text-[15px] leading-[1.85]
    fontSize: typeScale.body,
    lineHeight: mobileLineHeights.prose,
    flexShrink: 1,
  },
  textUser: {
    // Web版 .message-user は text-slate-100
    color: '#f1f5f9',
  },
  textAgent: {
    // Web版 .message-agent は text-slate-700
    color: colors.inkSoft,
  },
});
