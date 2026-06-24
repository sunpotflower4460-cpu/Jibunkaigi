import React from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  colors,
  mobileLayout,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface MobileUserNameSheetProps {
  visible: boolean;
  userName: string;
  onChange: (name: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function MobileUserNameSheet({
  visible,
  userName,
  onChange,
  onClose,
  onSave,
}: MobileUserNameSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboard}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.sheet}>
                <View style={styles.header}>
                  <Text style={styles.title}>名前を整える</Text>
                  <Text style={styles.sub}>
                    会議メンバーからの呼ばれ方に使われます。
                  </Text>
                </View>

                <TextInput
                  value={userName}
                  onChangeText={onChange}
                  placeholder="あなた"
                  placeholderTextColor={colors.inkFaint}
                  maxLength={24}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={onSave}
                  style={styles.input}
                />

                <Text style={styles.help}>空欄のまま保存すると「あなた」になります。</Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onSave}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="名前を保存する"
                  >
                    <Text style={styles.primaryButtonText}>保存する</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onClose}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="キャンセル"
                  >
                    <Text style={styles.secondaryButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
    backgroundColor: colors.overlay,
  },
  safeArea: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  keyboard: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  scrollContent: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: mobileLayout.sheetMaxWidth,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    ...shadow.card,
    maxHeight: 420,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: typeScale.heading,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  sub: {
    fontSize: typeScale.small,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  help: {
    fontSize: typeScale.tiny,
    color: colors.inkFaint,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.inkStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: colors.textOnAccent,
    fontSize: typeScale.small,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.inkMuted,
    fontSize: typeScale.small,
    fontWeight: '700',
  },
});
