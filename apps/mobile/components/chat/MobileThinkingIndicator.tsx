import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { UniversalAgentId, UniversalModeId } from '../../state/mobileTypes';
import { getThinkingText } from '@jibunkaigi/shared';
import { colors, spacing, type as typeScale } from '../../theme/tokens';

interface MobileThinkingIndicatorProps {
  agentId: UniversalAgentId;
  modeId?: UniversalModeId;
}

export function MobileThinkingIndicator({ agentId, modeId = 'dialogue' }: MobileThinkingIndicatorProps) {
  const text = getThinkingText(agentId, modeId);

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
