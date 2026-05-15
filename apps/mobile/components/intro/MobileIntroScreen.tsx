import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, radius, spacing, type as typeScale, shadow } from '../../theme/tokens';

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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>まずは、ひとつ置いてみる。</Text>
        <Text style={styles.sub}>まだ言葉になっていなくても、大丈夫です。</Text>
      </View>
      <Text style={styles.hintTitle}>ヒント</Text>
      <ScrollView
        contentContainerStyle={styles.hints}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
  },
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.md,
    ...shadow.card,
  },
  heading: {
    fontSize: typeScale.heading,
    fontWeight: '600',
    color: colors.inkStrong,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
    lineHeight: 24,
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
    gap: spacing.sm,
    paddingBottom: spacing.xl,
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
