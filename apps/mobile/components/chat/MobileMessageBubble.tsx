import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { MobileMessageToolbar } from './MobileMessageToolbar';

export type MessageRole = 'user' | 'agent';

interface MobileMessageBubbleProps {
  messageId: string;
  role: MessageRole;
  text: string;
  agentLabel?: string;
  origin?: 'direct' | 'others';
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
  onCopy,
  onShare,
  onDelete,
  onRequestOthers,
}: MobileMessageBubbleProps) {
  const isUser = role === 'user';
  const isOthers = origin === 'others';
  const hasToolbar = Boolean(onCopy && onShare && onDelete);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      <View style={styles.column}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAgent,
            isOthers && styles.bubbleOthers,
          ]}
        >
          {!isUser && (agentLabel || isOthers) && (
            <View style={styles.labelRow}>
              {agentLabel ? (
                <Text style={styles.agentLabel}>{agentLabel}</Text>
              ) : null}
              {isOthers && (
                <View style={styles.othersBadge}>
                  <Text style={styles.othersBadgeText}>OTHERS</Text>
                </View>
              )}
            </View>
          )}
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
            {text}
          </Text>
        </View>
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
    paddingVertical: spacing.md,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAgent: {
    alignItems: 'flex-start',
  },
  column: {
    maxWidth: '86%',
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: colors.accentIndigo,
    borderBottomRightRadius: radius.xs,
  },
  bubbleAgent: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderBottomLeftRadius: radius.xs,
  },
  bubbleOthers: {
    borderColor: colors.accentIndigoSoft,
    backgroundColor: colors.accentSurface,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  agentLabel: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  othersBadge: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentIndigoSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  othersBadgeText: {
    fontSize: typeScale.tiny - 1,
    color: colors.accentIndigo,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: typeScale.body,
    lineHeight: mobileLineHeights.body,
    flexShrink: 1,
    letterSpacing: 0.1,
  },
  textUser: {
    color: colors.textOnAccent,
  },
  textAgent: {
    color: colors.inkMain,
  },
});
