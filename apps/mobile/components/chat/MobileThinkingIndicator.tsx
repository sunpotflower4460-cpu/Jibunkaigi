import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { UniversalAgentId, UniversalModeId } from '../../state/mobileTypes';
import { getThinkingText } from '@jibunkaigi/shared';
import { colors, mobileLineHeights, spacing } from '../../theme/tokens';

interface MobileThinkingIndicatorProps {
  agentId: UniversalAgentId;
  modeId?: UniversalModeId;
}

// Web版 .thinking-dot と同じ3色。水面に波紋が順に広がるように遅延をずらす。
const DOT_GRADIENTS = [
  ['rgba(147,197,253,0.9)', 'rgba(167,139,250,0.9)'],
  ['rgba(167,139,250,0.9)', 'rgba(99,102,241,0.9)'],
  ['rgba(99,102,241,0.9)', 'rgba(147,197,253,0.9)'],
] as const;
const DOT_DELAYS = [0, 220, 440] as const;

function ThinkingDot({ index }: { index: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // jk-crystal-pulse: 1.4s ease-in-out infinite
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const timer = setTimeout(() => animation.start(), DOT_DELAYS[index] ?? 0);
    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [index, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
        transform: [
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.12] }) },
        ],
      }}
    >
      <LinearGradient
        colors={DOT_GRADIENTS[index] ?? DOT_GRADIENTS[0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.dot}
      />
    </Animated.View>
  );
}

export function MobileThinkingIndicator({ agentId, modeId = 'dialogue' }: MobileThinkingIndicatorProps) {
  const text = getThinkingText(agentId, modeId);

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={text}>
      <View style={styles.dots}>
        {[0, 1, 2].map((index) => (
          <ThinkingDot key={index} index={index} />
        ))}
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    // Web版: text-[11px] font-bold text-slate-500 leading-relaxed
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.tiny,
  },
});
