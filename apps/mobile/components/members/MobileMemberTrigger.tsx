import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useT } from '../../i18n';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileMemberTriggerProps {
  onPress: () => void;
}

export function MobileMemberTrigger({ onPress }: MobileMemberTriggerProps) {
  const t = useT();
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={t('members.trigger.aria')}
    >
      <Text style={styles.label}>{t('members.trigger')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    minHeight: 36,
    justifyContent: 'center',
  },
  label: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    fontWeight: '500',
  },
});
