import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, mobileLineHeights, radius, spacing, type as typeScale } from '../../theme/tokens';

interface ReflectionShelfItemProps {
  emoji: string;
  title: string;
  description: string;
  comingSoonLabel?: string;
  disabled?: boolean;
  onPress?: () => void;
}

export function ReflectionShelfItem({
  emoji,
  title,
  description,
  comingSoonLabel,
  disabled = true,
  onPress,
}: ReflectionShelfItemProps) {
  return (
    <TouchableOpacity
      style={[styles.card, !disabled && styles.cardEnabled]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      accessibilityHint={comingSoonLabel}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      {comingSoonLabel ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{comingSoonLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    opacity: 0.72,
  },
  cardEnabled: {
    opacity: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typeScale.body,
    fontWeight: '600',
    color: colors.inkStrong,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.small,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceFaint,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  badgeText: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
    letterSpacing: 0.2,
  },
});
