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

interface MobileOthersTriggerProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function MobileOthersTrigger({
  onPress,
  isLoading = false,
  disabled = false,
}: MobileOthersTriggerProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel="ほかの視点をひらく"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accentIndigo} />
      ) : (
        <View style={styles.inner}>
          <Text style={[styles.label, isDisabled && styles.labelDisabled]}>ほかの視点</Text>
          <Text style={[styles.sub, isDisabled && styles.subDisabled]}>いまの問いを別角度で見る</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: mobileTouchTarget.comfortable,
    minWidth: 132,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentIndigoSoft,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonDisabled: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
  },
  inner: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.accentIndigo,
    letterSpacing: 0.8,
  },
  labelDisabled: {
    color: colors.inkFaint,
  },
  sub: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    opacity: 0.9,
  },
  subDisabled: {
    color: colors.inkFaint,
  },
});
