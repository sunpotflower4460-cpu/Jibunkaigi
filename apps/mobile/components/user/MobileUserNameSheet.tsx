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
import { GhostButton, PrimaryButton } from '../ui/MobileSurfaces';

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
                  <PrimaryButton
                    label="保存する"
                    onPress={onSave}
                    accessibilityLabel="名前を保存する"
                  />
                  <GhostButton
                    label="キャンセル"
                    onPress={onClose}
                    accessibilityLabel="キャンセル"
                  />
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
  // Web版 .modal-shell
  sheet: {
    width: '100%',
    maxWidth: mobileLayout.sheetMaxWidth,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: 'rgba(252,253,255,0.98)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    ...shadow.card,
    maxHeight: 460,
  },
  header: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.inkStrong,
  },
  sub: {
    fontSize: typeScale.tiny,
    fontWeight: '500',
    color: colors.inkMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Web版 .neu-concave の入力欄
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.44)',
    backgroundColor: 'rgba(232,240,250,0.66)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  help: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkFaint,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
});
