import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

export type AgentKey =
  | 'mirror'
  | 'delegate'
  | 'ray'
  | 'joe'
  | 'ken'
  | 'mina'
  | 'satou';

interface Agent {
  key: AgentKey;
  label: string;
  emoji: string;
}

const AGENTS: Agent[] = [
  { key: 'mirror', label: '心の鏡', emoji: '🪞' },
  { key: 'delegate', label: '委ねる', emoji: '🌊' },
  { key: 'ray', label: 'レイ', emoji: '✨' },
  { key: 'joe', label: 'ジョー', emoji: '🔍' },
  { key: 'ken', label: 'ケン', emoji: '⚡' },
  { key: 'mina', label: 'ミナ', emoji: '💙' },
  { key: 'satou', label: 'サトウ', emoji: '🌿' },
];

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
        {AGENTS.map((agent) => {
          const isActive = selected === agent.key;
          return (
            <TouchableOpacity
              key={agent.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(agent.key)}
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
