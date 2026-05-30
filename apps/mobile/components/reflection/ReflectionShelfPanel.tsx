import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Platform,
} from 'react-native';
import { ReflectionShelfItem } from './ReflectionShelfItem';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

const SHELF_ITEMS = [
  {
    id: 'sticky',
    emoji: '🗒️',
    title: 'どう思う？付箋',
    description: 'AIの答えではなく、今の自分の反応を残す',
    comingSoonLabel: '開く',
  },
  {
    id: 'record',
    emoji: '📋',
    title: '会議録',
    description: 'この会話から、残った一文と戻る問いを記録する',
    comingSoonLabel: '開く',
  },
  {
    id: 'keywords',
    emoji: '🌊',
    title: '言葉の水面',
    description: '会話に浮かんだ言葉を見る',
    comingSoonLabel: '開く',
  },
  {
    id: 'theme',
    emoji: '🔭',
    title: '自分の輪郭',
    description: 'くり返し浮かぶテーマを、静かに見返す',
    comingSoonLabel: '開く',
  },
  {
    id: 'settings',
    emoji: '⚙️',
    title: '保存と案内',
    description: '利用規約・保存状態・データ削除は会議一覧から見返せます',
    comingSoonLabel: '会議一覧で確認',
  },
] as const;

interface ReflectionShelfPanelProps {
  visible: boolean;
  onClose: () => void;
  onOpenStickyNotes: () => void;
  onOpenConferenceRecords: () => void;
  onOpenFloatingKeywords: () => void;
  onOpenThemeArchive: () => void;
}

export function ReflectionShelfPanel({
  visible,
  onClose,
  onOpenStickyNotes,
  onOpenConferenceRecords,
  onOpenFloatingKeywords,
  onOpenThemeArchive,
}: ReflectionShelfPanelProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="潜る棚を閉じる"
        />
        <SafeAreaView style={[styles.sheet, Platform.OS === 'android' && styles.sheetAndroid]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>潜る</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="潜る棚を閉じる"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSub}>
            会話のあとに残ったものを、自分の手でそっと置いておく場所です。
          </Text>

          {/* Item list */}
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {SHELF_ITEMS.map((item) => (
              <ReflectionShelfItem
                key={item.id}
                emoji={item.emoji}
                title={item.title}
                description={item.description}
                comingSoonLabel={
                  item.id === 'sticky' || item.id === 'record' || item.id === 'keywords' || item.id === 'theme'
                    ? '開く'
                    : item.comingSoonLabel
                }
                disabled={item.id !== 'sticky' && item.id !== 'record' && item.id !== 'keywords' && item.id !== 'theme'}
                onPress={
                  item.id === 'sticky'
                    ? onOpenStickyNotes
                    : item.id === 'record'
                      ? onOpenConferenceRecords
                      : item.id === 'keywords'
                        ? onOpenFloatingKeywords
                        : item.id === 'theme'
                          ? onOpenThemeArchive
                        : undefined
                }
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
  },
  sheet: {
    width: '100%',
    maxWidth: mobileLayout.sheetMaxWidth,
    alignSelf: 'center',
    backgroundColor: colors.surfaceSoft,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    ...shadow.card,
  },
  sheetAndroid: {
    paddingTop: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: typeScale.heading,
    fontWeight: '700',
    color: colors.inkStrong,
    letterSpacing: -0.4,
  },
  closeBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
  },
  sheetSub: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    lineHeight: mobileLineHeights.small,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
});
