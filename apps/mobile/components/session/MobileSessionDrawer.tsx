import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import type { UniversalSession } from '../../state/mobileTypes';
import {
  sortUniversalSessions,
  type UniversalRuntimeStatus,
} from '@jibunkaigi/shared';
import {
  colors,
  mobileLayout,
  radius,
  shadow,
  spacing,
  type as typeScale,
} from '../../theme/tokens';
import { MobileSessionEditSheet } from './MobileSessionEditSheet';
import { MobileSessionListItem } from './MobileSessionListItem';
import { MobileLegalLinks } from '../settings/MobileLegalLinks';
import { MobileLegalSheet } from '../settings/MobileLegalSheet';
import { MobileStorageSheet } from '../settings/MobileStorageSheet';
import { MobileLanguageToggle } from '../settings/MobileLanguageToggle';
import { useT } from '../../i18n';

interface MobileSessionDrawerProps {
  visible: boolean;
  sessions: UniversalSession[];
  activeSessionId: string;
  runtimeStatus: UniversalRuntimeStatus;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string, title: string) => Promise<void>;
  onTogglePinSession: (sessionId: string) => Promise<void>;
  onCopyCurrentSession?: () => Promise<void>;
  onShareCurrentSession?: () => Promise<void>;
}

export function MobileSessionDrawer({
  visible,
  sessions,
  activeSessionId,
  runtimeStatus,
  onClose,
  onSelect,
  onDelete,
  onNewSession,
  onRenameSession,
  onTogglePinSession,
  onCopyCurrentSession,
  onShareCurrentSession,
}: MobileSessionDrawerProps) {
  const t = useT();
  const [editingSession, setEditingSession] = useState<UniversalSession | null>(null);
  const [legalSheetOpen, setLegalSheetOpen] = useState(false);
  const [storageSheetOpen, setStorageSheetOpen] = useState(false);
  const { width } = useWindowDimensions();
  const orderedSessions = useMemo(() => sortUniversalSessions(sessions), [sessions]);

  function handleSelect(id: string) {
    onSelect(id);
    onClose();
  }

  function handleNewSession() {
    onNewSession();
    onClose();
  }

  async function handleSaveTitle(title: string) {
    if (!editingSession) return;
    await onRenameSession(editingSession.id, title);
    setEditingSession(null);
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <SafeAreaView
            style={[
              styles.drawer,
              Platform.OS === 'android' && styles.drawerAndroid,
              width < 420 && styles.drawerCompact,
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{t('drawer.title')}</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t('drawer.close.aria')}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.langRow}>
              <MobileLanguageToggle />
            </View>

            <TouchableOpacity
              style={styles.newBtn}
              onPress={handleNewSession}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('drawer.new.aria')}
            >
              <Text style={styles.newBtnText}>{t('drawer.new')}</Text>
            </TouchableOpacity>

            <View style={styles.exportRow}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => {
                  void onCopyCurrentSession?.();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('drawer.copyAll.aria')}
              >
                <Text style={styles.exportButtonText}>{t('drawer.copyAll')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => {
                  void onShareCurrentSession?.();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('drawer.shareAll.aria')}
              >
                <Text style={styles.exportButtonText}>{t('drawer.shareAll')}</Text>
              </TouchableOpacity>
            </View>

            <MobileLegalLinks onOpenLegal={() => setLegalSheetOpen(true)} />
            <TouchableOpacity
              style={styles.storageButton}
              onPress={() => setStorageSheetOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('drawer.storage.aria')}
            >
              <Text style={styles.storageButtonText}>{t('drawer.storage')}</Text>
            </TouchableOpacity>

            <FlatList
              data={orderedSessions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <MobileSessionListItem
                  session={item}
                  isActive={item.id === activeSessionId}
                  onOpen={() => handleSelect(item.id)}
                  onEdit={() => setEditingSession(item)}
                  onTogglePin={() => {
                    void onTogglePinSession(item.id);
                  }}
                  onDelete={() => onDelete(item.id)}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{t('drawer.empty')}</Text>
              }
            />
          </SafeAreaView>
        </View>
      </Modal>

      <MobileSessionEditSheet
        visible={Boolean(editingSession)}
        title={editingSession?.title ?? ''}
        onClose={() => setEditingSession(null)}
        onSave={handleSaveTitle}
      />
      <MobileLegalSheet
        visible={legalSheetOpen}
        onClose={() => setLegalSheetOpen(false)}
      />
      <MobileStorageSheet
        visible={storageSheetOpen}
        status={runtimeStatus}
        onClose={() => setStorageSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayStrong,
  },
  drawer: {
    width: '84%',
    maxWidth: mobileLayout.drawerMaxWidth,
    backgroundColor: colors.surfaceSoft,
    ...shadow.soft,
  },
  drawerCompact: {
    width: '92%',
    maxWidth: mobileLayout.drawerMaxWidth,
  },
  drawerAndroid: {
    paddingTop: spacing.xl,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  drawerTitle: {
    fontSize: typeScale.heading,
    fontWeight: '700',
    color: colors.inkStrong,
    letterSpacing: -0.4,
  },
  langRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  closeBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: typeScale.body,
    color: colors.inkMuted,
  },
  newBtn: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accentSurface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentIndigo,
    alignItems: 'center',
  },
  newBtnText: {
    fontSize: typeScale.small,
    fontWeight: '600',
    color: colors.accentIndigo,
  },
  exportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  exportButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: typeScale.tiny,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  storageButton: {
    minHeight: 44,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceFaint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageButtonText: {
    fontSize: typeScale.tiny,
    fontWeight: '700',
    color: colors.inkMuted,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typeScale.small,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
