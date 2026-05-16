import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { MobileSession } from '../../state/mobileTypes';
import { colors, spacing, type as typeScale, radius } from '../../theme/tokens';

interface MobileSessionHeaderProps {
  session: MobileSession;
  onNewSession: () => void;
  onClear: () => void;
  onOpenDrawer: () => void;
  onOpenMembers: () => void;
}

export function MobileSessionHeader({
  session,
  onNewSession,
  onClear,
  onOpenDrawer,
  onOpenMembers,
}: MobileSessionHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.drawerBtn}
        onPress={onOpenDrawer}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.drawerBtnText}>≡</Text>
      </TouchableOpacity>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>じぶん会議</Text>
        <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btn}
          onPress={onOpenMembers}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="会議メンバーを見る"
        >
          <Text style={styles.btnText}>メンバー</Text>
        </TouchableOpacity>
        {session.messages.length > 0 && (
          <TouchableOpacity
            style={styles.btn}
            onPress={onClear}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.btnText}>クリア</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onNewSession}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.btnText, styles.btnTextPrimary]}>新しい問い</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  drawerBtn: {
    marginRight: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 32,
    alignItems: 'center',
  },
  drawerBtnText: {
    fontSize: 22,
    color: colors.inkMuted,
    lineHeight: 28,
  },
  titleBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typeScale.title,
    fontWeight: '700',
    color: colors.inkStrong,
    letterSpacing: -0.5,
  },
  sessionTitle: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    minHeight: 36,
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.accentIndigoSoft,
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
