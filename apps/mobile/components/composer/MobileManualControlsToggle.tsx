import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  colors,
  mobileTouchTarget,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface MobileManualControlsToggleProps {
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Phase 2 (4): with '委ねる' (delegate) as the default entry point, the manual
 * controls (mode selector / agent control bar / OTHERS) are no longer permanent
 * fixtures in the bottom dock. This small toggle demotes them behind a single
 * opt-in trigger, so the default surface stays focused on '委ねる' + composer.
 */
export function MobileManualControlsToggle({
  expanded,
  onToggle,
}: MobileManualControlsToggleProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={expanded ? '手動で選ぶをとじる' : '手動で選ぶをひらく'}
    >
      <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      <Text style={styles.label}>
        {expanded ? '自分で選ぶ（とじる）' : '自分で選ぶ（視点・モード）'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: radius.full,
    minHeight: mobileTouchTarget.minimum,
  },
  chevron: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
    fontWeight: '600',
  },
  label: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
