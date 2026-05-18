import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { UniversalOnboardingStep } from '../../../../packages/shared/src';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileOnboardingStepProps {
  index: number;
  step: UniversalOnboardingStep;
}

export function MobileOnboardingStep({ index, step }: MobileOnboardingStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numberBubble}>
        <Text style={styles.numberText}>{index + 1}</Text>
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceSoft,
  },
  numberBubble: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inkStrong,
    marginTop: 2,
  },
  numberText: {
    color: '#fff',
    fontSize: typeScale.tiny,
    fontWeight: '700',
  },
  texts: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  body: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    lineHeight: 20,
  },
});
