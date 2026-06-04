import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SUPPORTED_LANGS, useLang, useT } from '../../i18n';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

const LABELS: Record<(typeof SUPPORTED_LANGS)[number], string> = {
  ja: '日本語',
  en: 'English',
};

export function MobileLanguageToggle() {
  const { lang, setLang } = useLang();
  const t = useT();

  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('lang.toggle.aria')}
    >
      {SUPPORTED_LANGS.map((code) => {
        const active = lang === code;
        return (
          <Pressable
            key={code}
            onPress={() => setLang(code)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={LABELS[code]}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{LABELS[code]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    padding: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  pillActive: {
    backgroundColor: colors.surfaceStrong,
  },
  label: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  labelActive: {
    color: colors.inkStrong,
  },
});

export default MobileLanguageToggle;
