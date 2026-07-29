import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Platform,
} from 'react-native';
import type { UniversalSession } from '../../state/mobileTypes';
import type { ConferenceRecord } from '../../services/reflectionShelfRepository';
import { ConferenceRecordCard } from './ConferenceRecordCard';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface ConferenceRecordSheetProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  sessions: UniversalSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreate: () => Promise<ConferenceRecord | null>;
  records: ConferenceRecord[];
  onDelete: (recordId: string) => Promise<void>;
  onOpenStickyNote: (record: ConferenceRecord) => void;
  canCreate: boolean;
  isSaving: boolean;
}

export function ConferenceRecordSheet({
  visible,
  onClose,
  onBack,
  sessions,
  selectedSessionId,
  onSelectSession,
  onCreate,
  records,
  onDelete,
  onOpenStickyNote,
  canCreate,
  isSaving,
}: ConferenceRecordSheetProps) {
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
          accessibilityLabel="会議録を閉じる"
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
            <Text style={styles.title}>会議録</Text>
            <Text style={styles.subtitle}>会話のあとに残ったものを、1枚の記録として置いておきます。</Text>
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
                  accessibilityLabel={`${session.title}の会議録を表示`}
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
              style={[styles.createButton, (!canCreate || isSaving) && styles.createButtonDisabled]}
              onPress={() => {
                void onCreate();
              }}
              disabled={!canCreate || isSaving}
              accessibilityRole="button"
              accessibilityLabel="会議録を作る"
            >
              <Text style={styles.createButtonText}>{isSaving ? '作成中…' : '会議録を作る'}</Text>
            </TouchableOpacity>
            {!canCreate ? (
              <Text style={styles.helpText}>
                まだ会話がないので、少し話してから会議録を作ってみてください。
              </Text>
            ) : null}
          </View>

          <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>まだ会議録はありません。会話のあとに1枚残してみよう。</Text>
            }
            renderItem={({ item }) => (
              <ConferenceRecordCard
                record={item}
                onDelete={onDelete}
                onOpenStickyNote={onOpenStickyNote}
              />
            )}
          />
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
    borderRadius: 999,
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
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  createButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.accentIndigo,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.small,
    color: colors.textOnAccent,
    fontWeight: '700',
  },
  helpText: {
    fontSize: typeScale.tiny,
    lineHeight: mobileLineHeights.body,
    color: colors.inkSoft,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typeScale.small,
    lineHeight: mobileLineHeights.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
