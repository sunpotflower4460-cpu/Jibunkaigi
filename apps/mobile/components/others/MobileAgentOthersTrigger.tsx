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
import { Users } from 'lucide-react-native';
import {
  colors,
  mobileTouchTarget,
  radius,
  spacing,
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
          <ActivityIndicator size="small" color={colors.inkMuted} style={styles.spinner} />
          <Text style={[styles.label, styles.labelDisabled]}>聴いています…</Text>
        </View>
      ) : (
        <View style={styles.loadingRow}>
          <Users size={11} color={isDisabled ? colors.inkFaint : colors.inkMuted} />
          <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
            ほかの声も聴く
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Web版 MessageBubble.jsx の OTHERS タブ:
  //   px-3 py-1.5 rounded-full bg-white/50 text-slate-500 border-white/70 text-[10px] font-black
  button: {
    alignSelf: 'flex-start',
    minHeight: mobileTouchTarget.minimum,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spinner: {
    width: 14,
    height: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.inkMuted,
    letterSpacing: 0.3,
  },
  labelDisabled: {
    color: colors.inkFaint,
  },
});
