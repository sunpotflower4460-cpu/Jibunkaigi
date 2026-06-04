import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useT } from '../../i18n';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileLoadingOverlayProps {
  visible: boolean;
}

export function MobileLoadingOverlay({ visible }: MobileLoadingOverlayProps) {
  const t = useT();
  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator color={colors.accentIndigo} />
        <Text style={styles.label}>{t('loading.label')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(238, 244, 251, 0.68)',
    zIndex: 20,
  },
  card: {
    minWidth: 220,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  label: {
    fontSize: typeScale.small,
    color: colors.inkMain,
  },
});
