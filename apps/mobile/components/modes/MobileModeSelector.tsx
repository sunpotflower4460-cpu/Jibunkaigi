import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { UNIVERSAL_MODES, type UniversalModeId } from '@jibunkaigi/shared';
import { NeuConcave } from '../ui/MobileSurfaces';
import { colors, radius, spacing } from '../../theme/tokens';

interface MobileModeSelectorProps {
  selected: UniversalModeId;
  onSelect: (modeId: UniversalModeId) => void;
}

/**
 * 応答モードの選択。Web版 TopHeader.jsx の neu-concave セグメントに揃える。
 * 選択中だけ白く浮き上がり、それ以外は沈んだ土台に溶ける。
 */
export function MobileModeSelector({ selected, onSelect }: MobileModeSelectorProps) {
  return (
    <View style={styles.wrapper}>
      <NeuConcave style={styles.group}>
        {UNIVERSAL_MODES.map((mode) => {
          const isActive = selected === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(mode.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`応答モード: ${mode.label}`}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>{mode.label}</Text>
            </TouchableOpacity>
          );
        })}
      </NeuConcave>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  group: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 36,
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  label: {
    // Web版のモードラベルは 10px / font-black
    fontSize: 10,
    color: colors.inkFaint,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  labelActive: {
    color: colors.inkStrong,
  },
});
