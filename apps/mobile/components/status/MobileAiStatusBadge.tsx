import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, type as typeScale } from '../../theme/tokens';

interface MobileAiStatusBadgeProps {
  source: 'proxy' | 'mock-fallback' | null;
  /** Set to true to hide in production builds */
  visible?: boolean;
}

export function MobileAiStatusBadge({ source, visible = __DEV__ }: MobileAiStatusBadgeProps) {
  if (!visible || source === null) return null;

  const isProxy = source === 'proxy';
  const label = isProxy ? 'AI: Proxy' : 'AI: Local fallback';

  return (
    <View style={[styles.badge, isProxy ? styles.proxy : styles.fallback]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  proxy: {
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  fallback: {
    backgroundColor: 'rgba(148,163,184,0.16)',
  },
  label: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
