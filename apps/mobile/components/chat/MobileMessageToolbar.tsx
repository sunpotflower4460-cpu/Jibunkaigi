import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UNIVERSAL_MESSAGE_ACTIONS } from '../../../../packages/shared/src';
import {
  colors,
  mobileLineHeights,
  mobileTouchTarget,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface MobileMessageToolbarProps {
  messageId: string;
  canRequestOthers?: boolean;
  onCopy: (messageId: string) => void;
  onShare: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onRequestOthers?: (messageId: string) => void;
}

export function MobileMessageToolbar({
  messageId,
  canRequestOthers = false,
  onCopy,
  onShare,
  onDelete,
  onRequestOthers,
}: MobileMessageToolbarProps) {
  const actions = UNIVERSAL_MESSAGE_ACTIONS.filter((action) => {
    if (action.id === 'others') {
      return canRequestOthers && Boolean(onRequestOthers);
    }
    return true;
  });

  return (
    <View style={styles.row}>
      {actions.map((action) => {
        const isDestructive = Boolean(action.destructive);
        return (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, isDestructive && styles.actionButtonDestructive]}
            onPress={() => {
              switch (action.id) {
                case 'copy':
                  onCopy(messageId);
                  break;
                case 'share':
                  onShare(messageId);
                  break;
                case 'delete':
                  onDelete(messageId);
                  break;
                case 'others':
                  onRequestOthers?.(messageId);
                  break;
              }
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`${action.label}を実行`}
          >
            <Text style={[styles.actionText, isDestructive && styles.actionTextDestructive]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'stretch',
  },
  actionButton: {
    minHeight: mobileTouchTarget.minimum,
    minWidth: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDestructive: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  actionText: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: mobileLineHeights.tiny,
  },
  actionTextDestructive: {
    color: colors.danger,
  },
});
