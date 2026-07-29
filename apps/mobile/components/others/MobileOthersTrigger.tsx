import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Users } from 'lucide-react-native';
import {
  colors,
  mobileTouchTarget,
  radius,
  spacing,
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
        <ActivityIndicator size="small" color={colors.inkMuted} />
      ) : (
        <View style={styles.inner}>
          <Users size={13} color={isDisabled ? colors.inkFaint : colors.inkSoft} />
          <View>
            <Text style={[styles.label, isDisabled && styles.labelDisabled]}>ほかの視点</Text>
            <Text style={[styles.sub, isDisabled && styles.subDisabled]}>いまの問いを別角度で見る</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Web版 .agent-chip と同じ体裁（アイコン + 名前 + 役割）
  button: {
    minHeight: mobileTouchTarget.comfortable,
    minWidth: 132,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(252,253,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '900',
    color: colors.inkSoft,
    letterSpacing: 0.1,
  },
  labelDisabled: {
    color: colors.inkFaint,
  },
  sub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.inkMuted,
    opacity: 0.6,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  subDisabled: {
    color: colors.inkFaint,
  },
});
