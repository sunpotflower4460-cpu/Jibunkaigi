import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Edit3, UserCircle2 } from 'lucide-react-native';
import { DEFAULT_USER_NAME, normalizeUserName } from '@jibunkaigi/shared';
import { IconTile } from '../ui/MobileSurfaces';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileUserNameTriggerProps {
  userName?: string;
  compact?: boolean;
  onPress: () => void;
}

/**
 * 名前の表示 / 編集導線。Web版 UserProfileButton.jsx に揃える
 * （丸いアイコンタイル + CLIENT ラベル + 名前 + 編集アイコン）。
 * ヘッダーの狭い場所に置くため、compact ではアイコンとラベルだけにする。
 */
export function MobileUserNameTrigger({
  userName,
  compact = false,
  onPress,
}: MobileUserNameTriggerProps) {
  const resolvedUserName = normalizeUserName(userName ?? DEFAULT_USER_NAME);

  return (
    <TouchableOpacity
      style={styles.trigger}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`お名前を編集: 現在 ${resolvedUserName}`}
    >
      <IconTile size={24} rounded>
        <UserCircle2 size={13} strokeWidth={1.75} color={colors.inkFaint} />
      </IconTile>
      {compact ? null : (
        <View style={styles.texts}>
          <Text style={styles.eyebrow}>CLIENT</Text>
          <Text style={styles.name} numberOfLines={1}>
            {resolvedUserName}
          </Text>
        </View>
      )}
      <Edit3 size={11} color={colors.inkFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,
    maxWidth: 180,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
  },
  texts: {
    minWidth: 0,
    flexShrink: 1,
  },
  eyebrow: {
    fontSize: typeScale.label,
    fontWeight: '900',
    color: colors.inkFaint,
    letterSpacing: 1.8,
  },
  name: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkStrong,
  },
});
