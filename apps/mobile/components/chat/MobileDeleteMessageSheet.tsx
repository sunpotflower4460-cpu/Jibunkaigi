import React from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useT } from '../../i18n';
import { colors, mobileLayout, radius, spacing, type as typeScale } from '../../theme/tokens';

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
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{t('deleteMsg.title')}</Text>
            <Text style={styles.caption}>{t('deleteMsg.caption')}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.75}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={onConfirm} activeOpacity={0.75}>
                <Text style={styles.deleteText}>{t('deleteMsg.confirm')}</Text>
              </TouchableOpacity>
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
  sheet: {
    width: '100%',
    maxWidth: mobileLayout.sheetMaxWidth,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typeScale.heading,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  caption: {
    fontSize: typeScale.small,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cancelButton: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  deleteButton: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.danger,
  },
});
