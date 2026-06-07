import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { UniversalAgentId, UniversalModeId } from '../../state/mobileTypes';
import { getThinkingText } from '@jibunkaigi/shared';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileThinkingIndicatorProps {
  agentId: UniversalAgentId;
  modeId?: UniversalModeId;
}

const DOTS = [0, 1, 2];
const DOT_STAGGER = 240; // ms 各点の位相差
const DOT_HALF = 720; // ms 明 → 暗（片道）

// 水面に静かな波紋が広がるような、ゆっくりした三点の明滅。
function BreathingDot({ index, reduced }: { index: number; reduced: boolean }) {
  const value = useRef(new Animated.Value(reduced ? 0.6 : 0.32)).current;

  useEffect(() => {
    if (reduced) {
      value.setValue(0.6);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: DOT_HALF,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0.32,
          duration: DOT_HALF,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    // 開始をずらして、波紋が順に伝わるように見せる。
    const timer = setTimeout(() => loop.start(), index * DOT_STAGGER);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [reduced, index, value]);

  const scale = value.interpolate({ inputRange: [0.32, 1], outputRange: [0.82, 1.06] });

  return <Animated.View style={[styles.dot, { opacity: value, transform: [{ scale }] }]} />;
}

export function MobileThinkingIndicator({ agentId, modeId = 'dialogue' }: MobileThinkingIndicatorProps) {
  const text = getThinkingText(agentId, modeId);
  const reduced = useReducedMotion();
  const textOpacity = useRef(new Animated.Value(reduced ? 1 : 0.72)).current;

  useEffect(() => {
    if (reduced) {
      textOpacity.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0.72,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, textOpacity]);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.dots} importantForAccessibility="no-hide-descendants">
        {DOTS.map((i) => (
          <BreathingDot key={i} index={i} reduced={reduced} />
        ))}
      </View>
      <Animated.Text style={[styles.text, { opacity: textOpacity }]}>{text}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.accentIndigo,
  },
  text: {
    fontSize: typeScale.small,
    color: colors.inkFaint,
    fontStyle: 'italic',
  },
});
