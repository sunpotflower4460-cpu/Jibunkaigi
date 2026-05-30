import React from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MOBILE_LEGAL_SECTIONS } from '../../data/legalContent';
import {
  colors,
  mobileLayout,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface MobileLegalSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function MobileLegalSheet({ visible, onClose }: MobileLegalSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, Platform.OS === 'android' && styles.sheetAndroid]}>
          <View style={styles.header}>
            <Text style={styles.title}>利用規約・プライバシー・注意事項</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="法務と安全の案内を閉じる"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>
            App Store 初回版に向けた仮文です。必要に応じて、いつでも見返してください。
          </Text>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {MOBILE_LEGAL_SECTIONS.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSummary}>{section.summary}</Text>
                {section.body.map((line) => (
                  <Text key={line} style={styles.sectionLine}>
                    ・{line}
                  </Text>
                ))}
              </View>
            ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.inkStrong,
    lineHeight: 24,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
  },
  description: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    color: colors.inkMuted,
    fontSize: typeScale.tiny,
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typeScale.small,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  sectionSummary: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
    lineHeight: 18,
  },
  sectionLine: {
    fontSize: typeScale.tiny,
    color: colors.inkSoft,
    lineHeight: 20,
  },
});
