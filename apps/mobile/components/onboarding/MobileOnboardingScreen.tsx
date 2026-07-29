import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Compass, Feather, Heart, Users } from 'lucide-react-native';
import { UNIVERSAL_ONBOARDING_CONTENT } from '@jibunkaigi/shared';
import {
  colors,
  gradients,
  mobileLayout,
  mobileLineHeights,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { MobileLegalSheet } from '../settings/MobileLegalSheet';

const STEP_ICONS = [Feather, Heart, Compass] as const;

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
  const [legalSheetOpen, setLegalSheetOpen] = useState(false);
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 760;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.background}
        locations={[0, 0.55, 1]}
        style={styles.background}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isCompactHeight && styles.scrollContentCompact,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.panel, isCompactHeight && styles.panelCompact]}>
          <LinearGradient
            colors={gradients.iconTile}
            style={[styles.iconWrap, isCompactHeight && styles.iconWrapCompact, shadow.iconTile]}
          >
            <Users size={isCompactHeight ? 24 : 26} color={colors.inkStrong} strokeWidth={1.75} />
          </LinearGradient>

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
            {UNIVERSAL_ONBOARDING_CONTENT.steps.map((step, index) => {
              const StepIcon = STEP_ICONS[index] ?? Feather;
              return (
                <View key={step.id} style={styles.stepPill}>
                  <View style={styles.stepPillNum}>
                    <Text style={styles.stepPillNumText}>{index + 1}</Text>
                  </View>
                  <StepIcon size={12} color={colors.inkMuted} strokeWidth={1.75} />
                  <Text style={styles.stepPillText}>{step.title}</Text>
                </View>
              );
            })}
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
            onPress={onComplete}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={UNIVERSAL_ONBOARDING_CONTENT.primaryCta}
            style={[styles.primaryButtonShadow, shadow.ctaGlow]}
          >
            <LinearGradient colors={gradients.cta} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {UNIVERSAL_ONBOARDING_CONTENT.primaryCta}
              </Text>
              <ChevronRight size={18} color={colors.textOnAccent} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalButton}
            onPress={() => setLegalSheetOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="利用規約とプライバシーの案内を開く"
          >
            <Text style={styles.legalButtonText}>
              利用規約 / プライバシー / 非医療・緊急時の案内を見る
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <MobileLegalSheet visible={legalSheetOpen} onClose={() => setLegalSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
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
    maxWidth: mobileLayout.onboardingMaxWidth,
    gap: spacing.lg,
    alignItems: 'center',
  },
  panelCompact: {
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
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
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.4,
    color: colors.inkStrong,
    lineHeight: 40,
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
    width: '100%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    ...shadow.soft,
  },
  subtitleCardCompact: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: typeScale.body,
    color: colors.inkSoft,
    lineHeight: mobileLineHeights.body,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  steps: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  stepPillNum: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inkStrong,
  },
  stepPillNumText: {
    color: colors.textOnAccent,
    fontSize: 9,
    fontWeight: '900',
  },
  stepPillText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  nameSection: {
    width: '100%',
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
    textAlign: 'center',
  },
  primaryButtonShadow: {
    width: '100%',
    borderRadius: radius.lg,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
  },
  primaryButtonText: {
    color: colors.textOnAccent,
    fontSize: typeScale.small,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  legalButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  legalButtonText: {
    color: colors.inkMuted,
    fontSize: typeScale.tiny,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: mobileLineHeights.tiny,
  },
});
