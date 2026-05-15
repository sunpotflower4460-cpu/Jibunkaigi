import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { MobileAgentId } from '../../state/mobileTypes';
import { AGENT_THINKING_TEXT } from '../../services/mobileAgentMock';
import { colors, spacing, type as typeScale } from '../../theme/tokens';

interface MobileThinkingIndicatorProps {
  agentId: MobileAgentId;
}

export function MobileThinkingIndicator({ agentId }: MobileThinkingIndicatorProps) {
  const text = AGENT_THINKING_TEXT[agentId] ?? '考えています…';

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
