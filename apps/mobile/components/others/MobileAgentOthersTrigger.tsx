/**
 * MobileAgentOthersTrigger
 *
 * Phase 3A: agent message の直下に表示する「ほかの声も聴く」導線。
 *
 * - 押すとその agent message の messageId を requestOthers に渡す。
 * - isLoading 中は ActivityIndicator + disabled 表示。
 * - 英字「OTHERS」は使わない。
 * - MobileOthersTrigger（手動パネル内）とは別コンポーネントとして共存。
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  colors,
  mobileTouchTarget,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface MobileAgentOthersTriggerProps {
  messageId: string;
  onPress: (messageId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MobileAgentOthersTrigger({
  messageId,
  onPress,
  isLoading = false,
  disabled = false,
}: MobileAgentOthersTriggerProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={() => onPress(messageId)}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="ほかの声も聴く"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accentIndigo} style={styles.spinner} />
          <Text style={[styles.label, styles.labelDisabled]}>聴いています…</Text>
        </View>
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
          ほかの声も聴く
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: mobileTouchTarget.minimum,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentIndigoSoft,
    backgroundColor: 'transparent',
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    borderColor: colors.borderSubtle,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spinner: {
    width: 14,
    height: 14,
  },
  label: {
    fontSize: typeScale.tiny,
    fontWeight: '500',
    color: colors.accentIndigo,
    letterSpacing: 0.2,
  },
  labelDisabled: {
    color: colors.inkFaint,
  },
});
