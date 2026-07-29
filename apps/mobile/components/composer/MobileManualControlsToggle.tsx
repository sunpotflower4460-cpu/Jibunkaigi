import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import {
  colors,
  mobileMotion,
  mobileTouchTarget,
  radius,
  spacing,
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
 *
 * The chevron rotates smoothly (0° → 90°) to mirror the expand/collapse of the
 * panel, instead of swapping glyphs abruptly.
 */
export function MobileManualControlsToggle({
  expanded,
  onToggle,
}: MobileManualControlsToggleProps) {
  // Animated value: 0 = collapsed (▸ points right), 1 = expanded (▾ points down).
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: mobileMotion.duration.quick,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={expanded ? '自分で視点を選ぶをとじる' : '自分で視点を選ぶをひらく'}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <ChevronRight size={13} color={colors.inkFaint} />
      </Animated.View>
      <Text style={styles.label}>
        {expanded ? '自分で選ぶ（とじる）' : '自分で視点を選ぶ'}
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
  label: {
    // Web版の補助ラベルは .typo-hint（極小・font-bold）
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
