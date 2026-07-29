import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Edit3, Pin, Trash2 } from 'lucide-react-native';
import type { UniversalSession } from '../../state/mobileTypes';
import { colors, radius, shadow, spacing, type as typeScale } from '../../theme/tokens';

interface MobileSessionListItemProps {
  session: UniversalSession;
  isActive: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

/**
 * セッション1件。Web版 SessionList.jsx の session-card-active / session-card-idle に揃える。
 * カード全体が「開く」で、編集・ピン・削除は右端に小さなアイコンで並ぶ。
 */
export function MobileSessionListItem({
  session,
  isActive,
  onOpen,
  onEdit,
  onTogglePin,
  onDelete,
}: MobileSessionListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive ? styles.cardActive : styles.cardIdle]}
      onPress={onOpen}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${session.title}を開く`}
    >
      <View style={styles.row}>
        <View style={styles.titleWrap}>
          {session.pinned ? (
            <Pin size={10} color="#f59e0b" fill="#f59e0b" />
          ) : null}
          <Text
            style={[styles.title, isActive && styles.titleActive]}
            numberOfLines={1}
          >
            {session.title || '無題'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${session.title}のタイトルを編集`}
          >
            <Edit3 size={12} color={colors.inkMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onTogglePin}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={
              session.pinned
                ? `${session.title}のピン留めを外す`
                : `${session.title}をピン留めする`
            }
          >
            <Pin size={12} color={session.pinned ? '#f59e0b' : colors.inkMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${session.title}を削除`}
          >
            <Trash2 size={12} color={colors.inkMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    // Web版 rounded-[1.35rem] px-4 py-3
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  cardActive: {
    backgroundColor: 'rgba(250,252,255,0.96)',
    borderColor: 'rgba(165,180,252,0.46)',
    ...shadow.card,
  },
  cardIdle: {
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    // Web版: text-xs font-bold
    fontSize: typeScale.tiny + 1,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  titleActive: {
    color: '#4338ca',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
