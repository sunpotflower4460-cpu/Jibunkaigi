import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { UniversalSession } from '../../state/mobileTypes';
import { useT } from '../../i18n';
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
  const t = useT();
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
              <Text style={[styles.badgeText, styles.badgeActiveText]}>{t('sessionItem.active')}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.updatedAt}>
        {t('sessionItem.updated', { time: formatUpdatedAt(session.updatedAt) })}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onOpen}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('sessionItem.open.aria', { title: session.title })}
        >
          <Text style={styles.actionText}>{t('sessionItem.open')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onEdit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('sessionItem.edit.aria', { title: session.title })}
        >
          <Text style={styles.actionText}>{t('sessionItem.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onTogglePin}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            session.pinned
              ? t('sessionItem.pin.remove.aria', { title: session.title })
              : t('sessionItem.pin.add.aria', { title: session.title })
          }
        >
          <Text style={styles.actionText}>
            {session.pinned ? t('sessionItem.unpin') : t('sessionItem.pin')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={onDelete}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('sessionItem.delete.aria', { title: session.title })}
        >
          <Text style={[styles.actionText, styles.actionTextDanger]}>{t('sessionItem.delete')}</Text>
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
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cardActive: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentSurface,
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
    backgroundColor: colors.surfaceStrong,
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
    backgroundColor: colors.surfaceFaint,
    justifyContent: 'center',
  },
  actionButtonDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  actionText: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  actionTextDanger: {
    color: colors.danger,
  },
});
