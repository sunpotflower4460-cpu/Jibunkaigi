import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { DEFAULT_USER_NAME, normalizeUserName } from '@jibunkaigi/shared';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileUserNameTriggerProps {
  userName?: string;
  compact?: boolean;
  onPress: () => void;
}

export function MobileUserNameTrigger({
  userName,
  compact = false,
  onPress,
}: MobileUserNameTriggerProps) {
  const resolvedUserName = normalizeUserName(userName ?? DEFAULT_USER_NAME);
  const label = compact ? '名前' : resolvedUserName;

  return (
    <TouchableOpacity
      style={styles.trigger}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="名前を変更する"
    >
      <Text style={styles.triggerText} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,
    maxWidth: 180,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  triggerText: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    fontWeight: '600',
  },
});
