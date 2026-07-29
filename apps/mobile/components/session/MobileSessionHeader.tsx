import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Menu } from 'lucide-react-native';
import type { MobileSession } from '../../state/mobileTypes';
import {
  colors,
  mobileLayout,
  mobileTouchTarget,
  radius,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { HeaderShell } from '../ui/MobileSurfaces';
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

/**
 * 上部ヘッダー。Web版 TopHeader.jsx と同じく、
 * 「いま、どのセッションか」を静かに示すガラスの情報帯にする。
 * 下部の操作バーと競合しないよう、視覚的な主張は抑える。
 */
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
  const isCompact = width < mobileLayout.mediumViewport;
  const isNarrow = width < mobileLayout.compactViewport;
  const newSessionLabel = isNarrow ? '新規' : '新しい問い';

  return (
    <View style={styles.header}>
      <HeaderShell style={styles.shell}>
        <TouchableOpacity
          style={styles.drawerBtn}
          onPress={onOpenDrawer}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="メニューを開く"
        >
          <Menu size={18} color={colors.inkMuted} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>じぶん会議</Text>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {session.title}
          </Text>
        </View>
      </HeaderShell>

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
            accessibilityRole="button"
            accessibilityLabel="この会話をクリア"
          >
            <Text style={styles.btnText}>クリア</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onNewSession}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="新しい問いをはじめる"
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  // Web版 TopHeader は px-4 py-3 のガラス帯
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  drawerBtn: {
    minWidth: mobileTouchTarget.minimum,
    minHeight: mobileTouchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    // Web版 .typo-label-small — トラッキングの広い極小ラベル
    fontSize: typeScale.label,
    fontWeight: '800',
    color: colors.inkFaint,
    letterSpacing: 2.6,
  },
  sessionTitle: {
    // Web版 .typo-screen-title
    fontSize: typeScale.body,
    color: colors.inkStrong,
    letterSpacing: -0.2,
    fontWeight: '700',
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
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.5)',
    minHeight: mobileTouchTarget.minimum,
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderColor: 'rgba(165,180,252,0.46)',
  },
  btnText: {
    // Web版のバーのラベルは 10px / font-black
    fontSize: 10,
    color: colors.inkMuted,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  btnTextPrimary: {
    color: colors.inkStrong,
  },
});
