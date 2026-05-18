import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronUp, X } from 'lucide-react-native';
import {
  UNIVERSAL_AGENTS,
  type UniversalAgentId,
  type UniversalComposerVisibility,
} from '../../../../packages/shared/src';
import {
  colors,
  mobileLayout,
  mobileTouchTarget,
  radius,
  spacing,
  shadow,
  type as typeScale,
} from '../../theme/tokens';

interface MobileFloatingAgentBarProps {
  selectedAgent: UniversalAgentId;
  onSelectAgent: (agentId: UniversalAgentId) => void;
  hasMessages: boolean;
  composerVisibility: UniversalComposerVisibility;
  bottomDockHeight: number;
  onHeightChange?: (height: number) => void;
}

export function MobileFloatingAgentBar({
  selectedAgent,
  onSelectAgent,
  hasMessages,
  composerVisibility,
  bottomDockHeight,
  onHeightChange,
}: MobileFloatingAgentBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasEverHadMessages, setHasEverHadMessages] = useState(hasMessages);

  useEffect(() => {
    if (hasMessages) {
      setHasEverHadMessages(true);
    }
  }, [hasMessages]);

  useEffect(() => {
    if (!hasEverHadMessages) {
      onHeightChange?.(0);
    }
  }, [hasEverHadMessages, onHeightChange]);

  const agents = useMemo(
    () => UNIVERSAL_AGENTS.filter((agent) => agent.shouldAppearInAgentBar),
    [],
  );
  const selected = agents.find((agent) => agent.id === selectedAgent) ?? agents[0];

  if (!hasEverHadMessages) {
    return null;
  }

  const bottomOffset = Math.max(bottomDockHeight, composerVisibility === 'open' ? 220 : 156) + spacing.sm;

  if (!isOpen) {
    return (
      <View pointerEvents="box-none" style={styles.portal}>
        <View
          style={[styles.collapsedWrap, { bottom: bottomOffset }]}
          onLayout={(event) => {
            onHeightChange?.(event.nativeEvent.layout.height);
          }}
        >
          <TouchableOpacity
            style={styles.collapsedToggle}
            onPress={() => setIsOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="視点を開く"
          >
            <ChevronUp size={14} color={colors.inkMuted} />
            <Text style={styles.collapsedToggleText}>視点を開く</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" style={styles.portal}>
      <View
        style={[styles.openWrap, { bottom: bottomOffset }]}
        onLayout={(event) => {
          onHeightChange?.(event.nativeEvent.layout.height);
        }}
      >
        <View style={styles.rail}>
          <View style={styles.railHeader}>
            <Text style={styles.railCaption}>現在: {selected?.label ?? 'レイ'}</Text>
            <TouchableOpacity
              style={styles.closeToggle}
              onPress={() => setIsOpen(false)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="視点を閉じる"
            >
              <X size={14} color={colors.inkMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railContent}
          >
            {agents.map((agent) => {
              const isActive = agent.id === selectedAgent;
              return (
                <TouchableOpacity
                  key={agent.id}
                  style={[styles.agentChip, isActive && styles.agentChipActive]}
                  onPress={() => onSelectAgent(agent.id)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${agent.label}を選ぶ`}
                >
                  <Text style={styles.agentEmoji}>{agent.emoji}</Text>
                  <Text style={[styles.agentLabel, isActive && styles.agentLabelActive]}>
                    {agent.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  collapsedWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  collapsedToggle: {
    minHeight: mobileTouchTarget.minimum,
    minWidth: 132,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.soft,
  },
  collapsedToggleText: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  openWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  rail: {
    width: '100%',
    maxWidth: mobileLayout.panelMaxWidth,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadow.card,
  },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  railCaption: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  closeToggle: {
    minHeight: mobileTouchTarget.minimum,
    minWidth: mobileTouchTarget.minimum,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentChip: {
    minHeight: mobileTouchTarget.minimum,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  agentChipActive: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentSurface,
  },
  agentEmoji: {
    fontSize: 15,
  },
  agentLabel: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  agentLabelActive: {
    color: colors.accentIndigo,
  },
});
