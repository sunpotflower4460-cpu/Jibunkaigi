import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Feather } from 'lucide-react-native';
import { IconTile } from '../ui/MobileSurfaces';
import {
  colors,
  fonts,
  mobileLayout,
  mobileLineHeights,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

/**
 * セッション内にメッセージが1件もないときの空状態。
 * Web版 EmptyState.jsx と同じ「アイコンタイル + 明朝の見出し2行 + 補足」に揃える。
 */
export function MobileEmptyState() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <IconTile size={88}>
          <Feather size={34} strokeWidth={1.75} color={colors.inkFaint} />
        </IconTile>
        <Text style={styles.heading}>
          まずは、ひとつ{'\n'}置いてみる。
        </Text>
        <Text style={styles.sub}>まだ言葉になっていなくても、大丈夫です。</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  },
  heading: {
    // Web版: .jk-serif .title-ink .typo-hero-title
    fontFamily: fonts.serif,
    fontSize: typeScale.title,
    fontWeight: '700',
    color: colors.inkStrong,
    textAlign: 'center',
    lineHeight: mobileLineHeights.title,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: typeScale.small,
    color: colors.inkSoft,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: mobileLineHeights.body,
  },
});
