import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { UNIVERSAL_AGENTS, type UniversalAgentId } from '../../../../packages/shared/src';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

// Re-export so callers that imported AgentKey from here continue to work.
export type AgentKey = UniversalAgentId;

interface MobileAgentControlBarProps {
  selected: AgentKey;
  onSelect: (key: AgentKey) => void;
}

export function MobileAgentControlBar({
  selected,
  onSelect,
}: MobileAgentControlBarProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {UNIVERSAL_AGENTS.map((agent) => {
          const isActive = selected === agent.id;
          return (
            <TouchableOpacity
              key={agent.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(agent.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{agent.emoji}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {agent.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
    minHeight: 44,
    minWidth: 72,
  },
  chipActive: {
    backgroundColor: colors.accentIndigoSoft,
    borderColor: colors.accentIndigo,
  },
  emoji: {
    fontSize: 15,
  },
  label: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.accentIndigo,
    fontWeight: '600',
  },
});
