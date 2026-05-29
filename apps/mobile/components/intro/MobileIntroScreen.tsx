import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from 'lucide-react-native';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  radius,
  spacing,
  type as typeScale,
  shadow,
} from '../../theme/tokens';

const HINTS = [
  '言葉にならないけど、ずっと胸にあるもの',
  '最近、少しだけ引っかかっていること',
  '誰にも言っていない、小さな違和感',
  '今の自分を、少しだけ見てみたい',
] as const;

interface MobileIntroScreenProps {
  onHintSelect: (hint: string) => void;
}

export function MobileIntroScreen({ onHintSelect }: MobileIntroScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Feather size={24} color={colors.inkFaint} />
        </View>
        <Text style={styles.heading}>まずは、ひとつ置いてみる。</Text>
        <Text style={styles.sub}>まだ言葉になっていなくても、大丈夫です。</Text>
      </View>
      <Text style={styles.hintTitle}>ヒント</Text>
      <View style={styles.hints}>
        {HINTS.map((hint) => (
          <TouchableOpacity
            key={hint}
            style={styles.hintChip}
            onPress={() => onHintSelect(hint)}
            activeOpacity={0.7}
          >
            <Text style={styles.hintText}>{hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: mobileLayout.onboardingMaxWidth,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.md,
    ...shadow.card,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
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
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  sub: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.body,
    textAlign: 'center',
  },
  hintTitle: {
    fontSize: typeScale.small,
    color: colors.inkFaint,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  hints: {
    width: '100%',
    maxWidth: mobileLayout.onboardingMaxWidth,
    gap: spacing.sm,
  },
  hintChip: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: 52,
    justifyContent: 'center',
  },
  hintText: {
    fontSize: typeScale.body,
    color: colors.inkSoft,
    lineHeight: 22,
  },
});
