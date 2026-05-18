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
import { colors, spacing, type as typeScale, radius } from '../../theme/tokens';
import { MobileUserNameTrigger } from '../user/MobileUserNameTrigger';

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
  const { width } = useWindowDimensions();
  const isCompact = width < 860;
  const isNarrow = width < 420;
  const newSessionLabel = isNarrow ? '新規' : '新しい問い';

  return (
    <View style={styles.header}>
      <View style={[styles.topRow, isCompact && styles.topRowCompact]}>
        <TouchableOpacity
          style={styles.drawerBtn}
          onPress={onOpenDrawer}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="セッション一覧を開く"
        >
          <Text style={styles.drawerBtnText}>≡</Text>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>じぶん会議</Text>
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
          accessibilityLabel="会議メンバーを見る"
        >
          <Text style={styles.btnText}>メンバー</Text>
        </TouchableOpacity>
        {session.messages.length > 0 ? (
          <TouchableOpacity
            style={styles.btn}
            onPress={onClear}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.btnText}>クリア</Text>
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
    flexWrap: 'wrap',
    paddingRight: spacing.xl,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    minHeight: 44,
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
