import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Easing } from 'react-native';
import { getThinkingText, isConcreteAgentId } from '@jibunkaigi/shared';
import type { UniversalAgentId, UniversalModeId } from '../../state/mobileTypes';
import {
  agentPalette,
  mobileMotion,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { MobileThinkingIndicator } from './MobileThinkingIndicator';

interface MobileEntrustConvergenceProps {
  /** The voice the turn is converging toward (delegate-resolved or directly chosen). */
  agentId: UniversalAgentId;
  modeId?: UniversalModeId;
}

const SATELLITE_COUNT = 3;

/**
 * Phase 4: convergence ("entrust") thinking indicator.
 *
 * While a turn is being generated, a small field of light points gathers and
 * a main dot — coloured by the chosen voice's palette — breathes, suggesting a
 * voice crystallising out of the internal field. Voices without a palette
 * (mirror / delegate) fall back to the plain text indicator.
 *
 * Uses the standard Animated API with the native driver (transform + opacity
 * only), so no reanimated/svg dependency is required.
 */
export function MobileEntrustConvergence({
  agentId,
  modeId = 'dialogue',
}: MobileEntrustConvergenceProps) {
  // mirror / delegate etc. have no concrete palette → plain text fallback.
  if (!isConcreteAgentId(agentId)) {
    return <MobileThinkingIndicator agentId={agentId} modeId={modeId} />;
  }

  const palette = agentPalette[agentId];
  const text = getThinkingText(agentId, modeId);

  return <ConvergenceField palette={palette} text={text} />;
}

interface ConvergenceFieldProps {
  palette: { surface: string; border: string; label: string };
  text: string;
}

function ConvergenceField({ palette, text }: ConvergenceFieldProps) {
  const gather = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const satellites = useRef(
    Array.from({ length: SATELLITE_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const { convergence } = mobileMotion;

    // gather: the whole field fades in softly.
    const gatherAnim = Animated.timing(gather, {
      toValue: 1,
      duration: convergence.gather,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    // pulse: the main dot breathes.
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: convergence.pulse / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: convergence.pulse / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // satellites: faint side points shimmer out of phase with each other.
    const satelliteLoops = satellites.map((value, index) => {
      const span = convergence.driftCycleMax - convergence.driftCycleMin;
      const cycle =
        convergence.driftCycleMin +
        (span * index) / Math.max(1, SATELLITE_COUNT - 1);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: cycle / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: cycle / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    });

    gatherAnim.start();
    pulseLoop.start();
    const timers = satelliteLoops.map((loop, index) =>
      setTimeout(() => loop.start(), index * 160),
    );

    return () => {
      gatherAnim.stop();
      pulseLoop.stop();
      satelliteLoops.forEach((loop) => loop.stop());
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [gather, pulse, satellites]);

  const mainScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.18],
  });
  const mainOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.92],
  });

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={text}>
      <Animated.View style={[styles.field, { opacity: gather }]}>
        {satellites.map((value, index) => {
          const opacity = value.interpolate({
            inputRange: [0, 1],
            outputRange: [0.14, 0.42],
          });
          const translateX = (index - (SATELLITE_COUNT - 1) / 2) * 16;
          return (
            <Animated.View
              key={index}
              style={[
                styles.satellite,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity,
                  transform: [{ translateX }],
                },
              ]}
            />
          );
        })}
        <Animated.View
          style={[
            styles.mainDot,
            {
              backgroundColor: palette.border,
              opacity: mainOpacity,
              transform: [{ scale: mainScale }],
            },
          ]}
        />
      </Animated.View>
      <Text style={[styles.text, { color: palette.label }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  field: {
    width: 40,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satellite: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  mainDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  text: {
    fontSize: typeScale.small,
    fontStyle: 'italic',
  },
});
