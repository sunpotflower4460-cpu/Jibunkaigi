import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface ReflectionShelfTriggerProps {
  onPress: () => void;
}

export function ReflectionShelfTrigger({ onPress }: ReflectionShelfTriggerProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="潜るメニューを開く"
      accessibilityHint="会話のあとに残ったものを置いておく棚を開きます"
    >
      <Text style={styles.label}>潜る</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceFaint,
  },
  label: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    letterSpacing: 0.4,
  },
});
