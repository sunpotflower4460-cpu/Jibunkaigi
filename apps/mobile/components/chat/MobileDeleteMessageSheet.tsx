import React from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, mobileLayout, radius, spacing, type as typeScale } from '../../theme/tokens';
import { GhostButton } from '../ui/MobileSurfaces';

interface MobileDeleteMessageSheetProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MobileDeleteMessageSheet({
  visible,
  onCancel,
  onConfirm,
}: MobileDeleteMessageSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.sheet}>
            <Text style={styles.title}>このメッセージを手放しますか？</Text>
            <Text style={styles.caption}>会話の表示から取り除かれます。</Text>
            {/* Web版 DeleteSessionDialog と同じく、破壊的操作は塗りつぶし・縦積み */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onConfirm}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="メッセージを手放す"
              >
                <Text style={styles.deleteText}>手放す</Text>
              </TouchableOpacity>
              <GhostButton
                label="キャンセル"
                onPress={onCancel}
                accessibilityLabel="削除をキャンセル"
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  // Web版 .modal-shell（rounded-[2.5rem]・中央揃え）
  sheet: {
    width: '100%',
    maxWidth: mobileLayout.sheetMaxWidth,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(252,253,255,0.98)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.md,
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
    lineHeight: 18,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  // Web版は bg-rose-600 の塗りつぶし
  deleteButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  deleteText: {
    fontSize: typeScale.small,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: colors.textOnAccent,
  },
});
