import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, type as typeScale } from '../../theme/tokens';

export function MobileEmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔮</Text>
      <Text style={styles.heading}>まずは、ひとつ置いてみる。</Text>
      <Text style={styles.sub}>まだ言葉になっていなくても、大丈夫です。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  icon: {
    fontSize: 40,
  },
  heading: {
    fontSize: typeScale.heading,
    fontWeight: '600',
    color: colors.inkStrong,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
});
