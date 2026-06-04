import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from 'lucide-react-native';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  radius,
  spacing,
  type as typeScale,
  shadow,
} from '../../theme/tokens';
import { useT } from '../../i18n';

const HINT_KEYS = ['intro.hint.1', 'intro.hint.2', 'intro.hint.3', 'intro.hint.4'] as const;

interface MobileIntroScreenProps {
  onHintSelect: (hint: string) => void;
}

export function MobileIntroScreen({ onHintSelect }: MobileIntroScreenProps) {
  const t = useT();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Feather size={24} color={colors.inkFaint} />
        </View>
        <Text style={styles.heading}>{t('empty.heading')}</Text>
        <Text style={styles.sub}>{t('empty.sub')}</Text>
      </View>
      <Text style={styles.hintTitle}>{t('intro.hintTitle')}</Text>
      <View style={styles.hints}>
        {HINT_KEYS.map((key) => {
          const hint = t(key);
          return (
            <TouchableOpacity
              key={key}
              style={styles.hintChip}
              onPress={() => onHintSelect(hint)}
              activeOpacity={0.6}
            >
              <Text style={styles.hintText}>{hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: mobileLayout.onboardingMaxWidth,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.md,
    ...shadow.card,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceFaint,
  },
  heading: {
    fontSize: typeScale.heading,
    fontWeight: '600',
    color: colors.inkStrong,
    lineHeight: mobileLineHeights.heading,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  sub: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.body,
    textAlign: 'center',
  },
  hintTitle: {
    fontSize: typeScale.small,
    color: colors.inkFaint,
    fontWeight: '400',
    letterSpacing: 0.4,
    paddingHorizontal: spacing.xs,
    alignSelf: 'flex-start',
    maxWidth: mobileLayout.onboardingMaxWidth,
    width: '100%',
  },
  hints: {
    width: '100%',
    maxWidth: mobileLayout.onboardingMaxWidth,
    gap: spacing.sm,
  },
  hintChip: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    minHeight: 56,
    justifyContent: 'center',
  },
  hintText: {
    fontSize: typeScale.body,
    color: colors.inkSoft,
    lineHeight: mobileLineHeights.body,
  },
});
