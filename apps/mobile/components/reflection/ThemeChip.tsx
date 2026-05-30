import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ThemeStat } from '../../services/themeArchive';
import { colors, mobileLineHeights, radius, spacing, type as typeScale } from '../../theme/tokens';

interface ThemeChipProps {
  theme: ThemeStat;
  index: number;
}

function getThemeFontSize(index: number): number {
  if (index < 3) return typeScale.body;
  if (index < 8) return typeScale.small;
  return typeScale.tiny;
}

export function ThemeChip({ theme, index }: ThemeChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.keyword, { fontSize: getThemeFontSize(index) }]}>{theme.keyword}</Text>
      <Text style={styles.score}>{Math.round(theme.score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  keyword: {
    color: colors.inkStrong,
    fontWeight: '700',
    lineHeight: mobileLineHeights.small,
  },
  score: {
    color: colors.inkFaint,
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.tiny,
  },
});
