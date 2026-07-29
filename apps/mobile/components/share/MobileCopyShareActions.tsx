import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileCopyShareActionsProps {
  onCopy: () => void;
  onShare: () => void;
}

export function MobileCopyShareActions({
  onCopy,
  onShare,
}: MobileCopyShareActionsProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onCopy}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="このテキストをコピー"
      >
        <Text style={styles.actionText}>コピー</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onShare}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="このテキストを共有"
      >
        <Text style={styles.actionText}>共有</Text>
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
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
  },
});
