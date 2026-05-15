import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

export type MessageRole = 'user' | 'agent';

interface MobileMessageBubbleProps {
  role: MessageRole;
  text: string;
  agentLabel?: string;
}

export function MobileMessageBubble({
  role,
  text,
  agentLabel,
}: MobileMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAgent]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAgent,
        ]}
      >
        {!isUser && agentLabel && (
          <Text style={styles.agentLabel}>{agentLabel}</Text>
        )}
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAgent]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowAgent: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleUser: {
    backgroundColor: colors.accentIndigo,
    borderBottomRightRadius: radius.xs,
  },
  bubbleAgent: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderBottomLeftRadius: radius.xs,
  },
  agentLabel: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  text: {
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  textUser: {
    color: '#ffffff',
  },
  textAgent: {
    color: colors.inkMain,
  },
});
