import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileLegalLinksProps {
  onOpenLegal: () => void;
}

export function MobileLegalLinks({ onOpenLegal }: MobileLegalLinksProps) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.button}
        onPress={onOpenLegal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="利用規約やプライバシーの案内を開く"
      >
        <Text style={styles.buttonText}>利用規約 / プライバシー / 注意事項</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
