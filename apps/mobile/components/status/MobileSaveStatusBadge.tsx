import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { UniversalRuntimeStatus } from '@jibunkaigi/shared';
import { getMobileStorageStatusSummary } from '../../services/storageStatus';
import { colors, mobileLayout, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileSaveStatusBadgeProps {
  status: UniversalRuntimeStatus;
}

export function MobileSaveStatusBadge({ status }: MobileSaveStatusBadgeProps) {
  const summary = getMobileStorageStatusSummary(status);

  return (
    <View style={[styles.wrap, getCardToneStyle(summary.tone)]}>
      <View style={[styles.badge, getBadgeToneStyle(summary.tone)]}>
        <Text style={[styles.badgeText, getBadgeTextToneStyle(summary.tone)]}>
          {summary.badgeLabel}
        </Text>
      </View>
      <Text style={styles.title}>{summary.title}</Text>
      <Text style={styles.message}>{summary.summary}</Text>
      <Text style={styles.caption}>
        詳しくは会議一覧の「保存状態 / データ削除」で確認できます。
      </Text>
    </View>
  );
}

function getCardToneStyle(tone: ReturnType<typeof getMobileStorageStatusSummary>['tone']) {
  switch (tone) {
    case 'accent':
      return styles.wrapAccent;
    case 'danger':
      return styles.wrapDanger;
    case 'warning':
      return styles.wrapWarning;
    default:
      return null;
  }
}

function getBadgeToneStyle(tone: ReturnType<typeof getMobileStorageStatusSummary>['tone']) {
  switch (tone) {
    case 'accent':
      return styles.badgeAccent;
    case 'danger':
      return styles.badgeDanger;
    case 'warning':
      return styles.badgeWarning;
    default:
      return styles.badgeNeutral;
  }
}

function getBadgeTextToneStyle(tone: ReturnType<typeof getMobileStorageStatusSummary>['tone']) {
  switch (tone) {
    case 'accent':
      return styles.badgeTextAccent;
    case 'danger':
      return styles.badgeTextDanger;
    case 'warning':
      return styles.badgeTextWarning;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: mobileLayout.panelMaxWidth,
    alignSelf: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  wrapAccent: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentSurface,
  },
  wrapWarning: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSurface,
  },
  wrapDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeNeutral: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
  },
  badgeAccent: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.surfaceStrong,
  },
  badgeWarning: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.surfaceSoft,
  },
  badgeDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.surfaceStrong,
  },
  badgeText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  badgeTextAccent: {
    color: colors.accentIndigo,
  },
  badgeTextWarning: {
    color: colors.inkMain,
  },
  badgeTextDanger: {
    color: colors.danger,
  },
  title: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  message: {
    fontSize: typeScale.tiny,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  caption: {
    fontSize: typeScale.tiny,
    lineHeight: 18,
    color: colors.inkMuted,
  },
});
