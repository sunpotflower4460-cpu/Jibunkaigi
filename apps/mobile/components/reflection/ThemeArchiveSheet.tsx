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
import type { ThemeArchive } from '../../services/themeArchive';
import { ThemeChip } from './ThemeChip';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface ThemeArchiveSheetProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  archive: ThemeArchive;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenStickyNote: () => void;
}

function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return '';
  }
}

export function ThemeArchiveSheet({
  visible,
  onClose,
  onBack,
  archive,
  onRefresh,
  isRefreshing,
  onOpenStickyNote,
}: ThemeArchiveSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="自分の輪郭を閉じる"
        />
        <SafeAreaView style={[styles.sheet, Platform.OS === 'android' && styles.sheetAndroid]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Reflection Shelfに戻る"
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.title}>自分の輪郭</Text>
            <Text style={styles.subtitle}>くり返し浮かぶテーマを、静かに見返します。</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
              onPress={onRefresh}
              disabled={isRefreshing}
              accessibilityRole="button"
              accessibilityLabel="自分の輪郭を更新"
            >
              <Text style={styles.refreshButtonText}>{isRefreshing ? '更新中…' : '更新'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.totalsGrid}>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{archive.totals.sessions}</Text>
                <Text style={styles.totalLabel}>問い</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{archive.totals.messages}</Text>
                <Text style={styles.totalLabel}>声</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{archive.totals.records}</Text>
                <Text style={styles.totalLabel}>会議録</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{archive.totals.notes}</Text>
                <Text style={styles.totalLabel}>付箋</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>くり返し浮かぶテーマ</Text>
              {archive.themes.length === 0 ? (
                <Text style={styles.emptyText}>
                  まだ輪郭は見えていません。会話や付箋が増えるほど、少しずつ浮かびます。
                </Text>
              ) : (
                <>
                  <View style={styles.themeWrap}>
                    {archive.themes.map((theme, index) => (
                      <ThemeChip key={theme.keyword} theme={theme} index={index} />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.noteLinkButton}
                    onPress={onOpenStickyNote}
                    accessibilityRole="button"
                    accessibilityLabel="この輪郭にどう思う付箋を貼る"
                  >
                    <Text style={styles.noteLinkButtonText}>この輪郭に「どう思う？」付箋を貼る</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最近の会議録</Text>
              {archive.recentRecords.length === 0 ? (
                <Text style={styles.metaText}>会議録を作ると、ここに少しずつ蓄積されます。</Text>
              ) : (
                archive.recentRecords.map((record) => (
                  <View key={record.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{record.title}</Text>
                      <Text style={styles.cardDate}>{formatDate(record.updatedAt)}</Text>
                    </View>
                    <Text style={styles.cardBody}>{record.selfLine}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最近の付箋</Text>
              {archive.recentNotes.length === 0 ? (
                <Text style={styles.metaText}>付箋を貼ると、ここに今の反応が残ります。</Text>
              ) : (
                archive.recentNotes.map((note) => (
                  <View key={note.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{note.label}</Text>
                      <Text style={styles.cardDate}>{formatDate(note.updatedAt)}</Text>
                    </View>
                    <Text style={styles.cardBody}>{note.content}</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.storageNote}>
              テーマ集計は保存せず、会話・会議録・付箋から都度再計算して表示します。
            </Text>
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
    maxHeight: '92%',
    ...shadow.card,
  },
  sheetAndroid: {
    paddingTop: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backButtonText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.small,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  title: {
    fontSize: typeScale.heading,
    lineHeight: mobileLineHeights.heading,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  subtitle: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.body,
    color: colors.inkMuted,
  },
  actionRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    backgroundColor: colors.accentIndigo,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.small,
    color: colors.textOnAccent,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  totalCard: {
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceFaint,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  totalValue: {
    fontSize: typeScale.heading,
    lineHeight: mobileLineHeights.heading,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  totalLabel: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.tiny,
    color: colors.inkMuted,
  },
  section: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceFaint,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.small,
    color: colors.inkStrong,
    fontWeight: '700',
  },
  themeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.body,
    color: colors.inkSoft,
  },
  noteLinkButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.accentIndigo,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  noteLinkButtonText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.small,
    color: colors.textOnAccent,
    fontWeight: '700',
  },
  card: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.small,
    color: colors.inkStrong,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.tiny,
    color: colors.inkFaint,
  },
  cardBody: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.body,
    color: colors.inkSoft,
  },
  metaText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.body,
    color: colors.inkSoft,
  },
  storageNote: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.body,
    color: colors.inkFaint,
  },
});
