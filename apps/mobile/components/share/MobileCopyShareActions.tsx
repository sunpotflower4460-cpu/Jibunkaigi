import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useT } from '../../i18n';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileCopyShareActionsProps {
  onCopy: () => void;
  onShare: () => void;
}

export function MobileCopyShareActions({
  onCopy,
  onShare,
}: MobileCopyShareActionsProps) {
  const t = useT();
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onCopy}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('share.copy.aria')}
      >
        <Text style={styles.actionText}>{t('share.copy')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onShare}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('share.share.aria')}
      >
        <Text style={styles.actionText}>{t('share.share')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
  },
});
