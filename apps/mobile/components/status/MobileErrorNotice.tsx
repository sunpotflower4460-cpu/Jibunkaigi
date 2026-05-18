import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  buildUniversalStatusItems,
  type UniversalRuntimeStatus,
} from '../../../../packages/shared/src';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileErrorNoticeProps {
  status: UniversalRuntimeStatus;
}

export function MobileErrorNotice({ status }: MobileErrorNoticeProps) {
  const items = buildUniversalStatusItems(status).filter(
    (item) => item.severity === 'warning' || item.severity === 'error',
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.id} style={styles.notice}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.message}>{item.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  notice: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.24)',
  },
  label: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typeScale.small,
    lineHeight: 18,
    color: colors.inkMain,
  },
});
