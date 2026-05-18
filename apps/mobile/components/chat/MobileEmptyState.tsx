import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Feather } from 'lucide-react-native';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

export function MobileEmptyState() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Feather size={24} color={colors.inkFaint} />
        </View>
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
    width: '100%',
    maxWidth: mobileLayout.onboardingMaxWidth,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceFaint,
    borderWidth: 1,
    borderColor: colors.borderSoft,
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
    lineHeight: mobileLineHeights.body,
  },
});
