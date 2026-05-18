import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  buildUniversalStatusItems,
  type UniversalRuntimeStatus,
} from '../../../../packages/shared/src';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileConfigNoticeProps {
  status: UniversalRuntimeStatus;
}

export function MobileConfigNotice({ status }: MobileConfigNoticeProps) {
  if (!__DEV__) return null;

  const items = buildUniversalStatusItems(status).filter((item) => !item.visibleInProduction);
  if (items.length === 0) return null;

  return (
    <View style={styles.notice}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.message}>{item.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceFaint,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  label: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  message: {
    flexShrink: 1,
    fontSize: typeScale.small,
    color: colors.inkMuted,
  },
});
