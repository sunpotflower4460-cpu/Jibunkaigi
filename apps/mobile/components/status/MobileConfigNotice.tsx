import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  buildUniversalStatusItems,
  type UniversalRuntimeStatus,
} from '@jibunkaigi/shared';
import { colors, mobileLayout, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileConfigNoticeProps {
  status: UniversalRuntimeStatus;
}

export function MobileConfigNotice({ status }: MobileConfigNoticeProps) {
  if (!__DEV__) return null;

  const items = buildUniversalStatusItems(status).filter((item) => !item.visibleInProduction);
  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.wrap}
    >
      <View style={styles.notice}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: mobileLayout.panelMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingRight: spacing.xxl,
    marginBottom: spacing.sm,
  },
  notice: {
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
    maxWidth: 260,
  },
});
