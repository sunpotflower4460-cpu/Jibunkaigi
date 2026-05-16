import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { UNIVERSAL_MODES, type UniversalModeId } from '../../../../packages/shared/src/index';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileModeSelectorProps {
  selected: UniversalModeId;
  onSelect: (modeId: UniversalModeId) => void;
}

export function MobileModeSelector({ selected, onSelect }: MobileModeSelectorProps) {
  return (
    <View style={styles.wrapper}>
      {UNIVERSAL_MODES.map((mode) => {
        const isActive = selected === mode.id;
        return (
          <TouchableOpacity
            key={mode.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(mode.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.emoji}>{mode.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{mode.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
    minHeight: 40,
  },
  chipActive: {
    backgroundColor: colors.accentIndigoSoft,
    borderColor: colors.accentIndigo,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.accentIndigo,
    fontWeight: '600',
  },
});

