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
import { GhostButton, PrimaryButton } from '../ui/MobileSurfaces';

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
                  <PrimaryButton
                    label="保存"
                    onPress={() => {
                      void handleSave();
                    }}
                    accessibilityLabel="セッションタイトルを保存"
                  />
                  <GhostButton
                    label="キャンセル"
                    onPress={onClose}
                    accessibilityLabel="セッションタイトル編集をキャンセル"
                  />
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
  // Web版 .modal-shell（rounded-[2.5rem]）
  sheet: {
    borderRadius: radius.xl,
    backgroundColor: 'rgba(252,253,255,0.98)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    maxHeight: 420,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.inkStrong,
    textAlign: 'center',
  },
  caption: {
    fontSize: typeScale.tiny,
    fontWeight: '500',
    color: colors.inkMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
  // Web版 .neu-concave の入力欄（中央揃え・太字）
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.44)',
    backgroundColor: 'rgba(232,240,250,0.66)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 18,
    fontWeight: '700',
    color: colors.inkStrong,
    textAlign: 'center',
  },
  // Web版 UserNameDialog と同じく、主ボタンを上・取り消しを下に縦積みする
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
