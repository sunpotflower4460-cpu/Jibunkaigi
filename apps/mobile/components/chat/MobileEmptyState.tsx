import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, type as typeScale } from '../../theme/tokens';

export function MobileEmptyState() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔮</Text>
        <Text style={styles.heading}>まずは、ひとつ置いてみる。</Text>
        <Text style={styles.sub}>まだ言葉になっていなくても、大丈夫です。</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
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
