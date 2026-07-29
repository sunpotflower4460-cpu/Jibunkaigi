import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UNIVERSAL_AGENTS, isConcreteAgentId, type UniversalAgentId } from '@jibunkaigi/shared';
import {
  agentPalette,
  colors,
  getAgentIcon,
  gradients,
  mobileTouchTarget,
  radius,
  shadow,
  spacing,
} from '../../theme/tokens';

// Re-export for backward compatibility.
export type AgentKey = UniversalAgentId;

interface MobileAgentControlBarProps {
  selected: AgentKey;
  onSelect: (key: AgentKey) => void;
}

/**
 * 視点を呼び出すバー。Web版 AgentControlBar.jsx の .agent-chip に揃える。
 * - 心の鏡 → .mirror-chip（濃紺）
 * - 委ねる → .delegate-chip（菫→藍のグラデーション）
 * - それ以外 → エージェント固有の淡色（agentPalette）
 * チップの中身は「アイコン + 名前 + 役割」の縦積み。
 */
export function MobileAgentControlBar({
  selected,
  onSelect,
}: MobileAgentControlBarProps) {
  const agents = UNIVERSAL_AGENTS.filter((a) => a.shouldAppearInAgentBar);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {agents.map((agent) => {
          const isActive = selected === agent.id;
          const Icon = getAgentIcon(agent.id);
          const palette = isConcreteAgentId(agent.id) ? agentPalette[agent.id] : null;
          const label = (
            <View style={styles.texts}>
              <Text
                style={[
                  styles.name,
                  palette ? { color: palette.label } : null,
                  (agent.id === 'mirror' || agent.id === 'delegate') && styles.nameOnDark,
                ]}
                numberOfLines={1}
              >
                {agent.label}
              </Text>
              <Text
                style={[
                  styles.role,
                  palette ? { color: palette.label } : null,
                  (agent.id === 'mirror' || agent.id === 'delegate') && styles.roleOnDark,
                ]}
                numberOfLines={1}
              >
                {agent.role}
              </Text>
            </View>
          );

          if (agent.id === 'mirror' || agent.id === 'delegate') {
            return (
              <TouchableOpacity
                key={agent.id}
                onPress={() => onSelect(agent.id)}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${agent.label}: ${agent.role}`}
                style={[styles.chipShadow, isActive && styles.chipActiveShadow]}
              >
                <LinearGradient
                  colors={agent.id === 'mirror' ? gradients.mirror : gradients.delegate}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.chip,
                    agent.id === 'mirror' ? styles.chipMirror : styles.chipDelegate,
                  ]}
                >
                  <Icon
                    size={14}
                    color={agent.id === 'mirror' ? '#a5b4fc' : colors.textOnAccent}
                  />
                  {label}
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={agent.id}
              onPress={() => onSelect(agent.id)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${agent.label}: ${agent.role}`}
              style={[
                styles.chip,
                styles.chipShadow,
                palette
                  ? { backgroundColor: palette.surface, borderColor: palette.border }
                  : null,
                isActive && styles.chipActiveShadow,
                isActive && palette ? { borderColor: palette.label } : null,
              ]}
            >
              <Icon size={14} color={palette?.label ?? colors.inkSoft} />
              {label}
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
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipShadow: {
    borderRadius: radius.md,
    ...shadow.soft,
  },
  chipActiveShadow: {
    borderWidth: 1,
  },
  // Web版 .agent-chip — padding 0.55rem 0.95rem / radius md / min-height 44
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(252,253,255,0.78)',
    minHeight: mobileTouchTarget.minimum,
  },
  chipMirror: {
    borderColor: 'rgba(165,180,252,0.32)',
  },
  chipDelegate: {
    borderColor: 'rgba(255,255,255,0.35)',
  },
  texts: {
    minWidth: 0,
  },
  name: {
    // Web版 .agent-chip__name: 0.72rem / 900
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.1,
    color: colors.inkSoft,
  },
  nameOnDark: {
    color: colors.textOnAccent,
  },
  role: {
    // Web版 .agent-chip__role: 0.6rem / 600 / opacity 0.6
    fontSize: 9.5,
    fontWeight: '600',
    opacity: 0.6,
    letterSpacing: 0.4,
    marginTop: 2,
    color: colors.inkMuted,
  },
  roleOnDark: {
    color: colors.textOnAccent,
  },
});
