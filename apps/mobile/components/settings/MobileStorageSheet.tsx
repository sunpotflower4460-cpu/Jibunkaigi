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
import type { UniversalRuntimeStatus } from '@jibunkaigi/shared';
import {
  MOBILE_DATA_DELETION_ACTIONS,
  MOBILE_REFLECTION_SHELF_DELETION_NOTE,
  type MobileDeletionActionTone,
} from '../../services/dataDeletionPlan';
import {
  MOBILE_STORAGE_EXPLANATIONS,
  getMobileStorageStatusSummary,
} from '../../services/storageStatus';
import {
  colors,
  mobileLayout,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';

interface MobileStorageSheetProps {
  visible: boolean;
  status: UniversalRuntimeStatus;
  onClose: () => void;
}

export function MobileStorageSheet({ visible, status, onClose }: MobileStorageSheetProps) {
  const summary = getMobileStorageStatusSummary(status);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, Platform.OS === 'android' && styles.sheetAndroid]}>
          <View style={styles.header}>
            <Text style={styles.title}>保存状態とデータ削除</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="保存状態とデータ削除の案内を閉じる"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>
            いまの保存先と、どこまで削除できるかをまとめて確認できます。
          </Text>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.section, getSectionToneStyle(summary.tone)]}>
              <View style={[styles.badge, getBadgeToneStyle(summary.tone)]}>
                <Text style={[styles.badgeText, getBadgeTextToneStyle(summary.tone)]}>
                  {summary.badgeLabel}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>{summary.title}</Text>
              <Text style={styles.sectionSummary}>{summary.summary}</Text>
              <Text style={styles.sectionLine}>・{summary.detail}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>保存先の違い</Text>
              {MOBILE_STORAGE_EXPLANATIONS.map((item) => (
                <View key={item.id} style={styles.innerCard}>
                  <Text style={styles.innerTitle}>{item.title}</Text>
                  {item.body.map((line) => (
                    <Text key={line} style={styles.sectionLine}>
                      ・{line}
                    </Text>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>削除できること / これから分けること</Text>
              <Text style={styles.sectionSummary}>
                セッション削除、端末内全削除、クラウド全削除は別の操作として扱います。
              </Text>
              {MOBILE_DATA_DELETION_ACTIONS.map((item) => (
                <View key={item.id} style={[styles.innerCard, getDeletionToneStyle(item.tone)]}>
                  <View style={styles.actionHeader}>
                    <Text style={styles.innerTitle}>{item.title}</Text>
                    <View style={[styles.actionBadge, getActionBadgeToneStyle(item.tone)]}>
                      <Text style={[styles.actionBadgeText, getActionBadgeTextToneStyle(item.tone)]}>
                        {item.badgeLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scopeLabel}>対象: {item.scope}</Text>
                  <Text style={styles.sectionLine}>・{item.description}</Text>
                  <Text style={styles.sectionLine}>・{item.detail}</Text>
                </View>
              ))}
              <Text style={styles.note}>{MOBILE_REFLECTION_SHELF_DELETION_NOTE}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function getSectionToneStyle(tone: ReturnType<typeof getMobileStorageStatusSummary>['tone']) {
  switch (tone) {
    case 'accent':
      return styles.sectionAccent;
    case 'danger':
      return styles.sectionDanger;
    case 'warning':
      return styles.sectionWarning;
    default:
      return null;
  }
}

function getBadgeToneStyle(tone: ReturnType<typeof getMobileStorageStatusSummary>['tone']) {
  switch (tone) {
    case 'accent':
      return styles.badgeAccent;
    case 'danger':
      return styles.badgeDanger;
    case 'warning':
      return styles.badgeWarning;
    default:
      return styles.badgeNeutral;
  }
}

function getBadgeTextToneStyle(tone: ReturnType<typeof getMobileStorageStatusSummary>['tone']) {
  switch (tone) {
    case 'accent':
      return styles.badgeTextAccent;
    case 'danger':
      return styles.badgeTextDanger;
    case 'warning':
      return styles.badgeTextWarning;
    default:
      return null;
  }
}

function getDeletionToneStyle(tone: MobileDeletionActionTone) {
  switch (tone) {
    case 'danger':
      return styles.innerCardDanger;
    case 'warning':
      return styles.innerCardWarning;
    default:
      return null;
  }
}

function getActionBadgeToneStyle(tone: MobileDeletionActionTone) {
  switch (tone) {
    case 'danger':
      return styles.actionBadgeDanger;
    case 'warning':
      return styles.actionBadgeWarning;
    default:
      return styles.actionBadgeNeutral;
  }
}

function getActionBadgeTextToneStyle(tone: MobileDeletionActionTone) {
  switch (tone) {
    case 'danger':
      return styles.actionBadgeTextDanger;
    case 'warning':
      return styles.actionBadgeTextWarning;
    default:
      return null;
  }
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
  sectionAccent: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.accentSurface,
  },
  sectionWarning: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSurface,
  },
  sectionDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeNeutral: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
  },
  badgeAccent: {
    borderColor: colors.accentIndigo,
    backgroundColor: colors.surfaceStrong,
  },
  badgeWarning: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.surfaceSoft,
  },
  badgeDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.surfaceStrong,
  },
  badgeText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  badgeTextAccent: {
    color: colors.accentIndigo,
  },
  badgeTextWarning: {
    color: colors.inkMain,
  },
  badgeTextDanger: {
    color: colors.danger,
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
  innerCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  innerCardWarning: {
    borderColor: colors.warningBorder,
  },
  innerCardDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
  },
  innerTitle: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkStrong,
  },
  actionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  actionBadgeNeutral: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
  },
  actionBadgeWarning: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.surfaceSoft,
  },
  actionBadgeDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.surfaceStrong,
  },
  actionBadgeText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  actionBadgeTextWarning: {
    color: colors.inkMain,
  },
  actionBadgeTextDanger: {
    color: colors.danger,
  },
  scopeLabel: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
    lineHeight: 18,
  },
  note: {
    fontSize: typeScale.tiny,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
