import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  buildUniversalStatusItems,
  type UniversalRuntimeStatus,
} from '../../../../packages/shared/src';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileStatusStripProps {
  status: UniversalRuntimeStatus;
}

export function MobileStatusStrip({ status }: MobileStatusStripProps) {
  const items = buildUniversalStatusItems(status).filter(
    (item) => item.severity !== 'warning' && item.severity !== 'error' && item.visibleInProduction,
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  content: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  label: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  message: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    maxWidth: 180,
  },
});
