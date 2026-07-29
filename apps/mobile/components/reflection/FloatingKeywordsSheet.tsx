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
import type { UniversalSession } from '../../state/mobileTypes';
import type { FloatingKeyword } from '../../services/keywordField';
import { FloatingKeywordChip } from './FloatingKeywordChip';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface FloatingKeywordsSheetProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  sessions: UniversalSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  keywords: FloatingKeyword[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenStickyNote: () => void;
}

export function FloatingKeywordsSheet({
  visible,
  onClose,
  onBack,
  sessions,
  selectedSessionId,
  onSelectSession,
  keywords,
  onRefresh,
  isRefreshing,
  onOpenStickyNote,
}: FloatingKeywordsSheetProps) {
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
          accessibilityLabel="言葉の水面を閉じる"
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
            <Text style={styles.title}>言葉の水面</Text>
            <Text style={styles.subtitle}>会話に浮かんだ言葉を、そっと見返します。</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sessionRow}
          >
            {sessions.map((session) => {
              const selected = session.id === selectedSessionId;
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionChip, selected && styles.sessionChipSelected]}
                  onPress={() => onSelectSession(session.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${session.title}の言葉の水面を表示`}
                >
                  <Text style={[styles.sessionChipText, selected && styles.sessionChipTextSelected]}>
                    {session.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
              onPress={onRefresh}
              disabled={isRefreshing}
              accessibilityRole="button"
              accessibilityLabel="言葉の水面を更新"
            >
              <Text style={styles.refreshButtonText}>{isRefreshing ? '更新中…' : '更新'}</Text>
            </TouchableOpacity>
            <Text style={styles.metaText}>浮上語: {keywords.length}個</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {keywords.length === 0 ? (
              <Text style={styles.emptyText}>
                まだ言葉は浮かんでいません。問いを置いて会話すると、ここに少しずつ現れます。
              </Text>
            ) : (
              <View style={styles.surfaceWrap}>
                {keywords.map((keyword) => (
                  <FloatingKeywordChip key={keyword.text} keyword={keyword} />
                ))}
              </View>
            )}

            {keywords.length > 0 ? (
              <TouchableOpacity
                style={styles.noteLinkButton}
                onPress={onOpenStickyNote}
                accessibilityRole="button"
                accessibilityLabel="この水面にどう思う付箋を貼る"
              >
                <Text style={styles.noteLinkButtonText}>この水面に「どう思う？」付箋を貼る</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.storageNote}>
              キーワードは会話・会議録・付箋から都度再計算し、表示座標や集計結果は保存しません。
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
  sessionRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  sessionChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sessionChipSelected: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigoSoft,
  },
  sessionChipText: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.tiny,
    color: colors.inkMuted,
  },
  sessionChipTextSelected: {
    color: colors.accentIndigo,
    fontWeight: '700',
  },
  actionRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  refreshButton: {
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
  metaText: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.tiny,
    color: colors.inkMuted,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  surfaceWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceFaint,
    padding: spacing.md,
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
  storageNote: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.body,
    color: colors.inkFaint,
  },
});
