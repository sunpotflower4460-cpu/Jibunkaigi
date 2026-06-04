import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { MobileSession } from '../../state/mobileTypes';
import {
  colors,
  mobileLayout,
  mobileTouchTarget,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { MobileUserNameTrigger } from '../user/MobileUserNameTrigger';
import { useT } from '../../i18n';

interface MobileSessionHeaderProps {
  session: MobileSession;
  onNewSession: () => void;
  onClear: () => void;
  onOpenDrawer: () => void;
  onOpenMembers: () => void;
  userName?: string;
  onOpenUserName?: () => void;
}

export function MobileSessionHeader({
  session,
  onNewSession,
  onClear,
  onOpenDrawer,
  onOpenMembers,
  userName,
  onOpenUserName,
}: MobileSessionHeaderProps) {
  const t = useT();
  const { width } = useWindowDimensions();
  const isCompact = width < mobileLayout.mediumViewport;
  const isNarrow = width < mobileLayout.compactViewport;
  const newSessionLabel = isNarrow ? t('header.new.short') : t('header.new');

  return (
    <View style={styles.header}>
      <View style={[styles.topRow, isCompact && styles.topRowCompact]}>
        <TouchableOpacity
          style={styles.drawerBtn}
          onPress={onOpenDrawer}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('header.drawer.aria')}
        >
          <Text style={styles.drawerBtnText}>≡</Text>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
        </View>
      </View>
      <ScrollView
        horizontal={isCompact}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actions}
      >
        {onOpenUserName ? (
          <MobileUserNameTrigger
            userName={userName}
            compact={isCompact}
            onPress={onOpenUserName}
          />
        ) : null}
        <TouchableOpacity
          style={styles.btn}
          onPress={onOpenMembers}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('header.members.aria')}
        >
          <Text style={styles.btnText}>{t('header.members')}</Text>
        </TouchableOpacity>
        {session.messages.length > 0 ? (
          <TouchableOpacity
            style={styles.btn}
            onPress={onClear}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.btnText}>{t('header.clear')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onNewSession}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.btnText, styles.btnTextPrimary]}>{newSessionLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: mobileLayout.panelMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  topRowCompact: {
    alignItems: 'center',
  },
  drawerBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBtnText: {
    fontSize: 22,
    color: colors.inkMuted,
    lineHeight: 28,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkFaint,
    letterSpacing: 1.2,
  },
  sessionTitle: {
    fontSize: typeScale.heading,
    color: colors.inkStrong,
    letterSpacing: -0.4,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    minHeight: mobileTouchTarget.minimum,
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.accentSurface,
    borderColor: colors.accentIndigo,
  },
  btnText: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    fontWeight: '500',
  },
  btnTextPrimary: {
    color: colors.accentIndigo,
    fontWeight: '600',
  },
});
