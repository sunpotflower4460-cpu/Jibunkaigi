import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MobileAgentId } from '../../state/mobileTypes';
import { getThinkingText } from '../../../../packages/shared/src';
import { colors, spacing, type as typeScale } from '../../theme/tokens';

interface MobileThinkingIndicatorProps {
  agentId: MobileAgentId;
}

export function MobileThinkingIndicator({ agentId }: MobileThinkingIndicatorProps) {
  // Default to 'dialogue' mode until mode selection is added to the mobile app.
  const text = getThinkingText(agentId, 'dialogue');

  return (
    <View style={styles.row}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  text: {
    fontSize: typeScale.small,
    color: colors.inkFaint,
    fontStyle: 'italic',
  },
});
