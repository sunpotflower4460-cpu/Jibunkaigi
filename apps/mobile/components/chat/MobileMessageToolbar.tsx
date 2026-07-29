import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Copy, Share2, Trash2, Users } from 'lucide-react-native';
import { UNIVERSAL_MESSAGE_ACTIONS } from '@jibunkaigi/shared';
import {
  colors,
  mobileTouchTarget,
  radius,
  spacing,
} from '../../theme/tokens';

interface MobileMessageToolbarProps {
  messageId: string;
  canRequestOthers?: boolean;
  onCopy: (messageId: string) => void;
  onShare: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onRequestOthers?: (messageId: string) => void;
}

const ACTION_ICONS = {
  copy: Copy,
  share: Share2,
  delete: Trash2,
  others: Users,
} as const;

/**
 * メッセージ操作。Web版 MessageBubble.jsx のツールバーに揃えて、
 * 文字のピルではなく小さなアイコンをひとつのガラス枠にまとめる。
 * ただしタップ領域は 44px を確保する（Web版のモバイル表示も常時表示）。
 */
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
        const Icon = ACTION_ICONS[action.id as keyof typeof ACTION_ICONS] ?? Copy;
        return (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
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
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={action.id === 'others' ? 'ほかの声も聴く' : `${action.label}を実行`}
          >
            {/* Web版は削除も既定は slate（rose になるのは hover 時だけ） */}
            <Icon size={13} color={colors.inkFaint} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Web版: bg-white/60 rounded-lg shadow-sm gap-1 p-1
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: spacing.sm,
    padding: 2,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  actionButton: {
    minHeight: mobileTouchTarget.minimum,
    minWidth: mobileTouchTarget.minimum,
    borderRadius: radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
