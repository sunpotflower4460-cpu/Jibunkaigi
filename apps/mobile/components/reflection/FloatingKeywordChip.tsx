import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { FloatingKeyword } from '../../services/keywordField';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface FloatingKeywordChipProps {
  keyword: FloatingKeyword;
}

export function FloatingKeywordChip({ keyword }: FloatingKeywordChipProps) {
  return (
    <View style={[styles.chip, { opacity: keyword.opacity }]}>
      <Text style={[styles.label, { fontSize: keyword.fontSize }]}>{keyword.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.inkStrong,
    fontWeight: '700',
    fontSize: typeScale.small,
  },
});
