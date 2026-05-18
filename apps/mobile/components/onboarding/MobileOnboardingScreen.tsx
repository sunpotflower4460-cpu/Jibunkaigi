import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { ChevronRight, Users } from 'lucide-react-native';
import { UNIVERSAL_ONBOARDING_CONTENT } from '../../../../packages/shared/src';
import { colors, radius, shadow, spacing, type as typeScale } from '../../theme/tokens';
import { MobileOnboardingStep } from './MobileOnboardingStep';

interface MobileOnboardingScreenProps {
  userName: string;
  onChangeUserName: (name: string) => void;
  onComplete: () => void;
}

export function MobileOnboardingScreen({
  userName,
  onChangeUserName,
  onComplete,
}: MobileOnboardingScreenProps) {
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 760;

  return (
    <>
      <View style={styles.background} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompactHeight && styles.scrollContentCompact,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.panel, isCompactHeight && styles.panelCompact]}>
          <View style={[styles.iconWrap, isCompactHeight && styles.iconWrapCompact]}>
            <Users size={isCompactHeight ? 24 : 30} color="#fff" />
          </View>

          <View style={styles.titleBlock}>
            {UNIVERSAL_ONBOARDING_CONTENT.eyebrow ? (
              <Text style={styles.eyebrow}>{UNIVERSAL_ONBOARDING_CONTENT.eyebrow}</Text>
            ) : null}
            <Text style={[styles.title, isCompactHeight && styles.titleCompact]}>
              {UNIVERSAL_ONBOARDING_CONTENT.title}
            </Text>
            {UNIVERSAL_ONBOARDING_CONTENT.supportingText ? (
              <Text style={styles.supportingText}>
                {UNIVERSAL_ONBOARDING_CONTENT.supportingText}
              </Text>
            ) : null}
          </View>

          <View style={[styles.subtitleCard, isCompactHeight && styles.subtitleCardCompact]}>
            <Text style={styles.subtitle}>{UNIVERSAL_ONBOARDING_CONTENT.subtitle}</Text>
          </View>

          <View style={styles.steps}>
            {UNIVERSAL_ONBOARDING_CONTENT.steps.map((step, index) => (
              <MobileOnboardingStep key={step.id} index={index} step={step} />
            ))}
          </View>

          <View style={styles.nameSection}>
            <Text style={styles.nameLabel}>
              {UNIVERSAL_ONBOARDING_CONTENT.nameLabel ?? 'お名前'}
            </Text>
            <TextInput
              value={userName}
              onChangeText={onChangeUserName}
              placeholder={UNIVERSAL_ONBOARDING_CONTENT.namePlaceholder ?? 'あなた'}
              placeholderTextColor={colors.inkFaint}
              maxLength={24}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              style={styles.nameInput}
            />
            <Text style={styles.nameHelp}>
              {UNIVERSAL_ONBOARDING_CONTENT.nameHelp}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onComplete}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={UNIVERSAL_ONBOARDING_CONTENT.primaryCta}
          >
            <Text style={styles.primaryButtonText}>
              {UNIVERSAL_ONBOARDING_CONTENT.primaryCta}
            </Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgBase,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  scrollContentCompact: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.lg,
  },
  panel: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: 480,
    borderRadius: 40,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.xl,
    ...shadow.card,
  },
  panelCompact: {
    borderRadius: 28,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: colors.inkStrong,
  },
  iconWrapCompact: {
    width: 60,
    height: 60,
    borderRadius: 22,
  },
  titleBlock: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3.6,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: colors.inkStrong,
  },
  titleCompact: {
    fontSize: 30,
  },
  supportingText: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.inkMuted,
    letterSpacing: 0.4,
  },
  subtitleCard: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  subtitleCardCompact: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: typeScale.body,
    color: colors.inkSoft,
    lineHeight: 28,
    fontWeight: '500',
  },
  steps: {
    gap: spacing.sm,
  },
  nameSection: {
    gap: spacing.sm,
  },
  nameLabel: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  nameInput: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: colors.inkStrong,
    textAlign: 'center',
  },
  nameHelp: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.inkStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: typeScale.small,
    fontWeight: '800',
  },
});
