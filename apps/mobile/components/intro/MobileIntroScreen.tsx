import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from 'lucide-react-native';
import { IconTile } from '../ui/MobileSurfaces';
import {
  colors,
  fonts,
  mobileLayout,
  mobileLineHeights,
  radius,
  spacing,
  type as typeScale,
  shadow,
} from '../../theme/tokens';

// Web版 translations.js の empty.hint.1〜4 と同じ文言・同じ並び。
const HINTS = [
  '言葉にならないけど、ずっと胸にあるもの',
  '最近、少しだけ引っかかっていること',
  '誰にも言っていない、小さな違和感',
  '今の自分を、少しだけ見てみたい',
] as const;

interface MobileIntroScreenProps {
  onHintSelect: (hint: string) => void;
}

/**
 * 最初の画面。Web版 EmptyState.jsx と同じ構成に揃える。
 * アイコンタイル → 明朝の見出し2行 → 補足 → ヒントカード4枚（.hint-card）。
 */
export function MobileIntroScreen({ onHintSelect }: MobileIntroScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <IconTile size={88}>
        <Feather size={34} strokeWidth={1.75} color={colors.inkFaint} />
      </IconTile>

      <Text style={styles.heading}>
        まずは、ひとつ{'\n'}置いてみる。
      </Text>
      <Text style={styles.sub}>まだ言葉になっていなくても、大丈夫です。</Text>

      <View style={styles.hints}>
        {HINTS.map((hint) => (
          <TouchableOpacity
            key={hint}
            style={[styles.hintCard, shadow.soft]}
            onPress={() => onHintSelect(hint)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={`例として入力: ${hint}`}
          >
            {/* .hint-card__dot — 藍から菫へ流れる小さな光の点 */}
            <View style={styles.hintDot} />
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  heading: {
    // Web版: .jk-serif .title-ink .typo-hero-title（mb-3.5）
    fontFamily: fonts.serif,
    fontSize: typeScale.title,
    fontWeight: '700',
    color: colors.inkStrong,
    textAlign: 'center',
    lineHeight: mobileLineHeights.title,
    letterSpacing: -0.3,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sub: {
    // Web版: .typo-body-secondary（mb-11）
    fontSize: typeScale.small,
    color: colors.inkSoft,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: mobileLineHeights.body,
    marginBottom: spacing.xxl,
  },
  hints: {
    width: '100%',
    maxWidth: mobileLayout.onboardingMaxWidth,
    gap: spacing.lg,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(252,253,255,0.72)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    minHeight: 62,
  },
  hintDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.accentIndigo,
    flexShrink: 0,
  },
  hintText: {
    flex: 1,
    fontSize: typeScale.small,
    color: colors.inkSoft,
    fontWeight: '700',
    lineHeight: mobileLineHeights.body,
  },
});
