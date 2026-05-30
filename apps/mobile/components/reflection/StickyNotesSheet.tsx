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
  TextInput,
} from 'react-native';
import {
  STICKY_NOTE_KIND_LABELS,
  STICKY_NOTE_KINDS,
  type StickyNote,
  type StickyNoteKind,
} from '../../services/reflectionShelfRepository';
import { StickyNoteCard } from './StickyNoteCard';
import {
  colors,
  mobileLayout,
  mobileLineHeights,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface StickyNotesSheetProps {
  visible: boolean;
  sessionTitle: string;
  selectedKind: StickyNoteKind;
  draftContent: string;
  stickyNotes: StickyNote[];
  isSaving: boolean;
  onBack: () => void;
  onClose: () => void;
  onSelectKind: (kind: StickyNoteKind) => void;
  onChangeDraft: (text: string) => void;
  onCreate: () => void;
  onDelete: (noteId: string) => void;
}

export function StickyNotesSheet({
  visible,
  sessionTitle,
  selectedKind,
  draftContent,
  stickyNotes,
  isSaving,
  onBack,
  onClose,
  onSelectKind,
  onChangeDraft,
  onCreate,
  onDelete,
}: StickyNotesSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, Platform.OS === 'android' && styles.sheetAndroid]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="潜る棚に戻る">
              <Text style={styles.backText}>← 戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="付箋を閉じる">
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>どう思う？付箋</Text>
          <Text style={styles.subTitle}>AIの答えではなく、今の自分の反応を残します。</Text>
          <Text style={styles.sessionText}>対象セッション: {sessionTitle}</Text>
          <Text style={styles.storageText}>端末の一時保持として扱われ、永続保存は保証されません。</Text>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.kindWrap}>
              {STICKY_NOTE_KINDS.map((kind) => {
                const isSelected = kind === selectedKind;
                return (
                  <TouchableOpacity
                    key={kind}
                    style={[styles.kindChip, isSelected && styles.kindChipSelected]}
                    onPress={() => onSelectKind(kind)}
                    accessibilityRole="button"
                    accessibilityLabel={STICKY_NOTE_KIND_LABELS[kind]}
                  >
                    <Text style={[styles.kindText, isSelected && styles.kindTextSelected]}>
                      {STICKY_NOTE_KIND_LABELS[kind]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={draftContent}
              onChangeText={onChangeDraft}
              placeholder="この言葉に、今の私はどう思う？"
              placeholderTextColor={colors.inkFaint}
              multiline
              style={styles.input}
              textAlignVertical="top"
              maxLength={280}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={onCreate}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="付箋を保存"
            >
              <Text style={styles.saveButtonText}>{isSaving ? '保存中…' : '保存'}</Text>
            </TouchableOpacity>

            <View style={styles.list}>
              {stickyNotes.map((note) => (
                <StickyNoteCard key={note.id} note={note} onDelete={onDelete} />
              ))}
              {stickyNotes.length === 0 ? (
                <Text style={styles.emptyText}>まだ付箋はありません。</Text>
              ) : null}
            </View>
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
    maxHeight: '90%',
    ...shadow.card,
  },
  sheetAndroid: {
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backText: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    fontWeight: '600',
  },
  closeText: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
  },
  title: {
    fontSize: typeScale.heading,
    fontWeight: '700',
    color: colors.inkStrong,
    letterSpacing: -0.4,
    paddingHorizontal: spacing.xl,
  },
  subTitle: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    lineHeight: mobileLineHeights.small,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
  },
  sessionText: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  storageText: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
    lineHeight: mobileLineHeights.tiny,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  kindWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  kindChip: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  kindChipSelected: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigoSoft,
  },
  kindText: {
    fontSize: typeScale.tiny,
    color: colors.inkMuted,
  },
  kindTextSelected: {
    color: colors.accentIndigo,
    fontWeight: '600',
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceStrong,
    color: colors.inkStrong,
    fontSize: typeScale.body,
    lineHeight: mobileLineHeights.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.accentIndigo,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.textOnAccent,
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typeScale.small,
    color: colors.inkFaint,
  },
});
