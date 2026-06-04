import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { UNIVERSAL_AGENTS, type UniversalAgentId } from '@jibunkaigi/shared';
import { useT } from '../../i18n';
import {
  colors,
  mobileTouchTarget,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

// Re-export for backward compatibility.
export type AgentKey = UniversalAgentId;

interface MobileAgentControlBarProps {
  selected: AgentKey;
  onSelect: (key: AgentKey) => void;
}

export function MobileAgentControlBar({
  selected,
  onSelect,
}: MobileAgentControlBarProps) {
  const t = useT();
  const agents = UNIVERSAL_AGENTS.filter((a) => a.shouldAppearInAgentBar);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.caption}>{t('agentcontrol.caption')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {agents.map((agent) => {
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
    gap: spacing.xs,
  },
  caption: {
    paddingHorizontal: spacing.lg,
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkFaint,
    letterSpacing: 0.8,
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
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
    minHeight: mobileTouchTarget.minimum,
    minWidth: 72,
  },
  chipActive: {
    backgroundColor: colors.accentSurface,
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
