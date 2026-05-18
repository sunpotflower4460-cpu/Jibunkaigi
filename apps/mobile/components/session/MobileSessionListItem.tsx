import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { UniversalSession } from '../../state/mobileTypes';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileSessionListItemProps {
  session: UniversalSession;
  isActive: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function formatUpdatedAt(updatedAt: number): string {
  return new Date(updatedAt).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MobileSessionListItem({
  session,
  isActive,
  onOpen,
  onEdit,
  onTogglePin,
  onDelete,
}: MobileSessionListItemProps) {
  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.metaRow}>
        <Text style={[styles.title, isActive && styles.titleActive]} numberOfLines={2}>
          {session.title}
        </Text>
        <View style={styles.badges}>
          {session.pinned ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PIN</Text>
            </View>
          ) : null}
          {isActive ? (
            <View style={[styles.badge, styles.badgeActive]}>
              <Text style={[styles.badgeText, styles.badgeActiveText]}>表示中</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.updatedAt}>更新: {formatUpdatedAt(session.updatedAt)}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onOpen}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${session.title}を開く`}
        >
          <Text style={styles.actionText}>開く</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onEdit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${session.title}を編集`}
        >
          <Text style={styles.actionText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onTogglePin}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={session.pinned ? `${session.title}のピン留めを外す` : `${session.title}をピン留めする`}
        >
          <Text style={styles.actionText}>{session.pinned ? 'ピン解除' : 'ピン'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDelete}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${session.title}を削除`}
        >
          <Text style={styles.actionText}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cardActive: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigoSoft,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkMain,
    lineHeight: 18,
  },
  titleActive: {
    color: colors.accentIndigo,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  badgeActive: {
    borderColor: colors.accentIndigo,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  badgeText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  badgeActiveText: {
    color: colors.accentIndigo,
  },
  updatedAt: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
