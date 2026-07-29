import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronUp, X } from 'lucide-react-native';
import {
  UNIVERSAL_AGENTS,
  type UniversalAgentId,
  type UniversalComposerVisibility,
} from '@jibunkaigi/shared';
import {
  colors,
  getAgentIcon,
  gradients,
  mobileLayout,
  mobileTouchTarget,
  radius,
  spacing,
  shadow,
} from '../../theme/tokens';

interface MobileFloatingAgentBarProps {
  selectedAgent: UniversalAgentId;
  onSelectAgent: (agentId: UniversalAgentId) => void;
  hasMessages: boolean;
  composerVisibility: UniversalComposerVisibility;
  bottomDockHeight: number;
  onHeightChange?: (height: number) => void;
}

// Web版 FloatingAgentBar.jsx のチップ配色。
//   心の鏡 → --dark / 委ねる → --gradient / ジョー → --orange / その他 → --light
const CHIP_ICON_COLORS: Partial<Record<UniversalAgentId, string>> = {
  mirror: '#a5b4fc',
  joe: '#ea580c',
};

export function MobileFloatingAgentBar({
  selectedAgent,
  onSelectAgent,
  hasMessages,
  composerVisibility,
  bottomDockHeight,
  onHeightChange,
}: MobileFloatingAgentBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Bar visibility follows the *current* state, not an "ever had messages"
  // latch. When the conversation is cleared / a new session starts, hasMessages
  // becomes false and the bar disappears naturally.
  useEffect(() => {
    if (!hasMessages) {
      // Collapse the open rail and report zero height so layout reflows.
      setIsOpen(false);
      onHeightChange?.(0);
    }
  }, [hasMessages, onHeightChange]);

  const agents = useMemo(
    () => UNIVERSAL_AGENTS.filter((agent) => agent.shouldAppearInAgentBar),
    [],
  );
  const selected = agents.find((agent) => agent.id === selectedAgent) ?? agents[0];

  if (!hasMessages) {
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
            onPress={() => setIsOpen(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="視点を開く"
            style={shadow.floatingRail}
          >
            {/* Web版 .floating-agent-toggle — 濃紺の小さなトグル */}
            <LinearGradient colors={gradients.floatingRail} style={styles.collapsedToggle}>
              <ChevronUp size={14} color={colors.inkOnDark} />
              <Text style={styles.collapsedToggleText}>視点を開く</Text>
            </LinearGradient>
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
        {/* Web版 .floating-agent-rail — 濃紺の半透明レール */}
        <LinearGradient
          colors={gradients.floatingRail}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.rail, shadow.floatingRail]}
        >
          <View style={styles.railHeader}>
            <Text style={styles.railCaption}>現在: {selected?.label ?? 'レイ'}</Text>
            <TouchableOpacity
              style={styles.closeToggle}
              onPress={() => setIsOpen(false)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="視点を閉じる"
            >
              <X size={14} color={colors.inkOnDark} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railContent}
          >
            {agents.map((agent) => {
              const isActive = agent.id === selectedAgent;
              const Icon = getAgentIcon(agent.id);
              const isDelegate = agent.id === 'delegate';
              const isJoe = agent.id === 'joe';
              const iconColor = isJoe
                ? CHIP_ICON_COLORS.joe
                : CHIP_ICON_COLORS[agent.id] ?? colors.inkOnDarkStrong;

              const inner = (
                <>
                  <Icon
                    size={13}
                    color={isDelegate ? colors.textOnAccent : iconColor}
                  />
                  <Text
                    style={[
                      styles.agentLabel,
                      isDelegate && styles.agentLabelOnGradient,
                      isJoe && styles.agentLabelOnOrange,
                      isActive && styles.agentLabelActive,
                    ]}
                  >
                    {agent.label}
                  </Text>
                </>
              );

              if (isDelegate) {
                return (
                  <TouchableOpacity
                    key={agent.id}
                    onPress={() => onSelectAgent(agent.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${agent.label}を選ぶ`}
                  >
                    <LinearGradient
                      colors={gradients.delegate}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.agentChip,
                        styles.agentChipGradient,
                        isActive && styles.agentChipActive,
                      ]}
                    >
                      {inner}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={agent.id}
                  style={[
                    styles.agentChip,
                    agent.id === 'mirror' && styles.agentChipDark,
                    isJoe && styles.agentChipOrange,
                    !isJoe && agent.id !== 'mirror' && styles.agentChipLight,
                    isActive && styles.agentChipActive,
                  ]}
                  onPress={() => onSelectAgent(agent.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${agent.label}を選ぶ`}
                >
                  {inner}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  collapsedToggleText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.inkOnDark,
  },
  openWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  rail: {
    width: '100%',
    maxWidth: mobileLayout.panelMaxWidth,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  railCaption: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: 'rgba(196,210,234,0.82)',
  },
  closeToggle: {
    minHeight: mobileTouchTarget.minimum,
    minWidth: mobileTouchTarget.minimum,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railContent: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Web版 .floating-agent-btn
  agentChip: {
    minHeight: mobileTouchTarget.minimum,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentChipDark: {
    backgroundColor: 'rgba(28,42,80,0.95)',
    borderColor: 'rgba(99,102,241,0.22)',
  },
  agentChipGradient: {
    borderColor: 'rgba(167,139,250,0.3)',
  },
  agentChipOrange: {
    backgroundColor: 'rgba(255,244,232,0.94)',
    borderColor: 'rgba(251,191,36,0.28)',
  },
  agentChipLight: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  agentChipActive: {
    borderColor: 'rgba(165,180,252,0.85)',
  },
  agentLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: colors.inkOnDarkStrong,
  },
  agentLabelOnGradient: {
    color: colors.textOnAccent,
  },
  agentLabelOnOrange: {
    color: '#92400e',
  },
  agentLabelActive: {
    fontWeight: '900',
  },
});
