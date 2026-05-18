import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

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
      accessibilityLabel="他のメンバーの視点を見る"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accentIndigo} />
      ) : (
        <View style={styles.inner}>
          <Text style={[styles.label, isDisabled && styles.labelDisabled]}>OTHERS</Text>
          <Text style={[styles.sub, isDisabled && styles.subDisabled]}>直近の問いに対して</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 132,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonDisabled: {
    borderColor: colors.borderSubtle,
    backgroundColor: 'transparent',
  },
  inner: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.accentIndigo,
    letterSpacing: 1,
  },
  labelDisabled: {
    color: colors.inkFaint,
  },
  sub: {
    fontSize: typeScale.tiny,
    color: colors.accentIndigo,
    opacity: 0.8,
  },
  subDisabled: {
    color: colors.inkFaint,
  },
});
