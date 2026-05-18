import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, type as typeScale } from '../../theme/tokens';

interface MobileSessionEditSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (title: string) => void | Promise<void>;
}

export function MobileSessionEditSheet({
  visible,
  title,
  onClose,
  onSave,
}: MobileSessionEditSheetProps) {
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    if (visible) {
      setDraftTitle(title);
    }
  }, [title, visible]);

  async function handleSave() {
    await onSave(draftTitle);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.sheet}>
                <Text style={styles.title}>タイトルを編集</Text>
                <Text style={styles.caption}>空欄のまま保存すると「新しい問い」になります。</Text>
                <TextInput
                  style={styles.input}
                  value={draftTitle}
                  onChangeText={setDraftTitle}
                  placeholder="新しい問い"
                  placeholderTextColor={colors.inkFaint}
                  autoFocus
                  maxLength={80}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleSave();
                  }}
                />
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="セッションタイトル編集をキャンセル"
                  >
                    <Text style={styles.secondaryText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      void handleSave();
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="セッションタイトルを保存"
                  >
                    <Text style={styles.primaryText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.22)',
  },
  backdrop: {
    flex: 1,
  },
  safeArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  keyboard: {
    justifyContent: 'flex-end',
  },
  scrollContent: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderRadius: radius.md,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    maxHeight: 420,
  },
  title: {
    fontSize: typeScale.heading,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  caption: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typeScale.body,
    color: colors.inkMain,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  secondaryButton: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  primaryButton: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentIndigoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.accentIndigo,
  },
});
